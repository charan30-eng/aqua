#include "aquabill.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_meters_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    char search[128] = {0};
    char status_filter[32] = {0};
    char customer_filter[32] = {0};
    extract_query_param(hm, "search", search, sizeof(search));
    extract_query_param(hm, "status", status_filter, sizeof(status_filter));
    extract_query_param(hm, "customer_id", customer_filter, sizeof(customer_filter));

    int64_t cust_id_param = 0;
    if (u.role == ROLE_CUSTOMER) {
        cust_id_param = u.customer_id;
    } else if (customer_filter[0] != '\0') {
        cust_id_param = atoll(customer_filter);
    }

    const char *sql =
        "SELECT m.meter_id, m.customer_id, m.meter_number, m.installation_date, m.status, "
        "u.name AS customer_name, u.email AS customer_email, c.address, "
        "COALESCE((SELECT MAX(r.current_reading) FROM readings r WHERE r.meter_id = m.meter_id), 0) AS latest_reading, "
        "COALESCE((SELECT r2.billing_period FROM readings r2 WHERE r2.meter_id = m.meter_id ORDER BY r2.billing_period DESC LIMIT 1), '') AS latest_period "
        "FROM meters m "
        "JOIN customers c ON c.customer_id = m.customer_id "
        "JOIN users u ON u.user_id = c.user_id "
        "WHERE (?1 = 0 OR m.customer_id = ?1) "
        "  AND (?2 = '' OR m.meter_number LIKE ?3 OR u.name LIKE ?3 OR c.address LIKE ?3) "
        "  AND (?4 = '' OR m.status = ?4) "
        "ORDER BY m.meter_id DESC;";

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to query meters.");
        return;
    }

    char like_pat[140];
    snprintf(like_pat, sizeof(like_pat), "%%%s%%", search);
    sqlite3_bind_int64(stmt, 1, cust_id_param);
    sqlite3_bind_text(stmt, 2, search, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, like_pat, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, status_filter, -1, SQLITE_TRANSIENT);

    cJSON *arr = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "meter_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddNumberToObject(row, "customer_id", (double)sqlite3_column_int64(stmt, 1));
        cJSON_AddStringToObject(row, "meter_number", (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddStringToObject(row, "installation_date", (const char *)sqlite3_column_text(stmt, 3));
        cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 4));
        cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 5));
        cJSON_AddStringToObject(row, "customer_email", (const char *)sqlite3_column_text(stmt, 6));
        cJSON_AddStringToObject(row, "address", (const char *)sqlite3_column_text(stmt, 7));
        cJSON_AddNumberToObject(row, "latest_reading", (double)sqlite3_column_int64(stmt, 8));
        cJSON_AddStringToObject(row, "latest_period", (const char *)sqlite3_column_text(stmt, 9));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "meters", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_meters_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    int64_t customer_id = 0;
    char meter_number[64], install_date[32], status[32];
    if (!json_get_int64(body, "customer_id", &customer_id) ||
        !json_get_string(body, "meter_number", meter_number, sizeof(meter_number))) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "customer_id and meter_number are required.");
        return;
    }
    if (!json_get_string(body, "installation_date", install_date, sizeof(install_date))) {
        current_date_utc(install_date, sizeof(install_date));
    }
    if (!json_get_string(body, "status", status, sizeof(status))) {
        safe_strncpy(status, "active", sizeof(status));
    }
    cJSON_Delete(body);

    if (!is_valid_date(install_date)) {
        send_error(c, 400, "INVALID_DATE", "installation_date must be YYYY-MM-DD.");
        return;
    }
    if (strcmp(status, "active") != 0 && strcmp(status, "inactive") != 0 && strcmp(status, "maintenance") != 0) {
        send_error(c, 400, "INVALID_STATUS", "Meter status must be active, inactive, or maintenance.");
        return;
    }

    /* Check customer exists */
    sqlite3_stmt *stmt = NULL;
    int64_t cust_user_id = 0;
    if (sqlite3_prepare_v2(db, "SELECT user_id FROM customers WHERE customer_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, customer_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) cust_user_id = sqlite3_column_int64(stmt, 0);
        sqlite3_finalize(stmt);
    }
    if (cust_user_id == 0) {
        send_error(c, 404, "CUSTOMER_NOT_FOUND", "Target customer does not exist.");
        return;
    }

    if (sqlite3_prepare_v2(db,
            "INSERT INTO meters (customer_id, meter_number, installation_date, status) VALUES (?, ?, ?, ?);",
            -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to prepare meter insert.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, customer_id);
    sqlite3_bind_text(stmt, 2, meter_number, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, install_date, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, status, -1, SQLITE_TRANSIENT);
    int rc = sqlite3_step(stmt);
    int64_t meter_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        send_error(c, rc == SQLITE_CONSTRAINT ? 409 : 500, "DUPLICATE_METER",
                   rc == SQLITE_CONSTRAINT ? "Meter number already exists." : "Failed to create meter.");
        return;
    }

    log_audit(db, u.user_id, "METER_ASSIGN", "meter", meter_id, meter_number);
    char nmsg[192];
    snprintf(nmsg, sizeof(nmsg), "Water meter %s has been assigned to your account.", meter_number);
    create_notification(db, cust_user_id, nmsg, "account_update");

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "meter_id", (double)meter_id);
    cJSON_AddStringToObject(resp, "meter_number", meter_number);
    cJSON_AddStringToObject(resp, "status", status);
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}

void handle_meters_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t meter_id) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    const char *sql =
        "SELECT m.meter_id, m.customer_id, m.meter_number, m.installation_date, m.status, u.name, c.address "
        "FROM meters m JOIN customers c ON c.customer_id = m.customer_id JOIN users u ON u.user_id = c.user_id "
        "WHERE m.meter_id = ? LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, meter_id);
    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        send_error(c, 404, "NOT_FOUND", "Meter not found.");
        return;
    }

    int64_t owner_cid = sqlite3_column_int64(stmt, 1);
    if (u.role == ROLE_CUSTOMER && owner_cid != u.customer_id) {
        sqlite3_finalize(stmt);
        send_error(c, 403, "FORBIDDEN", "You do not have permission to view this meter.");
        return;
    }

    cJSON *meter = cJSON_CreateObject();
    cJSON_AddNumberToObject(meter, "meter_id", (double)sqlite3_column_int64(stmt, 0));
    cJSON_AddNumberToObject(meter, "customer_id", (double)owner_cid);
    cJSON_AddStringToObject(meter, "meter_number", (const char *)sqlite3_column_text(stmt, 2));
    cJSON_AddStringToObject(meter, "installation_date", (const char *)sqlite3_column_text(stmt, 3));
    cJSON_AddStringToObject(meter, "status", (const char *)sqlite3_column_text(stmt, 4));
    cJSON_AddStringToObject(meter, "customer_name", (const char *)sqlite3_column_text(stmt, 5));
    cJSON_AddStringToObject(meter, "address", (const char *)sqlite3_column_text(stmt, 6));
    sqlite3_finalize(stmt);

    cJSON *readings = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db,
            "SELECT reading_id, previous_reading, current_reading, consumption, billing_period, reading_date "
            "FROM readings WHERE meter_id = ? ORDER BY billing_period DESC;",
            -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, meter_id);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *r = cJSON_CreateObject();
            cJSON_AddNumberToObject(r, "reading_id", (double)sqlite3_column_int64(stmt, 0));
            cJSON_AddNumberToObject(r, "previous_reading", (double)sqlite3_column_int64(stmt, 1));
            cJSON_AddNumberToObject(r, "current_reading", (double)sqlite3_column_int64(stmt, 2));
            cJSON_AddNumberToObject(r, "consumption", (double)sqlite3_column_int64(stmt, 3));
            cJSON_AddStringToObject(r, "billing_period", (const char *)sqlite3_column_text(stmt, 4));
            cJSON_AddStringToObject(r, "reading_date", (const char *)sqlite3_column_text(stmt, 5));
            cJSON_AddItemToArray(readings, r);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "meter", meter);
    cJSON_AddItemToObject(resp, "readings", readings);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_meters_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t meter_id) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    char meter_number[64], install_date[32], status[32];
    int64_t customer_id = 0;
    bool has_num = json_get_string(body, "meter_number", meter_number, sizeof(meter_number));
    bool has_date = json_get_string(body, "installation_date", install_date, sizeof(install_date));
    bool has_status = json_get_string(body, "status", status, sizeof(status));
    bool has_cid = json_get_int64(body, "customer_id", &customer_id);
    cJSON_Delete(body);

    if (has_date && !is_valid_date(install_date)) {
        send_error(c, 400, "INVALID_DATE", "installation_date must be YYYY-MM-DD.");
        return;
    }
    if (has_status && strcmp(status, "active") != 0 && strcmp(status, "inactive") != 0 && strcmp(status, "maintenance") != 0) {
        send_error(c, 400, "INVALID_STATUS", "Status must be active, inactive, or maintenance.");
        return;
    }

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db,
            "UPDATE meters SET "
            "customer_id = COALESCE(?, customer_id), "
            "meter_number = COALESCE(?, meter_number), "
            "installation_date = COALESCE(?, installation_date), "
            "status = COALESCE(?, status) "
            "WHERE meter_id = ?;", -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    if (has_cid && customer_id > 0) sqlite3_bind_int64(stmt, 1, customer_id);
    else sqlite3_bind_null(stmt, 1);
    if (has_num) sqlite3_bind_text(stmt, 2, meter_number, -1, SQLITE_TRANSIENT);
    else sqlite3_bind_null(stmt, 2);
    if (has_date) sqlite3_bind_text(stmt, 3, install_date, -1, SQLITE_TRANSIENT);
    else sqlite3_bind_null(stmt, 3);
    if (has_status) sqlite3_bind_text(stmt, 4, status, -1, SQLITE_TRANSIENT);
    else sqlite3_bind_null(stmt, 4);
    sqlite3_bind_int64(stmt, 5, meter_id);

    int rc = sqlite3_step(stmt);
    int changes = sqlite3_changes(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        send_error(c, 409, "CONFLICT", "Meter update violated unique meter number or foreign key constraint.");
        return;
    }
    if (changes == 0) {
        send_error(c, 404, "NOT_FOUND", "Meter not found.");
        return;
    }

    log_audit(db, u.user_id, "METER_UPDATE", "meter", meter_id, has_status ? status : "Updated meter details");
    send_ok_message(c, 200, "Meter updated successfully.");
}
