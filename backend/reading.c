#include "aquabill.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_readings_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    char meter_param[32] = {0};
    char period_param[16] = {0};
    extract_query_param(hm, "meter_id", meter_param, sizeof(meter_param));
    extract_query_param(hm, "period", period_param, sizeof(period_param));

    int64_t meter_id = meter_param[0] ? atoll(meter_param) : 0;
    int64_t cust_scope = (u.role == ROLE_CUSTOMER) ? u.customer_id : 0;

    const char *sql =
        "SELECT r.reading_id, r.meter_id, m.meter_number, m.customer_id, u.name AS customer_name, "
        "r.previous_reading, r.current_reading, r.consumption, r.billing_period, r.reading_date, r.created_at, "
        "COALESCE((SELECT b.bill_id FROM bills b WHERE b.reading_id = r.reading_id AND b.status != 'cancelled' LIMIT 1), 0) AS active_bill_id "
        "FROM readings r "
        "JOIN meters m ON m.meter_id = r.meter_id "
        "JOIN customers c ON c.customer_id = m.customer_id "
        "JOIN users u ON u.user_id = c.user_id "
        "WHERE (?1 = 0 OR m.customer_id = ?1) "
        "  AND (?2 = 0 OR r.meter_id = ?2) "
        "  AND (?3 = '' OR r.billing_period = ?3) "
        "ORDER BY r.billing_period DESC, r.reading_id DESC;";

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to query readings.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, cust_scope);
    sqlite3_bind_int64(stmt, 2, meter_id);
    sqlite3_bind_text(stmt, 3, period_param, -1, SQLITE_TRANSIENT);

    cJSON *arr = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "reading_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddNumberToObject(row, "meter_id", (double)sqlite3_column_int64(stmt, 1));
        cJSON_AddStringToObject(row, "meter_number", (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddNumberToObject(row, "customer_id", (double)sqlite3_column_int64(stmt, 3));
        cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 4));
        cJSON_AddNumberToObject(row, "previous_reading", (double)sqlite3_column_int64(stmt, 5));
        cJSON_AddNumberToObject(row, "current_reading", (double)sqlite3_column_int64(stmt, 6));
        cJSON_AddNumberToObject(row, "consumption", (double)sqlite3_column_int64(stmt, 7));
        cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 8));
        cJSON_AddStringToObject(row, "reading_date", (const char *)sqlite3_column_text(stmt, 9));
        cJSON_AddStringToObject(row, "created_at", (const char *)sqlite3_column_text(stmt, 10));
        int64_t active_bill_id = sqlite3_column_int64(stmt, 11);
        cJSON_AddBoolToObject(row, "billed", active_bill_id > 0);
        if (active_bill_id > 0) cJSON_AddNumberToObject(row, "bill_id", (double)active_bill_id);
        else cJSON_AddNullToObject(row, "bill_id");
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "readings", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_readings_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    int64_t meter_id = 0, prev_reading = -1, curr_reading = -1;
    char billing_period[16], reading_date[16];
    if (!json_get_int64(body, "meter_id", &meter_id) ||
        !json_get_int64(body, "current_reading", &curr_reading) ||
        !json_get_string(body, "billing_period", billing_period, sizeof(billing_period))) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "meter_id, current_reading, and billing_period (YYYY-MM) are required.");
        return;
    }
    bool has_prev = json_get_int64(body, "previous_reading", &prev_reading);
    if (!json_get_string(body, "reading_date", reading_date, sizeof(reading_date))) {
        current_date_utc(reading_date, sizeof(reading_date));
    }
    cJSON_Delete(body);

    if (!is_valid_period(billing_period)) {
        send_error(c, 400, "INVALID_PERIOD", "billing_period must follow YYYY-MM format.");
        return;
    }
    if (!is_valid_date(reading_date)) {
        send_error(c, 400, "INVALID_DATE", "reading_date must follow YYYY-MM-DD format.");
        return;
    }

    /* Verify meter exists and is active */
    sqlite3_stmt *stmt = NULL;
    char meter_status[32] = {0};
    char meter_number[64] = {0};
    int64_t cust_user_id = 0;
    if (sqlite3_prepare_v2(db,
            "SELECT m.status, m.meter_number, c.user_id FROM meters m "
            "JOIN customers c ON c.customer_id = m.customer_id WHERE m.meter_id = ? LIMIT 1;",
            -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, meter_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            safe_strncpy(meter_status, (const char *)sqlite3_column_text(stmt, 0), sizeof(meter_status));
            safe_strncpy(meter_number, (const char *)sqlite3_column_text(stmt, 1), sizeof(meter_number));
            cust_user_id = sqlite3_column_int64(stmt, 2);
        }
        sqlite3_finalize(stmt);
    }

    if (meter_status[0] == '\0') {
        send_error(c, 404, "INVALID_METER", "Target meter ID does not exist.");
        return;
    }
    if (strcmp(meter_status, "active") != 0) {
        send_error(c, 409, "METER_NOT_ACTIVE", "Cannot record reading on an inactive or maintenance meter.");
        return;
    }

    /* Auto-populate previous_reading from latest meter reading if omitted */
    int64_t last_reading = 0;
    bool has_last = false;
    if (sqlite3_prepare_v2(db,
            "SELECT current_reading FROM readings WHERE meter_id = ? ORDER BY billing_period DESC, reading_id DESC LIMIT 1;",
            -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, meter_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            last_reading = sqlite3_column_int64(stmt, 0);
            has_last = true;
        }
        sqlite3_finalize(stmt);
    }
    if (!has_prev) {
        prev_reading = has_last ? last_reading : 0;
    }

    if (prev_reading < 0 || curr_reading < 0) {
        send_error(c, 400, "NEGATIVE_READING", "Meter readings cannot be negative.");
        return;
    }
    if (curr_reading < prev_reading) {
        send_error(c, 400, "INVALID_READING", "Current reading cannot be lower than previous reading.");
        return;
    }

    int64_t consumption = curr_reading - prev_reading;

    if (sqlite3_prepare_v2(db,
            "INSERT INTO readings (meter_id, previous_reading, current_reading, consumption, billing_period, reading_date) "
            "VALUES (?, ?, ?, ?, ?, ?);", -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, meter_id);
    sqlite3_bind_int64(stmt, 2, prev_reading);
    sqlite3_bind_int64(stmt, 3, curr_reading);
    sqlite3_bind_int64(stmt, 4, consumption);
    sqlite3_bind_text(stmt, 5, billing_period, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, reading_date, -1, SQLITE_TRANSIENT);

    int rc = sqlite3_step(stmt);
    int64_t reading_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        send_error(c, rc == SQLITE_CONSTRAINT ? 409 : 500, "DUPLICATE_READING",
                   rc == SQLITE_CONSTRAINT ? "A reading already exists for this meter and billing period." : "Failed to save reading.");
        return;
    }

    char audit_msg[192];
    snprintf(audit_msg, sizeof(audit_msg), "Meter %s (%s): %lld -> %lld KL (%lld KL)",
             meter_number, billing_period, (long long)prev_reading, (long long)curr_reading, (long long)consumption);
    log_audit(db, u.user_id, "READING_CREATE", "reading", reading_id, audit_msg);

    if (consumption >= 35 && cust_user_id > 0) {
        char alert_msg[256];
        snprintf(alert_msg, sizeof(alert_msg),
                 "High water usage alert on meter %s for %s (%lld KL recorded). Please inspect plumbing for potential leaks.",
                 meter_number, billing_period, (long long)consumption);
        create_notification(db, cust_user_id, alert_msg, "account_update");
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "reading_id", (double)reading_id);
    cJSON_AddNumberToObject(resp, "meter_id", (double)meter_id);
    cJSON_AddNumberToObject(resp, "previous_reading", (double)prev_reading);
    cJSON_AddNumberToObject(resp, "current_reading", (double)curr_reading);
    cJSON_AddNumberToObject(resp, "consumption", (double)consumption);
    cJSON_AddStringToObject(resp, "billing_period", billing_period);
    cJSON_AddStringToObject(resp, "reading_date", reading_date);
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}

void handle_readings_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t reading_id) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    const char *sql =
        "SELECT r.reading_id, r.meter_id, m.meter_number, m.customer_id, u.name, "
        "r.previous_reading, r.current_reading, r.consumption, r.billing_period, r.reading_date "
        "FROM readings r JOIN meters m ON m.meter_id = r.meter_id "
        "JOIN customers c ON c.customer_id = m.customer_id JOIN users u ON u.user_id = c.user_id "
        "WHERE r.reading_id = ? LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, reading_id);
    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        send_error(c, 404, "NOT_FOUND", "Reading not found.");
        return;
    }

    int64_t owner_cid = sqlite3_column_int64(stmt, 3);
    if (u.role == ROLE_CUSTOMER && owner_cid != u.customer_id) {
        sqlite3_finalize(stmt);
        send_error(c, 403, "FORBIDDEN", "Access denied to this reading.");
        return;
    }

    cJSON *row = cJSON_CreateObject();
    cJSON_AddNumberToObject(row, "reading_id", (double)sqlite3_column_int64(stmt, 0));
    cJSON_AddNumberToObject(row, "meter_id", (double)sqlite3_column_int64(stmt, 1));
    cJSON_AddStringToObject(row, "meter_number", (const char *)sqlite3_column_text(stmt, 2));
    cJSON_AddNumberToObject(row, "customer_id", (double)owner_cid);
    cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 4));
    cJSON_AddNumberToObject(row, "previous_reading", (double)sqlite3_column_int64(stmt, 5));
    cJSON_AddNumberToObject(row, "current_reading", (double)sqlite3_column_int64(stmt, 6));
    cJSON_AddNumberToObject(row, "consumption", (double)sqlite3_column_int64(stmt, 7));
    cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 8));
    cJSON_AddStringToObject(row, "reading_date", (const char *)sqlite3_column_text(stmt, 9));
    sqlite3_finalize(stmt);

    send_json(c, 200, row);
    cJSON_Delete(row);
}
