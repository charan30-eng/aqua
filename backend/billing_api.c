#include "aquabill.h"
#include "billing.h"
#include "database.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static bool load_tariff_by_id(sqlite3 *db, int64_t tariff_id, tariff_rule_t *out_rule, int64_t *out_id) {
    const char *sql =
        tariff_id > 0
        ? "SELECT tariff_id, billing_mode, rate_per_kl, fixed_charge, tax_percentage, COALESCE(slab_config, '') "
          "FROM tariffs WHERE tariff_id = ? LIMIT 1;"
        : "SELECT tariff_id, billing_mode, rate_per_kl, fixed_charge, tax_percentage, COALESCE(slab_config, '') "
          "FROM tariffs WHERE status = 'active' ORDER BY tariff_id DESC LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;
    if (tariff_id > 0) sqlite3_bind_int64(stmt, 1, tariff_id);

    bool ok = false;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        if (out_id) *out_id = sqlite3_column_int64(stmt, 0);
        const char *mode_str = (const char *)sqlite3_column_text(stmt, 1);
        out_rule->mode = (mode_str && strcmp(mode_str, "slab") == 0) ? TARIFF_MODE_SLAB : TARIFF_MODE_FLAT;
        out_rule->rate_per_kl_paise = sqlite3_column_int64(stmt, 2);
        out_rule->fixed_charge_paise = sqlite3_column_int64(stmt, 3);
        out_rule->tax_bps = sqlite3_column_int64(stmt, 4);
        safe_strncpy(out_rule->slab_config, (const char *)sqlite3_column_text(stmt, 5), sizeof(out_rule->slab_config));
        ok = true;
    }
    sqlite3_finalize(stmt);
    return ok;
}

void handle_tariffs_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    const char *sql =
        "SELECT tariff_id, name, billing_mode, rate_per_kl, fixed_charge, tax_percentage, "
        "COALESCE(slab_config, ''), effective_from, COALESCE(effective_until, ''), status, created_at "
        "FROM tariffs ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END, tariff_id DESC;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to query tariffs.");
        return;
    }

    cJSON *arr = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "tariff_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddStringToObject(row, "name", (const char *)sqlite3_column_text(stmt, 1));
        cJSON_AddStringToObject(row, "billing_mode", (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddNumberToObject(row, "rate_per_kl", (double)sqlite3_column_int64(stmt, 3));
        cJSON_AddNumberToObject(row, "fixed_charge", (double)sqlite3_column_int64(stmt, 4));
        cJSON_AddNumberToObject(row, "tax_percentage", (double)sqlite3_column_int64(stmt, 5));
        cJSON_AddStringToObject(row, "slab_config", (const char *)sqlite3_column_text(stmt, 6));
        cJSON_AddStringToObject(row, "effective_from", (const char *)sqlite3_column_text(stmt, 7));
        cJSON_AddStringToObject(row, "effective_until", (const char *)sqlite3_column_text(stmt, 8));
        cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 9));
        cJSON_AddStringToObject(row, "created_at", (const char *)sqlite3_column_text(stmt, 10));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "tariffs", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_tariffs_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    char name[128], mode[16], slab_config[256] = {0}, effective_from[16];
    int64_t rate_per_kl = 0, fixed_charge = 0, tax_bps = 0;
    if (!json_get_string(body, "name", name, sizeof(name)) ||
        !json_get_int64(body, "rate_per_kl", &rate_per_kl) ||
        !json_get_int64(body, "fixed_charge", &fixed_charge)) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "name, rate_per_kl (paise), and fixed_charge (paise) are required.");
        return;
    }
    if (!json_get_string(body, "billing_mode", mode, sizeof(mode))) safe_strncpy(mode, "flat", sizeof(mode));
    json_get_int64(body, "tax_percentage", &tax_bps);
    json_get_string(body, "slab_config", slab_config, sizeof(slab_config));
    if (!json_get_string(body, "effective_from", effective_from, sizeof(effective_from))) {
        current_date_utc(effective_from, sizeof(effective_from));
    }
    cJSON *act_item = cJSON_GetObjectItemCaseSensitive(body, "activate");
    bool activate = cJSON_IsBool(act_item) && cJSON_IsTrue(act_item);
    cJSON_Delete(body);

    if (rate_per_kl < 0 || fixed_charge < 0 || tax_bps < 0 || tax_bps > 10000) {
        send_error(c, 400, "INVALID_TARIFF", "Rates must be non-negative and tax_percentage must be 0..10000 bps.");
        return;
    }
    if (strcmp(mode, "flat") != 0 && strcmp(mode, "slab") != 0) {
        send_error(c, 400, "INVALID_MODE", "billing_mode must be flat or slab.");
        return;
    }
    if (strcmp(mode, "slab") == 0) {
        tariff_slab_t slabs[16];
        if (billing_parse_slabs(slab_config, slabs, 16) <= 0) {
            send_error(c, 400, "INVALID_SLABS", "slab_config must use format '0-10:800,11-20:1200,21+:1600'.");
            return;
        }
    }
    if (!is_valid_date(effective_from)) {
        send_error(c, 400, "INVALID_DATE", "effective_from must be YYYY-MM-DD.");
        return;
    }

    sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION;", NULL, NULL, NULL);
    if (activate) {
        sqlite3_exec(db, "UPDATE tariffs SET status = 'inactive' WHERE status = 'active';", NULL, NULL, NULL);
    }

    sqlite3_stmt *stmt = NULL;
    sqlite3_prepare_v2(db,
        "INSERT INTO tariffs (name, billing_mode, rate_per_kl, fixed_charge, tax_percentage, slab_config, effective_from, status) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?);", -1, &stmt, NULL);
    sqlite3_bind_text(stmt, 1, name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, mode, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 3, rate_per_kl);
    sqlite3_bind_int64(stmt, 4, fixed_charge);
    sqlite3_bind_int64(stmt, 5, tax_bps);
    sqlite3_bind_text(stmt, 6, slab_config, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 7, effective_from, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 8, activate ? "active" : "inactive", -1, SQLITE_STATIC);
    int rc = sqlite3_step(stmt);
    int64_t tariff_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 500, "DB_ERROR", "Failed to save tariff.");
        return;
    }

    log_audit(db, u.user_id, "TARIFF_CREATE", "tariff", tariff_id, name);
    sqlite3_exec(db, "COMMIT;", NULL, NULL, NULL);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "tariff_id", (double)tariff_id);
    cJSON_AddStringToObject(resp, "name", name);
    cJSON_AddStringToObject(resp, "status", activate ? "active" : "inactive");
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}

void handle_tariffs_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t tariff_id) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    char status[32], name[128], mode[16], slab_config[256];
    bool has_status = json_get_string(body, "status", status, sizeof(status));
    bool has_name = json_get_string(body, "name", name, sizeof(name));
    bool has_mode = json_get_string(body, "billing_mode", mode, sizeof(mode));
    bool has_slabs = json_get_string(body, "slab_config", slab_config, sizeof(slab_config));
    int64_t rate_per_kl = -1, fixed_charge = -1, tax_bps = -1;
    bool has_rate = json_get_int64(body, "rate_per_kl", &rate_per_kl);
    bool has_fixed = json_get_int64(body, "fixed_charge", &fixed_charge);
    bool has_tax = json_get_int64(body, "tax_percentage", &tax_bps);
    cJSON_Delete(body);

    if (has_status && strcmp(status, "active") != 0 && strcmp(status, "inactive") != 0) {
        send_error(c, 400, "INVALID_STATUS", "Status must be active or inactive.");
        return;
    }
    if (has_mode && strcmp(mode, "flat") != 0 && strcmp(mode, "slab") != 0) {
        send_error(c, 400, "INVALID_MODE", "billing_mode must be flat or slab.");
        return;
    }
    if (has_mode && strcmp(mode, "slab") == 0 && has_slabs) {
        tariff_slab_t slabs[16];
        if (billing_parse_slabs(slab_config, slabs, 16) <= 0) {
            send_error(c, 400, "INVALID_SLABS", "slab_config must use format '0-10:800,11-20:1200,21+:1600'.");
            return;
        }
    }

    sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION;", NULL, NULL, NULL);
    if (has_status && strcmp(status, "active") == 0) {
        sqlite3_exec(db, "UPDATE tariffs SET status = 'inactive' WHERE status = 'active';", NULL, NULL, NULL);
    }

    sqlite3_stmt *stmt = NULL;
    sqlite3_prepare_v2(db,
        "UPDATE tariffs SET "
        "name = COALESCE(?, name), "
        "billing_mode = COALESCE(?, billing_mode), "
        "rate_per_kl = COALESCE(?, rate_per_kl), "
        "fixed_charge = COALESCE(?, fixed_charge), "
        "tax_percentage = COALESCE(?, tax_percentage), "
        "slab_config = COALESCE(?, slab_config), "
        "status = COALESCE(?, status) "
        "WHERE tariff_id = ?;", -1, &stmt, NULL);
    if (has_name) sqlite3_bind_text(stmt, 1, name, -1, SQLITE_TRANSIENT);
    else sqlite3_bind_null(stmt, 1);
    if (has_mode) sqlite3_bind_text(stmt, 2, mode, -1, SQLITE_TRANSIENT);
    else sqlite3_bind_null(stmt, 2);
    if (has_rate && rate_per_kl >= 0) sqlite3_bind_int64(stmt, 3, rate_per_kl);
    else sqlite3_bind_null(stmt, 3);
    if (has_fixed && fixed_charge >= 0) sqlite3_bind_int64(stmt, 4, fixed_charge);
    else sqlite3_bind_null(stmt, 4);
    if (has_tax && tax_bps >= 0 && tax_bps <= 10000) sqlite3_bind_int64(stmt, 5, tax_bps);
    else sqlite3_bind_null(stmt, 5);
    if (has_slabs) sqlite3_bind_text(stmt, 6, slab_config, -1, SQLITE_TRANSIENT);
    else sqlite3_bind_null(stmt, 6);
    if (has_status) sqlite3_bind_text(stmt, 7, status, -1, SQLITE_TRANSIENT);
    else sqlite3_bind_null(stmt, 7);
    sqlite3_bind_int64(stmt, 8, tariff_id);

    sqlite3_step(stmt);
    int changes = sqlite3_changes(db);
    sqlite3_finalize(stmt);

    if (changes == 0) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 404, "NOT_FOUND", "Tariff not found.");
        return;
    }

    log_audit(db, u.user_id, "TARIFF_UPDATE", "tariff", tariff_id, has_status ? status : "Updated tariff parameters");
    sqlite3_exec(db, "COMMIT;", NULL, NULL, NULL);
    send_ok_message(c, 200, "Tariff updated successfully.");
}

static bool generate_single_bill(sqlite3 *db, int64_t reading_id, int64_t tariff_id_req,
                                 const char *due_date_opt, int64_t admin_user_id,
                                 cJSON *bill_out, const char **err_code_out, const char **err_msg_out) {
    /* Load reading + customer + meter */
    const char *rsql =
        "SELECT r.reading_id, r.meter_id, r.previous_reading, r.current_reading, r.consumption, "
        "r.billing_period, m.customer_id, c.user_id, m.meter_number "
        "FROM readings r "
        "JOIN meters m ON m.meter_id = r.meter_id "
        "JOIN customers c ON c.customer_id = m.customer_id "
        "WHERE r.reading_id = ? LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, rsql, -1, &stmt, NULL) != SQLITE_OK) {
        *err_code_out = "DB_ERROR"; *err_msg_out = "Database error."; return false;
    }
    sqlite3_bind_int64(stmt, 1, reading_id);
    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        *err_code_out = "READING_NOT_FOUND"; *err_msg_out = "Reading ID not found."; return false;
    }
    int64_t prev_r = sqlite3_column_int64(stmt, 2);
    int64_t curr_r = sqlite3_column_int64(stmt, 3);
    char period[16], meter_num[64];
    safe_strncpy(period, (const char *)sqlite3_column_text(stmt, 5), sizeof(period));
    int64_t customer_id = sqlite3_column_int64(stmt, 6);
    int64_t cust_user_id = sqlite3_column_int64(stmt, 7);
    safe_strncpy(meter_num, (const char *)sqlite3_column_text(stmt, 8), sizeof(meter_num));
    sqlite3_finalize(stmt);

    /* Ensure no active bill already exists for this reading */
    int dup = 0;
    if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM bills WHERE reading_id = ? AND status != 'cancelled';",
                           -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, reading_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) dup = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
    }
    if (dup > 0) {
        *err_code_out = "DUPLICATE_BILL";
        *err_msg_out = "An active bill already exists for this meter reading.";
        return false;
    }

    tariff_rule_t tariff;
    int64_t used_tariff_id = 0;
    if (!load_tariff_by_id(db, tariff_id_req, &tariff, &used_tariff_id)) {
        *err_code_out = "NO_ACTIVE_TARIFF";
        *err_msg_out = "No active tariff configuration found.";
        return false;
    }

    bill_calc_result_t calc;
    if (billing_calculate(prev_r, curr_r, &tariff, &calc) != BILL_CALC_OK) {
        *err_code_out = "BILLING_ERROR";
        *err_msg_out = "Reading values failed billing calculation validation.";
        return false;
    }

    char today[16], due_date[16];
    current_date_utc(today, sizeof(today));
    if (due_date_opt && is_valid_date(due_date_opt)) {
        safe_strncpy(due_date, due_date_opt, sizeof(due_date));
    } else {
        add_days_to_date(today, 15, due_date, sizeof(due_date));
    }

    /* Generate unique bill number */
    int64_t next_seq = 1;
    if (sqlite3_prepare_v2(db, "SELECT COALESCE(MAX(bill_id), 0) + 1 FROM bills;", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) next_seq = sqlite3_column_int64(stmt, 0);
        sqlite3_finalize(stmt);
    }
    char bill_num[48];
    snprintf(bill_num, sizeof(bill_num), "AQB-%c%c%c%c%c%c-%04lld",
             period[0], period[1], period[2], period[3], period[5], period[6], (long long)next_seq);

    if (sqlite3_prepare_v2(db,
            "INSERT INTO bills (bill_number, customer_id, reading_id, tariff_id, billing_period, "
            "water_charge, service_charge, tax_amount, total_amount, paid_amount, due_date, status) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'unpaid');", -1, &stmt, NULL) != SQLITE_OK) {
        *err_code_out = "DB_ERROR"; *err_msg_out = "Failed to prepare bill insert."; return false;
    }
    sqlite3_bind_text(stmt, 1, bill_num, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 2, customer_id);
    sqlite3_bind_int64(stmt, 3, reading_id);
    sqlite3_bind_int64(stmt, 4, used_tariff_id);
    sqlite3_bind_text(stmt, 5, period, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 6, calc.water_charge_paise);
    sqlite3_bind_int64(stmt, 7, calc.service_charge_paise);
    sqlite3_bind_int64(stmt, 8, calc.tax_amount_paise);
    sqlite3_bind_int64(stmt, 9, calc.total_amount_paise);
    sqlite3_bind_text(stmt, 10, due_date, -1, SQLITE_TRANSIENT);
    int rc = sqlite3_step(stmt);
    int64_t bill_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        *err_code_out = "CONFLICT"; *err_msg_out = "Failed to insert bill (possible duplicate)."; return false;
    }

    char msg[256];
    snprintf(msg, sizeof(msg),
             "Water bill %s generated for %s (Meter %s, %lld KL). Total Due: Rs %.2f by %s.",
             bill_num, period, meter_num, (long long)calc.consumption_kl,
             (double)calc.total_amount_paise / 100.0, due_date);
    create_notification(db, cust_user_id, msg, "bill_generated");
    log_audit(db, admin_user_id, "BILL_GENERATE", "bill", bill_id, bill_num);

    if (bill_out) {
        cJSON_AddNumberToObject(bill_out, "bill_id", (double)bill_id);
        cJSON_AddStringToObject(bill_out, "bill_number", bill_num);
        cJSON_AddNumberToObject(bill_out, "customer_id", (double)customer_id);
        cJSON_AddNumberToObject(bill_out, "reading_id", (double)reading_id);
        cJSON_AddNumberToObject(bill_out, "consumption", (double)calc.consumption_kl);
        cJSON_AddNumberToObject(bill_out, "water_charge", (double)calc.water_charge_paise);
        cJSON_AddNumberToObject(bill_out, "service_charge", (double)calc.service_charge_paise);
        cJSON_AddNumberToObject(bill_out, "tax_amount", (double)calc.tax_amount_paise);
        cJSON_AddNumberToObject(bill_out, "total_amount", (double)calc.total_amount_paise);
        cJSON_AddStringToObject(bill_out, "due_date", due_date);
        cJSON_AddStringToObject(bill_out, "status", "unpaid");
    }
    return true;
}

void handle_bills_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    db_refresh_overdue_bills(db);

    char status_f[32] = {0}, period_f[16] = {0}, search_f[128] = {0}, cust_f[32] = {0};
    char from_f[16] = {0}, to_f[16] = {0};
    extract_query_param(hm, "status", status_f, sizeof(status_f));
    extract_query_param(hm, "period", period_f, sizeof(period_f));
    extract_query_param(hm, "search", search_f, sizeof(search_f));
    extract_query_param(hm, "customer_id", cust_f, sizeof(cust_f));
    extract_query_param(hm, "from_date", from_f, sizeof(from_f));
    extract_query_param(hm, "to_date", to_f, sizeof(to_f));

    int64_t cust_scope = (u.role == ROLE_CUSTOMER) ? u.customer_id : (cust_f[0] ? atoll(cust_f) : 0);

    const char *sql =
        "SELECT b.bill_id, b.bill_number, b.customer_id, u.name AS customer_name, u.email, "
        "b.reading_id, r.previous_reading, r.current_reading, r.consumption, m.meter_number, "
        "b.tariff_id, t.name AS tariff_name, b.billing_period, b.water_charge, b.service_charge, "
        "b.tax_amount, b.total_amount, b.paid_amount, b.due_date, b.status, COALESCE(b.cancel_reason, ''), b.created_at, r.reading_date "
        "FROM bills b "
        "JOIN customers c ON c.customer_id = b.customer_id "
        "JOIN users u ON u.user_id = c.user_id "
        "JOIN readings r ON r.reading_id = b.reading_id "
        "JOIN meters m ON m.meter_id = r.meter_id "
        "JOIN tariffs t ON t.tariff_id = b.tariff_id "
        "WHERE (?1 = 0 OR b.customer_id = ?1) "
        "  AND (?2 = '' OR b.status = ?2) "
        "  AND (?3 = '' OR b.billing_period = ?3) "
        "  AND (?4 = '' OR b.bill_number LIKE ?5 OR u.name LIKE ?5 OR m.meter_number LIKE ?5) "
        "  AND (?6 = '' OR r.reading_date >= ?6) "
        "  AND (?7 = '' OR r.reading_date <= ?7) "
        "ORDER BY b.bill_id DESC;";

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to query bills.");
        return;
    }

    char like_pat[140];
    snprintf(like_pat, sizeof(like_pat), "%%%s%%", search_f);
    sqlite3_bind_int64(stmt, 1, cust_scope);
    sqlite3_bind_text(stmt, 2, status_f, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, period_f, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, search_f, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, like_pat, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, from_f, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 7, to_f, -1, SQLITE_TRANSIENT);

    cJSON *arr = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "bill_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddStringToObject(row, "bill_number", (const char *)sqlite3_column_text(stmt, 1));
        cJSON_AddNumberToObject(row, "customer_id", (double)sqlite3_column_int64(stmt, 2));
        cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 3));
        cJSON_AddStringToObject(row, "customer_email", (const char *)sqlite3_column_text(stmt, 4));
        cJSON_AddNumberToObject(row, "reading_id", (double)sqlite3_column_int64(stmt, 5));
        cJSON_AddNumberToObject(row, "previous_reading", (double)sqlite3_column_int64(stmt, 6));
        cJSON_AddNumberToObject(row, "current_reading", (double)sqlite3_column_int64(stmt, 7));
        cJSON_AddNumberToObject(row, "consumption", (double)sqlite3_column_int64(stmt, 8));
        cJSON_AddStringToObject(row, "meter_number", (const char *)sqlite3_column_text(stmt, 9));
        cJSON_AddNumberToObject(row, "tariff_id", (double)sqlite3_column_int64(stmt, 10));
        cJSON_AddStringToObject(row, "tariff_name", (const char *)sqlite3_column_text(stmt, 11));
        cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 12));
        cJSON_AddNumberToObject(row, "water_charge", (double)sqlite3_column_int64(stmt, 13));
        cJSON_AddNumberToObject(row, "service_charge", (double)sqlite3_column_int64(stmt, 14));
        cJSON_AddNumberToObject(row, "tax_amount", (double)sqlite3_column_int64(stmt, 15));
        int64_t total_amt = sqlite3_column_int64(stmt, 16);
        int64_t paid_amt = sqlite3_column_int64(stmt, 17);
        cJSON_AddNumberToObject(row, "total_amount", (double)total_amt);
        cJSON_AddNumberToObject(row, "paid_amount", (double)paid_amt);
        cJSON_AddNumberToObject(row, "balance_due", (double)(total_amt - paid_amt));
        cJSON_AddStringToObject(row, "due_date", (const char *)sqlite3_column_text(stmt, 18));
        cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 19));
        cJSON_AddStringToObject(row, "cancel_reason", (const char *)sqlite3_column_text(stmt, 20));
        cJSON_AddStringToObject(row, "created_at", (const char *)sqlite3_column_text(stmt, 21));
        cJSON_AddStringToObject(row, "reading_date", (const char *)sqlite3_column_text(stmt, 22));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "bills", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_bills_preview(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }
    int64_t reading_id = 0, tariff_id = 0;
    bool has_reading = json_get_int64(body, "reading_id", &reading_id);
    json_get_int64(body, "tariff_id", &tariff_id);
    cJSON_Delete(body);

    if (!has_reading || reading_id <= 0) {
        send_error(c, 400, "VALIDATION_ERROR", "reading_id is required for bill preview.");
        return;
    }

    const char *rsql =
        "SELECT r.reading_id, r.previous_reading, r.current_reading, r.billing_period, "
        "m.meter_number, u.name "
        "FROM readings r "
        "JOIN meters m ON m.meter_id = r.meter_id "
        "JOIN customers c ON c.customer_id = m.customer_id "
        "JOIN users u ON u.user_id = c.user_id "
        "WHERE r.reading_id = ? LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, rsql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, reading_id);
    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        send_error(c, 404, "READING_NOT_FOUND", "Reading ID not found.");
        return;
    }
    int64_t prev_r = sqlite3_column_int64(stmt, 1);
    int64_t curr_r = sqlite3_column_int64(stmt, 2);
    char period[16], meter_num[64], cust_name[128];
    safe_strncpy(period, (const char *)sqlite3_column_text(stmt, 3), sizeof(period));
    safe_strncpy(meter_num, (const char *)sqlite3_column_text(stmt, 4), sizeof(meter_num));
    safe_strncpy(cust_name, (const char *)sqlite3_column_text(stmt, 5), sizeof(cust_name));
    sqlite3_finalize(stmt);

    tariff_rule_t tariff;
    int64_t used_tariff_id = 0;
    if (!load_tariff_by_id(db, tariff_id, &tariff, &used_tariff_id)) {
        send_error(c, 400, "NO_ACTIVE_TARIFF", "No active tariff found.");
        return;
    }

    char tariff_name[128] = "Tariff";
    if (sqlite3_prepare_v2(db, "SELECT name FROM tariffs WHERE tariff_id = ? LIMIT 1;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, used_tariff_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            safe_strncpy(tariff_name, (const char *)sqlite3_column_text(stmt, 0), sizeof(tariff_name));
        }
        sqlite3_finalize(stmt);
    }

    bill_calc_result_t calc;
    if (billing_calculate(prev_r, curr_r, &tariff, &calc) != BILL_CALC_OK) {
        send_error(c, 400, "BILLING_ERROR", "Reading failed C billing calculation.");
        return;
    }

    cJSON *preview = cJSON_CreateObject();
    cJSON_AddNumberToObject(preview, "reading_id", (double)reading_id);
    cJSON_AddNumberToObject(preview, "tariff_id", (double)used_tariff_id);
    cJSON_AddStringToObject(preview, "tariff_name", tariff_name);
    cJSON_AddStringToObject(preview, "billing_mode", tariff.mode == TARIFF_MODE_SLAB ? "slab" : "flat");
    cJSON_AddStringToObject(preview, "billing_period", period);
    cJSON_AddStringToObject(preview, "meter_number", meter_num);
    cJSON_AddStringToObject(preview, "customer_name", cust_name);
    cJSON_AddNumberToObject(preview, "previous_reading", (double)prev_r);
    cJSON_AddNumberToObject(preview, "current_reading", (double)curr_r);
    cJSON_AddNumberToObject(preview, "consumption", (double)calc.consumption_kl);
    cJSON_AddNumberToObject(preview, "water_charge", (double)calc.water_charge_paise);
    cJSON_AddNumberToObject(preview, "service_charge", (double)calc.service_charge_paise);
    cJSON_AddNumberToObject(preview, "tax_percentage", (double)tariff.tax_bps);
    cJSON_AddNumberToObject(preview, "tax_amount", (double)calc.tax_amount_paise);
    cJSON_AddNumberToObject(preview, "total_amount", (double)calc.total_amount_paise);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "preview", preview);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_bills_generate(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    int64_t reading_id = 0, tariff_id = 0;
    char billing_period[16] = {0}, due_date[16] = {0};
    bool has_reading = json_get_int64(body, "reading_id", &reading_id);
    bool has_period = json_get_string(body, "billing_period", billing_period, sizeof(billing_period));
    json_get_int64(body, "tariff_id", &tariff_id);
    json_get_string(body, "due_date", due_date, sizeof(due_date));
    cJSON_Delete(body);

    if (!has_reading && !has_period) {
        send_error(c, 400, "VALIDATION_ERROR", "Provide either reading_id or billing_period (YYYY-MM).");
        return;
    }

    sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION;", NULL, NULL, NULL);

    if (has_reading) {
        cJSON *bill_obj = cJSON_CreateObject();
        const char *ecode = NULL, *emsg = NULL;
        if (!generate_single_bill(db, reading_id, tariff_id, due_date[0] ? due_date : NULL,
                                  u.user_id, bill_obj, &ecode, &emsg)) {
            cJSON_Delete(bill_obj);
            sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
            int status = (ecode && strcmp(ecode, "DUPLICATE_BILL") == 0) ? 409 :
                         (ecode && strcmp(ecode, "READING_NOT_FOUND") == 0) ? 404 : 400;
            send_error(c, status, ecode, emsg);
            return;
        }
        sqlite3_exec(db, "COMMIT;", NULL, NULL, NULL);
        cJSON *resp = cJSON_CreateObject();
        cJSON_AddItemToObject(resp, "bill", bill_obj);
        send_json(c, 201, resp);
        cJSON_Delete(resp);
        return;
    }

    /* Bulk generate for all unbilled readings in billing_period */
    if (!is_valid_period(billing_period)) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 400, "INVALID_PERIOD", "billing_period must follow YYYY-MM.");
        return;
    }

    int64_t r_ids[256];
    int r_count = 0;
    sqlite3_stmt *stmt = NULL;
    const char *qsql =
        "SELECT r.reading_id FROM readings r "
        "WHERE r.billing_period = ? "
        "  AND NOT EXISTS (SELECT 1 FROM bills b WHERE b.reading_id = r.reading_id AND b.status != 'cancelled') "
        "ORDER BY r.reading_id ASC LIMIT 256;";
    if (sqlite3_prepare_v2(db, qsql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, billing_period, -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW && r_count < 256) {
            r_ids[r_count++] = sqlite3_column_int64(stmt, 0);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *generated = cJSON_CreateArray();
    for (int i = 0; i < r_count; i++) {
        cJSON *bobj = cJSON_CreateObject();
        const char *ec = NULL, *em = NULL;
        if (generate_single_bill(db, r_ids[i], tariff_id, due_date[0] ? due_date : NULL,
                                 u.user_id, bobj, &ec, &em)) {
            cJSON_AddItemToArray(generated, bobj);
        } else {
            cJSON_Delete(bobj);
        }
    }

    sqlite3_exec(db, "COMMIT;", NULL, NULL, NULL);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "generated_count", cJSON_GetArraySize(generated));
    cJSON_AddItemToObject(resp, "bills", generated);
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}

void handle_bills_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t bill_id) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    db_refresh_overdue_bills(db);

    const char *sql =
        "SELECT b.bill_id, b.bill_number, b.customer_id, u.name, u.email, c.phone, c.address, "
        "b.reading_id, r.previous_reading, r.current_reading, r.consumption, r.reading_date, "
        "m.meter_number, b.tariff_id, t.name, t.billing_mode, t.rate_per_kl, t.fixed_charge, t.tax_percentage, "
        "b.billing_period, b.water_charge, b.service_charge, b.tax_amount, b.total_amount, b.paid_amount, "
        "b.due_date, b.status, COALESCE(b.cancel_reason, ''), b.created_at "
        "FROM bills b "
        "JOIN customers c ON c.customer_id = b.customer_id "
        "JOIN users u ON u.user_id = c.user_id "
        "JOIN readings r ON r.reading_id = b.reading_id "
        "JOIN meters m ON m.meter_id = r.meter_id "
        "JOIN tariffs t ON t.tariff_id = b.tariff_id "
        "WHERE b.bill_id = ? LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, bill_id);
    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        send_error(c, 404, "NOT_FOUND", "Bill not found.");
        return;
    }

    int64_t owner_cid = sqlite3_column_int64(stmt, 2);
    if (u.role == ROLE_CUSTOMER && owner_cid != u.customer_id) {
        sqlite3_finalize(stmt);
        send_error(c, 403, "FORBIDDEN", "You do not have permission to view this bill.");
        return;
    }

    int64_t total_amt = sqlite3_column_int64(stmt, 23);
    int64_t paid_amt = sqlite3_column_int64(stmt, 24);

    cJSON *bill = cJSON_CreateObject();
    cJSON_AddNumberToObject(bill, "bill_id", (double)sqlite3_column_int64(stmt, 0));
    cJSON_AddStringToObject(bill, "bill_number", (const char *)sqlite3_column_text(stmt, 1));
    cJSON_AddNumberToObject(bill, "customer_id", (double)owner_cid);
    cJSON_AddStringToObject(bill, "customer_name", (const char *)sqlite3_column_text(stmt, 3));
    cJSON_AddStringToObject(bill, "customer_email", (const char *)sqlite3_column_text(stmt, 4));
    cJSON_AddStringToObject(bill, "customer_phone", (const char *)sqlite3_column_text(stmt, 5));
    cJSON_AddStringToObject(bill, "customer_address", (const char *)sqlite3_column_text(stmt, 6));
    cJSON_AddNumberToObject(bill, "reading_id", (double)sqlite3_column_int64(stmt, 7));
    cJSON_AddNumberToObject(bill, "previous_reading", (double)sqlite3_column_int64(stmt, 8));
    cJSON_AddNumberToObject(bill, "current_reading", (double)sqlite3_column_int64(stmt, 9));
    cJSON_AddNumberToObject(bill, "consumption", (double)sqlite3_column_int64(stmt, 10));
    cJSON_AddStringToObject(bill, "reading_date", (const char *)sqlite3_column_text(stmt, 11));
    cJSON_AddStringToObject(bill, "meter_number", (const char *)sqlite3_column_text(stmt, 12));
    cJSON_AddNumberToObject(bill, "tariff_id", (double)sqlite3_column_int64(stmt, 13));
    cJSON_AddStringToObject(bill, "tariff_name", (const char *)sqlite3_column_text(stmt, 14));
    cJSON_AddStringToObject(bill, "billing_mode", (const char *)sqlite3_column_text(stmt, 15));
    cJSON_AddNumberToObject(bill, "rate_per_kl", (double)sqlite3_column_int64(stmt, 16));
    cJSON_AddNumberToObject(bill, "fixed_charge", (double)sqlite3_column_int64(stmt, 17));
    cJSON_AddNumberToObject(bill, "tax_percentage", (double)sqlite3_column_int64(stmt, 18));
    cJSON_AddStringToObject(bill, "billing_period", (const char *)sqlite3_column_text(stmt, 19));
    cJSON_AddNumberToObject(bill, "water_charge", (double)sqlite3_column_int64(stmt, 20));
    cJSON_AddNumberToObject(bill, "service_charge", (double)sqlite3_column_int64(stmt, 21));
    cJSON_AddNumberToObject(bill, "tax_amount", (double)sqlite3_column_int64(stmt, 22));
    cJSON_AddNumberToObject(bill, "total_amount", (double)total_amt);
    cJSON_AddNumberToObject(bill, "paid_amount", (double)paid_amt);
    cJSON_AddNumberToObject(bill, "balance_due", (double)(total_amt - paid_amt));
    cJSON_AddStringToObject(bill, "due_date", (const char *)sqlite3_column_text(stmt, 25));
    cJSON_AddStringToObject(bill, "status", (const char *)sqlite3_column_text(stmt, 26));
    cJSON_AddStringToObject(bill, "cancel_reason", (const char *)sqlite3_column_text(stmt, 27));
    cJSON_AddStringToObject(bill, "created_at", (const char *)sqlite3_column_text(stmt, 28));
    sqlite3_finalize(stmt);

    cJSON *payments = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db,
            "SELECT payment_id, transaction_reference, amount, payment_method, payment_date, status, COALESCE(notes, '') "
            "FROM payments WHERE bill_id = ? ORDER BY payment_id DESC;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, bill_id);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *p = cJSON_CreateObject();
            cJSON_AddNumberToObject(p, "payment_id", (double)sqlite3_column_int64(stmt, 0));
            cJSON_AddStringToObject(p, "transaction_reference", (const char *)sqlite3_column_text(stmt, 1));
            cJSON_AddNumberToObject(p, "amount", (double)sqlite3_column_int64(stmt, 2));
            cJSON_AddStringToObject(p, "payment_method", (const char *)sqlite3_column_text(stmt, 3));
            cJSON_AddStringToObject(p, "payment_date", (const char *)sqlite3_column_text(stmt, 4));
            cJSON_AddStringToObject(p, "status", (const char *)sqlite3_column_text(stmt, 5));
            cJSON_AddStringToObject(p, "notes", (const char *)sqlite3_column_text(stmt, 6));
            cJSON_AddItemToArray(payments, p);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "bill", bill);
    cJSON_AddItemToObject(resp, "payments", payments);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_bills_cancel(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t bill_id) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    char reason[256] = "Cancelled by administrator";
    if (body) {
        json_get_string(body, "reason", reason, sizeof(reason));
        cJSON_Delete(body);
    }

    sqlite3_stmt *stmt = NULL;
    char status[32] = {0};
    int64_t paid_amt = 0;
    if (sqlite3_prepare_v2(db, "SELECT status, paid_amount FROM bills WHERE bill_id = ? LIMIT 1;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, bill_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            safe_strncpy(status, (const char *)sqlite3_column_text(stmt, 0), sizeof(status));
            paid_amt = sqlite3_column_int64(stmt, 1);
        }
        sqlite3_finalize(stmt);
    }

    if (status[0] == '\0') {
        send_error(c, 404, "NOT_FOUND", "Bill not found.");
        return;
    }
    if (strcmp(status, "paid") == 0 || strcmp(status, "partial") == 0 || paid_amt > 0) {
        send_error(c, 409, "PAID_BILL_IMMUTABLE",
                   "Paid or partially paid bills cannot be cancelled or altered.");
        return;
    }
    if (strcmp(status, "cancelled") == 0) {
        send_error(c, 409, "ALREADY_CANCELLED", "Bill is already cancelled.");
        return;
    }

    if (sqlite3_prepare_v2(db, "UPDATE bills SET status = 'cancelled', cancel_reason = ? WHERE bill_id = ?;",
                           -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    sqlite3_bind_text(stmt, 1, reason, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 2, bill_id);
    sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    log_audit(db, u.user_id, "BILL_CANCEL", "bill", bill_id, reason);
    send_ok_message(c, 200, "Bill cancelled and recorded in audit trail.");
}
