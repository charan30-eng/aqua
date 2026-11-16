#include "aquabill.h"
#include "crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_payments_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    char bill_f[32] = {0}, method_f[32] = {0}, status_f[32] = {0}, search_f[128] = {0};
    extract_query_param(hm, "bill_id", bill_f, sizeof(bill_f));
    extract_query_param(hm, "method", method_f, sizeof(method_f));
    extract_query_param(hm, "status", status_f, sizeof(status_f));
    extract_query_param(hm, "search", search_f, sizeof(search_f));

    int64_t cust_scope = (u.role == ROLE_CUSTOMER) ? u.customer_id : 0;
    int64_t bill_id_param = bill_f[0] ? atoll(bill_f) : 0;

    const char *sql =
        "SELECT p.payment_id, p.bill_id, b.bill_number, b.billing_period, b.customer_id, u.name AS customer_name, "
        "p.transaction_reference, p.amount, p.payment_method, p.payment_date, p.status, COALESCE(p.notes, '') "
        "FROM payments p "
        "JOIN bills b ON b.bill_id = p.bill_id "
        "JOIN customers c ON c.customer_id = b.customer_id "
        "JOIN users u ON u.user_id = c.user_id "
        "WHERE (?1 = 0 OR b.customer_id = ?1) "
        "  AND (?2 = 0 OR p.bill_id = ?2) "
        "  AND (?3 = '' OR p.payment_method = ?3) "
        "  AND (?4 = '' OR p.transaction_reference LIKE ?5 OR b.bill_number LIKE ?5 OR u.name LIKE ?5) "
        "  AND (?6 = '' OR p.status = ?6) "
        "ORDER BY p.payment_id DESC;";

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to query payments.");
        return;
    }

    char like_pat[140];
    snprintf(like_pat, sizeof(like_pat), "%%%s%%", search_f);
    sqlite3_bind_int64(stmt, 1, cust_scope);
    sqlite3_bind_int64(stmt, 2, bill_id_param);
    sqlite3_bind_text(stmt, 3, method_f, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, search_f, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, like_pat, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, status_f, -1, SQLITE_TRANSIENT);

    cJSON *arr = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "payment_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddNumberToObject(row, "bill_id", (double)sqlite3_column_int64(stmt, 1));
        cJSON_AddStringToObject(row, "bill_number", (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 3));
        cJSON_AddNumberToObject(row, "customer_id", (double)sqlite3_column_int64(stmt, 4));
        cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 5));
        cJSON_AddStringToObject(row, "transaction_reference", (const char *)sqlite3_column_text(stmt, 6));
        cJSON_AddNumberToObject(row, "amount", (double)sqlite3_column_int64(stmt, 7));
        cJSON_AddStringToObject(row, "payment_method", (const char *)sqlite3_column_text(stmt, 8));
        cJSON_AddStringToObject(row, "payment_date", (const char *)sqlite3_column_text(stmt, 9));
        cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 10));
        cJSON_AddStringToObject(row, "notes", (const char *)sqlite3_column_text(stmt, 11));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "payments", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_payments_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    /* Strictly admin-only: customers cannot mark their own bills as paid */
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    int64_t bill_id = 0, amount = 0;
    char method[32], txn_ref[64] = {0}, notes[256] = {0};
    if (!json_get_int64(body, "bill_id", &bill_id) ||
        !json_get_int64(body, "amount", &amount) ||
        !json_get_string(body, "payment_method", method, sizeof(method))) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "bill_id, amount (paise), and payment_method are required.");
        return;
    }
    bool has_ref = json_get_string(body, "transaction_reference", txn_ref, sizeof(txn_ref));
    json_get_string(body, "notes", notes, sizeof(notes));
    cJSON_Delete(body);

    if (amount <= 0) {
        send_error(c, 400, "INVALID_AMOUNT", "Payment amount must be greater than zero.");
        return;
    }
    if (strcmp(method, "Cash") != 0 && strcmp(method, "UPI") != 0 && strcmp(method, "Bank Transfer") != 0) {
        send_error(c, 400, "INVALID_METHOD", "payment_method must be Cash, UPI, or Bank Transfer.");
        return;
    }

    if (!has_ref) {
        char rnd[65];
        if (crypto_generate_token(rnd, sizeof(rnd))) {
            snprintf(txn_ref, sizeof(txn_ref), "TXN-AQB-%.10s", rnd);
        } else {
            snprintf(txn_ref, sizeof(txn_ref), "TXN-AQB-%lld", (long long)bill_id);
        }
    }

    sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION;", NULL, NULL, NULL);

    sqlite3_stmt *stmt = NULL;
    char bill_num[48] = {0}, bill_status[32] = {0};
    int64_t total_amt = 0, paid_amt = 0, cust_user_id = 0;
    const char *bsql =
        "SELECT b.bill_number, b.total_amount, b.paid_amount, b.status, c.user_id "
        "FROM bills b JOIN customers c ON c.customer_id = b.customer_id "
        "WHERE b.bill_id = ? LIMIT 1;";
    if (sqlite3_prepare_v2(db, bsql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, bill_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            safe_strncpy(bill_num, (const char *)sqlite3_column_text(stmt, 0), sizeof(bill_num));
            total_amt = sqlite3_column_int64(stmt, 1);
            paid_amt = sqlite3_column_int64(stmt, 2);
            safe_strncpy(bill_status, (const char *)sqlite3_column_text(stmt, 3), sizeof(bill_status));
            cust_user_id = sqlite3_column_int64(stmt, 4);
        }
        sqlite3_finalize(stmt);
    }

    if (bill_num[0] == '\0') {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 404, "NOT_FOUND", "Bill not found.");
        return;
    }
    if (strcmp(bill_status, "cancelled") == 0) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 409, "BILL_CANCELLED", "Cannot record payment against a cancelled bill.");
        return;
    }
    if (strcmp(bill_status, "paid") == 0 || paid_amt >= total_amt) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 409, "ALREADY_PAID", "This bill is already fully paid.");
        return;
    }

    int64_t balance_due = total_amt - paid_amt;
    if (amount > balance_due) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 400, "OVERPAYMENT", "Payment amount exceeds remaining bill balance.");
        return;
    }

    if (sqlite3_prepare_v2(db,
            "INSERT INTO payments (bill_id, transaction_reference, amount, payment_method, status, notes) "
            "VALUES (?, ?, ?, ?, 'completed', ?);", -1, &stmt, NULL) != SQLITE_OK) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 500, "DB_ERROR", "Failed to prepare payment insert.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, bill_id);
    sqlite3_bind_text(stmt, 2, txn_ref, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 3, amount);
    sqlite3_bind_text(stmt, 4, method, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, notes, -1, SQLITE_TRANSIENT);
    int rc = sqlite3_step(stmt);
    int64_t payment_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, rc == SQLITE_CONSTRAINT ? 409 : 500, "DUPLICATE_TRANSACTION",
                   rc == SQLITE_CONSTRAINT ? "Duplicate transaction reference detected." : "Failed to record payment.");
        return;
    }

    int64_t new_paid = paid_amt + amount;
    const char *new_status = (new_paid >= total_amt) ? "paid" : "partial";

    if (sqlite3_prepare_v2(db, "UPDATE bills SET paid_amount = ?, status = ? WHERE bill_id = ?;",
                           -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, new_paid);
        sqlite3_bind_text(stmt, 2, new_status, -1, SQLITE_STATIC);
        sqlite3_bind_int64(stmt, 3, bill_id);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    char msg[256];
    snprintf(msg, sizeof(msg),
             "Payment of Rs %.2f received via %s for bill %s (Ref: %s). Bill status: %s.",
             (double)amount / 100.0, method, bill_num, txn_ref, new_status);
    create_notification(db, cust_user_id, msg, "payment_received");
    log_audit(db, u.user_id, "PAYMENT_RECORD", "payment", payment_id, txn_ref);

    sqlite3_exec(db, "COMMIT;", NULL, NULL, NULL);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "payment_id", (double)payment_id);
    cJSON_AddNumberToObject(resp, "bill_id", (double)bill_id);
    cJSON_AddStringToObject(resp, "transaction_reference", txn_ref);
    cJSON_AddNumberToObject(resp, "amount", (double)amount);
    cJSON_AddStringToObject(resp, "payment_method", method);
    cJSON_AddStringToObject(resp, "bill_status", new_status);
    cJSON_AddNumberToObject(resp, "remaining_balance", (double)(total_amt - new_paid));
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}
