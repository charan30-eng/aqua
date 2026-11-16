#include "aquabill.h"
#include "crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_customers_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    char search[128] = {0};
    char status_filter[32] = {0};
    extract_query_param(hm, "search", search, sizeof(search));
    extract_query_param(hm, "status", status_filter, sizeof(status_filter));

    const char *sql =
        "SELECT c.customer_id, u.user_id, u.name, u.email, c.phone, c.address, u.status, c.created_at, "
        "(SELECT COUNT(*) FROM meters m WHERE m.customer_id = c.customer_id) AS meter_count, "
        "(SELECT COALESCE(SUM(b.total_amount - b.paid_amount), 0) FROM bills b "
        " WHERE b.customer_id = c.customer_id AND b.status IN ('unpaid', 'partial', 'overdue')) AS outstanding_paise "
        "FROM customers c "
        "JOIN users u ON u.user_id = c.user_id "
        "WHERE (?1 = '' OR u.name LIKE ?2 OR u.email LIKE ?2 OR c.phone LIKE ?2 OR c.address LIKE ?2) "
        "  AND (?3 = '' OR u.status = ?3) "
        "ORDER BY c.customer_id DESC;";

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to query customers.");
        return;
    }

    char like_pat[140];
    snprintf(like_pat, sizeof(like_pat), "%%%s%%", search);
    sqlite3_bind_text(stmt, 1, search, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, like_pat, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, status_filter, -1, SQLITE_TRANSIENT);

    cJSON *arr = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "customer_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddNumberToObject(row, "user_id", (double)sqlite3_column_int64(stmt, 1));
        cJSON_AddStringToObject(row, "name", (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddStringToObject(row, "email", (const char *)sqlite3_column_text(stmt, 3));
        cJSON_AddStringToObject(row, "phone", (const char *)sqlite3_column_text(stmt, 4));
        cJSON_AddStringToObject(row, "address", (const char *)sqlite3_column_text(stmt, 5));
        cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 6));
        cJSON_AddStringToObject(row, "created_at", (const char *)sqlite3_column_text(stmt, 7));
        cJSON_AddNumberToObject(row, "meter_count", (double)sqlite3_column_int64(stmt, 8));
        cJSON_AddNumberToObject(row, "outstanding_paise", (double)sqlite3_column_int64(stmt, 9));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "customers", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_customers_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    char name[128], email[128], password[128], phone[64], address[256], meter_number[64] = {0};
    if (!json_get_string(body, "name", name, sizeof(name)) ||
        !json_get_string(body, "email", email, sizeof(email)) ||
        !json_get_string(body, "phone", phone, sizeof(phone)) ||
        !json_get_string(body, "address", address, sizeof(address))) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "Name, email, phone, and address are required.");
        return;
    }
    if (!json_get_string(body, "password", password, sizeof(password))) {
        safe_strncpy(password, "Customer@1234", sizeof(password));
    }
    bool has_meter = json_get_string(body, "meter_number", meter_number, sizeof(meter_number));
    cJSON_Delete(body);

    if (!is_valid_email(email)) {
        send_error(c, 400, "INVALID_EMAIL", "Please provide a valid email address.");
        return;
    }
    if (strlen(password) < 8) {
        send_error(c, 400, "WEAK_PASSWORD", "Password must be at least 8 characters long.");
        return;
    }

    char pass_hash[PASSWORD_HASH_BUFSZ];
    if (!crypto_hash_password(password, pass_hash, sizeof(pass_hash))) {
        send_error(c, 500, "CRYPTO_ERROR", "Password hashing failed.");
        return;
    }

    char *errmsg = NULL;
    if (sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION;", NULL, NULL, &errmsg) != SQLITE_OK) {
        sqlite3_free(errmsg);
        send_error(c, 500, "DB_ERROR", "Failed to start transaction.");
        return;
    }

    sqlite3_stmt *stmt = NULL;
    sqlite3_prepare_v2(db, "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'customer', 'active');",
                       -1, &stmt, NULL);
    sqlite3_bind_text(stmt, 1, name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, pass_hash, -1, SQLITE_TRANSIENT);
    int rc = sqlite3_step(stmt);
    int64_t new_user_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, rc == SQLITE_CONSTRAINT ? 409 : 500, "DUPLICATE_EMAIL",
                   rc == SQLITE_CONSTRAINT ? "A user with this email already exists." : "Failed to create user.");
        return;
    }

    sqlite3_prepare_v2(db, "INSERT INTO customers (user_id, phone, address) VALUES (?, ?, ?);",
                       -1, &stmt, NULL);
    sqlite3_bind_int64(stmt, 1, new_user_id);
    sqlite3_bind_text(stmt, 2, phone, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, address, -1, SQLITE_TRANSIENT);
    rc = sqlite3_step(stmt);
    int64_t new_customer_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 500, "DB_ERROR", "Failed to insert customer record.");
        return;
    }

    if (has_meter) {
        char today[16];
        current_date_utc(today, sizeof(today));
        sqlite3_prepare_v2(db, "INSERT INTO meters (customer_id, meter_number, installation_date, status) VALUES (?, ?, ?, 'active');",
                           -1, &stmt, NULL);
        sqlite3_bind_int64(stmt, 1, new_customer_id);
        sqlite3_bind_text(stmt, 2, meter_number, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, today, -1, SQLITE_TRANSIENT);
        rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        if (rc != SQLITE_DONE) {
            sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
            send_error(c, 409, "DUPLICATE_METER", "Meter number is already registered.");
            return;
        }
    }

    log_audit(db, u.user_id, "CUSTOMER_CREATE", "customer", new_customer_id, email);
    create_notification(db, new_user_id, "Your AquaBill customer account has been created by the administrator.", "account_update");

    sqlite3_exec(db, "COMMIT;", NULL, NULL, NULL);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "customer_id", (double)new_customer_id);
    cJSON_AddNumberToObject(resp, "user_id", (double)new_user_id);
    cJSON_AddStringToObject(resp, "name", name);
    cJSON_AddStringToObject(resp, "email", email);
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}

void handle_customers_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t customer_id) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    const char *sql =
        "SELECT c.customer_id, u.user_id, u.name, u.email, c.phone, c.address, u.status, c.created_at "
        "FROM customers c JOIN users u ON u.user_id = c.user_id WHERE c.customer_id = ? LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, customer_id);
    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        send_error(c, 404, "NOT_FOUND", "Customer not found.");
        return;
    }

    cJSON *cust = cJSON_CreateObject();
    cJSON_AddNumberToObject(cust, "customer_id", (double)sqlite3_column_int64(stmt, 0));
    cJSON_AddNumberToObject(cust, "user_id", (double)sqlite3_column_int64(stmt, 1));
    cJSON_AddStringToObject(cust, "name", (const char *)sqlite3_column_text(stmt, 2));
    cJSON_AddStringToObject(cust, "email", (const char *)sqlite3_column_text(stmt, 3));
    cJSON_AddStringToObject(cust, "phone", (const char *)sqlite3_column_text(stmt, 4));
    cJSON_AddStringToObject(cust, "address", (const char *)sqlite3_column_text(stmt, 5));
    cJSON_AddStringToObject(cust, "status", (const char *)sqlite3_column_text(stmt, 6));
    cJSON_AddStringToObject(cust, "created_at", (const char *)sqlite3_column_text(stmt, 7));
    sqlite3_finalize(stmt);

    /* Meters */
    cJSON *meters = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db, "SELECT meter_id, meter_number, installation_date, status FROM meters WHERE customer_id = ?;",
                           -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, customer_id);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *m = cJSON_CreateObject();
            cJSON_AddNumberToObject(m, "meter_id", (double)sqlite3_column_int64(stmt, 0));
            cJSON_AddStringToObject(m, "meter_number", (const char *)sqlite3_column_text(stmt, 1));
            cJSON_AddStringToObject(m, "installation_date", (const char *)sqlite3_column_text(stmt, 2));
            cJSON_AddStringToObject(m, "status", (const char *)sqlite3_column_text(stmt, 3));
            cJSON_AddItemToArray(meters, m);
        }
        sqlite3_finalize(stmt);
    }

    /* Recent bills */
    cJSON *bills = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db,
            "SELECT bill_id, bill_number, billing_period, total_amount, paid_amount, due_date, status "
            "FROM bills WHERE customer_id = ? ORDER BY bill_id DESC LIMIT 24;",
            -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, customer_id);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *b = cJSON_CreateObject();
            cJSON_AddNumberToObject(b, "bill_id", (double)sqlite3_column_int64(stmt, 0));
            cJSON_AddStringToObject(b, "bill_number", (const char *)sqlite3_column_text(stmt, 1));
            cJSON_AddStringToObject(b, "billing_period", (const char *)sqlite3_column_text(stmt, 2));
            cJSON_AddNumberToObject(b, "total_amount", (double)sqlite3_column_int64(stmt, 3));
            cJSON_AddNumberToObject(b, "paid_amount", (double)sqlite3_column_int64(stmt, 4));
            cJSON_AddStringToObject(b, "due_date", (const char *)sqlite3_column_text(stmt, 5));
            cJSON_AddStringToObject(b, "status", (const char *)sqlite3_column_text(stmt, 6));
            cJSON_AddItemToArray(bills, b);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "customer", cust);
    cJSON_AddItemToObject(resp, "meters", meters);
    cJSON_AddItemToObject(resp, "bills", bills);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_customers_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t customer_id) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    char name[128], phone[64], address[256], status[32];
    bool has_name = json_get_string(body, "name", name, sizeof(name));
    bool has_phone = json_get_string(body, "phone", phone, sizeof(phone));
    bool has_address = json_get_string(body, "address", address, sizeof(address));
    bool has_status = json_get_string(body, "status", status, sizeof(status));
    cJSON_Delete(body);

    if (has_status && strcmp(status, "active") != 0 && strcmp(status, "inactive") != 0 && strcmp(status, "suspended") != 0) {
        send_error(c, 400, "INVALID_STATUS", "Status must be active, inactive, or suspended.");
        return;
    }

    sqlite3_stmt *stmt = NULL;
    int64_t target_user_id = 0;
    if (sqlite3_prepare_v2(db, "SELECT user_id FROM customers WHERE customer_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, customer_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            target_user_id = sqlite3_column_int64(stmt, 0);
        }
        sqlite3_finalize(stmt);
    }
    if (target_user_id == 0) {
        send_error(c, 404, "NOT_FOUND", "Customer not found.");
        return;
    }

    if (has_name || has_status) {
        sqlite3_prepare_v2(db,
            "UPDATE users SET name = COALESCE(?, name), status = COALESCE(?, status) WHERE user_id = ?;",
            -1, &stmt, NULL);
        if (has_name) sqlite3_bind_text(stmt, 1, name, -1, SQLITE_TRANSIENT);
        else sqlite3_bind_null(stmt, 1);
        if (has_status) sqlite3_bind_text(stmt, 2, status, -1, SQLITE_TRANSIENT);
        else sqlite3_bind_null(stmt, 2);
        sqlite3_bind_int64(stmt, 3, target_user_id);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    if (has_phone || has_address) {
        sqlite3_prepare_v2(db,
            "UPDATE customers SET phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE customer_id = ?;",
            -1, &stmt, NULL);
        if (has_phone) sqlite3_bind_text(stmt, 1, phone, -1, SQLITE_TRANSIENT);
        else sqlite3_bind_null(stmt, 1);
        if (has_address) sqlite3_bind_text(stmt, 2, address, -1, SQLITE_TRANSIENT);
        else sqlite3_bind_null(stmt, 2);
        sqlite3_bind_int64(stmt, 3, customer_id);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    log_audit(db, u.user_id, "CUSTOMER_UPDATE", "customer", customer_id, "Updated customer profile/status.");
    send_ok_message(c, 200, "Customer updated successfully.");
}

void handle_customers_delete(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t customer_id) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    sqlite3_stmt *stmt = NULL;
    int64_t target_user_id = 0;
    if (sqlite3_prepare_v2(db, "SELECT user_id FROM customers WHERE customer_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, customer_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            target_user_id = sqlite3_column_int64(stmt, 0);
        }
        sqlite3_finalize(stmt);
    }
    if (target_user_id == 0) {
        send_error(c, 404, "NOT_FOUND", "Customer not found.");
        return;
    }

    /* Check if customer has bills; if so, deactivate instead of destructive delete to preserve financial audit trail */
    int bill_count = 0;
    if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM bills WHERE customer_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, customer_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) bill_count = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
    }

    if (bill_count > 0) {
        sqlite3_prepare_v2(db, "UPDATE users SET status = 'inactive' WHERE user_id = ?;", -1, &stmt, NULL);
        sqlite3_bind_int64(stmt, 1, target_user_id);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        log_audit(db, u.user_id, "CUSTOMER_DEACTIVATE", "customer", customer_id,
                  "Deactivated customer (financial records preserved).");
        send_ok_message(c, 200, "Customer deactivated (historical billing records preserved).");
        return;
    }

    sqlite3_prepare_v2(db, "DELETE FROM users WHERE user_id = ?;", -1, &stmt, NULL);
    sqlite3_bind_int64(stmt, 1, target_user_id);
    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    if (rc != SQLITE_DONE) {
        send_error(c, 409, "CONFLICT", "Cannot delete customer because linked meter readings exist.");
        return;
    }

    log_audit(db, u.user_id, "CUSTOMER_DELETE", "customer", customer_id, "Deleted customer with no billing history.");
    send_ok_message(c, 200, "Customer removed successfully.");
}
