#include "aquabill.h"
#include "database.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_dashboard_summary(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    db_refresh_overdue_bills(db);
    sqlite3_stmt *stmt = NULL;
    cJSON *resp = cJSON_CreateObject();

    if (u.role == ROLE_ADMIN) {
        int64_t total_customers = 0, active_meters = 0, total_consumption = 0;
        int64_t total_bills_count = 0, total_billed = 0, total_collected = 0, outstanding = 0;
        int64_t unpaid_count = 0, overdue_count = 0, pending_payments_count = 0, unbilled_readings = 0;

        if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM customers c JOIN users u ON u.user_id = c.user_id WHERE u.status='active';",
                               -1, &stmt, NULL) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) total_customers = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }
        if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM meters WHERE status='active';", -1, &stmt, NULL) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) active_meters = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }
        if (sqlite3_prepare_v2(db, "SELECT COALESCE(SUM(consumption), 0) FROM readings;", -1, &stmt, NULL) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) total_consumption = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }
        if (sqlite3_prepare_v2(db,
                "SELECT COUNT(*), COALESCE(SUM(total_amount),0), COALESCE(SUM(paid_amount),0), "
                "COALESCE(SUM(CASE WHEN status IN ('unpaid','partial','overdue') THEN total_amount - paid_amount ELSE 0 END), 0), "
                "COALESCE(SUM(CASE WHEN status IN ('unpaid','partial') THEN 1 ELSE 0 END), 0), "
                "COALESCE(SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END), 0), "
                "COALESCE(SUM(CASE WHEN status IN ('unpaid','partial','overdue') THEN 1 ELSE 0 END), 0) "
                "FROM bills WHERE status != 'cancelled';", -1, &stmt, NULL) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) {
                total_bills_count = sqlite3_column_int64(stmt, 0);
                total_billed = sqlite3_column_int64(stmt, 1);
                total_collected = sqlite3_column_int64(stmt, 2);
                outstanding = sqlite3_column_int64(stmt, 3);
                unpaid_count = sqlite3_column_int64(stmt, 4);
                overdue_count = sqlite3_column_int64(stmt, 5);
                pending_payments_count = sqlite3_column_int64(stmt, 6);
            }
            sqlite3_finalize(stmt);
        }
        if (sqlite3_prepare_v2(db,
                "SELECT COUNT(*) FROM readings r WHERE NOT EXISTS (SELECT 1 FROM bills b WHERE b.reading_id = r.reading_id AND b.status != 'cancelled');",
                -1, &stmt, NULL) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) unbilled_readings = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }

        cJSON_AddNumberToObject(resp, "total_customers", (double)total_customers);
        cJSON_AddNumberToObject(resp, "active_meters", (double)active_meters);
        cJSON_AddNumberToObject(resp, "total_bills_count", (double)total_bills_count);
        cJSON_AddNumberToObject(resp, "total_consumption_kl", (double)total_consumption);
        cJSON_AddNumberToObject(resp, "total_billed_paise", (double)total_billed);
        cJSON_AddNumberToObject(resp, "total_collected_paise", (double)total_collected);
        cJSON_AddNumberToObject(resp, "outstanding_paise", (double)outstanding);
        cJSON_AddNumberToObject(resp, "pending_payments_paise", (double)outstanding);
        cJSON_AddNumberToObject(resp, "pending_payments_count", (double)pending_payments_count);
        cJSON_AddNumberToObject(resp, "unpaid_bills_count", (double)unpaid_count);
        cJSON_AddNumberToObject(resp, "overdue_bills_count", (double)overdue_count);
        cJSON_AddNumberToObject(resp, "unbilled_readings_count", (double)unbilled_readings);

        /* Recent Customer Registrations (5) */
        cJSON *recent_customers = cJSON_CreateArray();
        if (sqlite3_prepare_v2(db,
                "SELECT c.customer_id, u.name, u.email, u.status, c.created_at "
                "FROM customers c JOIN users u ON u.user_id = c.user_id "
                "ORDER BY c.customer_id DESC LIMIT 5;", -1, &stmt, NULL) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                cJSON *row = cJSON_CreateObject();
                cJSON_AddNumberToObject(row, "customer_id", (double)sqlite3_column_int64(stmt, 0));
                cJSON_AddStringToObject(row, "name", (const char *)sqlite3_column_text(stmt, 1));
                cJSON_AddStringToObject(row, "email", (const char *)sqlite3_column_text(stmt, 2));
                cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 3));
                cJSON_AddStringToObject(row, "created_at", (const char *)sqlite3_column_text(stmt, 4));
                cJSON_AddItemToArray(recent_customers, row);
            }
            sqlite3_finalize(stmt);
        }
        cJSON_AddItemToObject(resp, "recent_customers", recent_customers);

        /* Recent Billing Activity (5) */
        cJSON *recent_bills = cJSON_CreateArray();
        if (sqlite3_prepare_v2(db,
                "SELECT b.bill_id, b.bill_number, u.name, b.billing_period, b.total_amount, b.due_date, b.status, b.created_at "
                "FROM bills b JOIN customers c ON c.customer_id = b.customer_id JOIN users u ON u.user_id = c.user_id "
                "ORDER BY b.bill_id DESC LIMIT 5;", -1, &stmt, NULL) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                cJSON *row = cJSON_CreateObject();
                cJSON_AddNumberToObject(row, "bill_id", (double)sqlite3_column_int64(stmt, 0));
                cJSON_AddStringToObject(row, "bill_number", (const char *)sqlite3_column_text(stmt, 1));
                cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 2));
                cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 3));
                cJSON_AddNumberToObject(row, "total_amount", (double)sqlite3_column_int64(stmt, 4));
                cJSON_AddStringToObject(row, "due_date", (const char *)sqlite3_column_text(stmt, 5));
                cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 6));
                cJSON_AddStringToObject(row, "created_at", (const char *)sqlite3_column_text(stmt, 7));
                cJSON_AddItemToArray(recent_bills, row);
            }
            sqlite3_finalize(stmt);
        }
        cJSON_AddItemToObject(resp, "recent_bills", recent_bills);

        /* Recent Payment Transactions (5) */
        cJSON *recent_payments = cJSON_CreateArray();
        if (sqlite3_prepare_v2(db,
                "SELECT p.payment_id, p.transaction_reference, b.bill_number, u.name, p.amount, p.payment_method, p.payment_date, p.status "
                "FROM payments p JOIN bills b ON b.bill_id = p.bill_id "
                "JOIN customers c ON c.customer_id = b.customer_id JOIN users u ON u.user_id = c.user_id "
                "ORDER BY p.payment_id DESC LIMIT 5;", -1, &stmt, NULL) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                cJSON *row = cJSON_CreateObject();
                cJSON_AddNumberToObject(row, "payment_id", (double)sqlite3_column_int64(stmt, 0));
                cJSON_AddStringToObject(row, "transaction_reference", (const char *)sqlite3_column_text(stmt, 1));
                cJSON_AddStringToObject(row, "bill_number", (const char *)sqlite3_column_text(stmt, 2));
                cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 3));
                cJSON_AddNumberToObject(row, "amount", (double)sqlite3_column_int64(stmt, 4));
                cJSON_AddStringToObject(row, "payment_method", (const char *)sqlite3_column_text(stmt, 5));
                cJSON_AddStringToObject(row, "payment_date", (const char *)sqlite3_column_text(stmt, 6));
                cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 7));
                cJSON_AddItemToArray(recent_payments, row);
            }
            sqlite3_finalize(stmt);
        }
        cJSON_AddItemToObject(resp, "recent_payments", recent_payments);

        /* Outstanding Payment Summary (top 5 open/overdue) */
        cJSON *outstanding_summary = cJSON_CreateArray();
        if (sqlite3_prepare_v2(db,
                "SELECT b.bill_id, b.bill_number, u.name, (b.total_amount - b.paid_amount) AS bal, b.due_date, b.status "
                "FROM bills b JOIN customers c ON c.customer_id = b.customer_id JOIN users u ON u.user_id = c.user_id "
                "WHERE b.status IN ('unpaid', 'partial', 'overdue') "
                "ORDER BY CASE WHEN b.status='overdue' THEN 0 ELSE 1 END, b.due_date ASC LIMIT 5;",
                -1, &stmt, NULL) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                cJSON *row = cJSON_CreateObject();
                cJSON_AddNumberToObject(row, "bill_id", (double)sqlite3_column_int64(stmt, 0));
                cJSON_AddStringToObject(row, "bill_number", (const char *)sqlite3_column_text(stmt, 1));
                cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 2));
                cJSON_AddNumberToObject(row, "balance_due", (double)sqlite3_column_int64(stmt, 3));
                cJSON_AddStringToObject(row, "due_date", (const char *)sqlite3_column_text(stmt, 4));
                cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 5));
                cJSON_AddItemToArray(outstanding_summary, row);
            }
            sqlite3_finalize(stmt);
        }
        cJSON_AddItemToObject(resp, "outstanding_summary", outstanding_summary);
    } else {
        int64_t meter_count = 0, total_consumption = 0, latest_consumption = 0;
        int64_t outstanding = 0, total_paid = 0, unread_notifications = 0, unpaid_count = 0;

        if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM meters WHERE customer_id = ? AND status='active';",
                               -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_int64(stmt, 1, u.customer_id);
            if (sqlite3_step(stmt) == SQLITE_ROW) meter_count = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }
        if (sqlite3_prepare_v2(db,
                "SELECT COALESCE(SUM(r.consumption), 0) FROM readings r "
                "JOIN meters m ON m.meter_id = r.meter_id WHERE m.customer_id = ?;",
                -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_int64(stmt, 1, u.customer_id);
            if (sqlite3_step(stmt) == SQLITE_ROW) total_consumption = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }
        if (sqlite3_prepare_v2(db,
                "SELECT r.consumption FROM readings r JOIN meters m ON m.meter_id = r.meter_id "
                "WHERE m.customer_id = ? ORDER BY r.billing_period DESC, r.reading_id DESC LIMIT 1;",
                -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_int64(stmt, 1, u.customer_id);
            if (sqlite3_step(stmt) == SQLITE_ROW) latest_consumption = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }
        if (sqlite3_prepare_v2(db,
                "SELECT COALESCE(SUM(CASE WHEN status IN ('unpaid','partial','overdue') THEN total_amount - paid_amount ELSE 0 END), 0), "
                "COALESCE(SUM(paid_amount), 0), "
                "COALESCE(SUM(CASE WHEN status IN ('unpaid','partial','overdue') THEN 1 ELSE 0 END), 0) "
                "FROM bills WHERE customer_id = ? AND status != 'cancelled';",
                -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_int64(stmt, 1, u.customer_id);
            if (sqlite3_step(stmt) == SQLITE_ROW) {
                outstanding = sqlite3_column_int64(stmt, 0);
                total_paid = sqlite3_column_int64(stmt, 1);
                unpaid_count = sqlite3_column_int64(stmt, 2);
            }
            sqlite3_finalize(stmt);
        }
        if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0;",
                               -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_int64(stmt, 1, u.user_id);
            if (sqlite3_step(stmt) == SQLITE_ROW) unread_notifications = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }

        cJSON_AddNumberToObject(resp, "active_meters", (double)meter_count);
        cJSON_AddNumberToObject(resp, "total_consumption_kl", (double)total_consumption);
        cJSON_AddNumberToObject(resp, "latest_consumption_kl", (double)latest_consumption);
        cJSON_AddNumberToObject(resp, "outstanding_paise", (double)outstanding);
        cJSON_AddNumberToObject(resp, "total_paid_paise", (double)total_paid);
        cJSON_AddNumberToObject(resp, "unpaid_bills_count", (double)unpaid_count);
        cJSON_AddNumberToObject(resp, "unread_notifications", (double)unread_notifications);
    }

    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_reports_monthly(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    char from_p[16] = {0}, to_p[16] = {0};
    extract_query_param(hm, "from", from_p, sizeof(from_p));
    extract_query_param(hm, "to", to_p, sizeof(to_p));

    const char *sql =
        "SELECT b.billing_period, "
        "COUNT(b.bill_id) AS bills_count, "
        "COALESCE(SUM(r.consumption), 0) AS total_consumption_kl, "
        "COALESCE(SUM(b.total_amount), 0) AS total_billed_paise, "
        "COALESCE(SUM(b.paid_amount), 0) AS total_collected_paise, "
        "COALESCE(SUM(CASE WHEN b.status = 'overdue' THEN 1 ELSE 0 END), 0) AS overdue_count "
        "FROM bills b "
        "JOIN readings r ON r.reading_id = b.reading_id "
        "WHERE b.status != 'cancelled' "
        "  AND (?1 = '' OR b.billing_period >= ?1) "
        "  AND (?2 = '' OR b.billing_period <= ?2) "
        "GROUP BY b.billing_period "
        "ORDER BY b.billing_period ASC;";

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to generate monthly report.");
        return;
    }
    sqlite3_bind_text(stmt, 1, from_p, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, to_p, -1, SQLITE_TRANSIENT);

    cJSON *arr = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 0));
        cJSON_AddNumberToObject(row, "bills_count", (double)sqlite3_column_int64(stmt, 1));
        cJSON_AddNumberToObject(row, "total_consumption_kl", (double)sqlite3_column_int64(stmt, 2));
        cJSON_AddNumberToObject(row, "total_billed_paise", (double)sqlite3_column_int64(stmt, 3));
        cJSON_AddNumberToObject(row, "total_collected_paise", (double)sqlite3_column_int64(stmt, 4));
        cJSON_AddNumberToObject(row, "overdue_count", (double)sqlite3_column_int64(stmt, 5));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "monthly", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_reports_consumption(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    int64_t cust_scope = (u.role == ROLE_CUSTOMER) ? u.customer_id : 0;
    sqlite3_stmt *stmt = NULL;

    /* Period trend */
    const char *trend_sql =
        "SELECT r.billing_period, COALESCE(SUM(r.consumption), 0), COUNT(r.reading_id), COALESCE(AVG(r.consumption), 0) "
        "FROM readings r JOIN meters m ON m.meter_id = r.meter_id "
        "WHERE (?1 = 0 OR m.customer_id = ?1) "
        "GROUP BY r.billing_period ORDER BY r.billing_period ASC;";

    cJSON *trend = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db, trend_sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, cust_scope);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *row = cJSON_CreateObject();
            cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 0));
            cJSON_AddNumberToObject(row, "total_kl", (double)sqlite3_column_int64(stmt, 1));
            cJSON_AddNumberToObject(row, "readings_count", (double)sqlite3_column_int64(stmt, 2));
            cJSON_AddNumberToObject(row, "avg_kl", sqlite3_column_double(stmt, 3));
            cJSON_AddItemToArray(trend, row);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *top_consumers = cJSON_CreateArray();
    if (u.role == ROLE_ADMIN) {
        const char *top_sql =
            "SELECT c.customer_id, u.name, m.meter_number, COALESCE(SUM(r.consumption), 0) AS total_kl "
            "FROM customers c JOIN users u ON u.user_id = c.user_id "
            "JOIN meters m ON m.customer_id = c.customer_id "
            "JOIN readings r ON r.meter_id = m.meter_id "
            "GROUP BY c.customer_id ORDER BY total_kl DESC LIMIT 8;";
        if (sqlite3_prepare_v2(db, top_sql, -1, &stmt, NULL) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                cJSON *row = cJSON_CreateObject();
                cJSON_AddNumberToObject(row, "customer_id", (double)sqlite3_column_int64(stmt, 0));
                cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 1));
                cJSON_AddStringToObject(row, "meter_number", (const char *)sqlite3_column_text(stmt, 2));
                cJSON_AddNumberToObject(row, "total_kl", (double)sqlite3_column_int64(stmt, 3));
                cJSON_AddItemToArray(top_consumers, row);
            }
            sqlite3_finalize(stmt);
        }
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "trend", trend);
    cJSON_AddItemToObject(resp, "top_consumers", top_consumers);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_reports_revenue(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    char from_p[16] = {0}, to_p[16] = {0};
    extract_query_param(hm, "from", from_p, sizeof(from_p));
    extract_query_param(hm, "to", to_p, sizeof(to_p));

    sqlite3_stmt *stmt = NULL;
    cJSON *by_method = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db,
            "SELECT p.payment_method, COUNT(*), COALESCE(SUM(p.amount), 0) "
            "FROM payments p JOIN bills b ON b.bill_id = p.bill_id "
            "WHERE p.status = 'completed' "
            "  AND (?1 = '' OR b.billing_period >= ?1) "
            "  AND (?2 = '' OR b.billing_period <= ?2) "
            "GROUP BY p.payment_method;",
            -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, from_p, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, to_p, -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *row = cJSON_CreateObject();
            cJSON_AddStringToObject(row, "payment_method", (const char *)sqlite3_column_text(stmt, 0));
            cJSON_AddNumberToObject(row, "count", (double)sqlite3_column_int64(stmt, 1));
            cJSON_AddNumberToObject(row, "total_paise", (double)sqlite3_column_int64(stmt, 2));
            cJSON_AddItemToArray(by_method, row);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *by_period = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db,
            "SELECT b.billing_period, COALESCE(SUM(b.total_amount), 0), COALESCE(SUM(b.paid_amount), 0) "
            "FROM bills b WHERE b.status != 'cancelled' "
            "  AND (?1 = '' OR b.billing_period >= ?1) "
            "  AND (?2 = '' OR b.billing_period <= ?2) "
            "GROUP BY b.billing_period ORDER BY b.billing_period ASC;",
            -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, from_p, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, to_p, -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *row = cJSON_CreateObject();
            cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 0));
            cJSON_AddNumberToObject(row, "billed_paise", (double)sqlite3_column_int64(stmt, 1));
            cJSON_AddNumberToObject(row, "collected_paise", (double)sqlite3_column_int64(stmt, 2));
            cJSON_AddItemToArray(by_period, row);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "by_method", by_method);
    cJSON_AddItemToObject(resp, "by_period", by_period);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_reports_summary(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    db_refresh_overdue_bills(db);
    char from_p[16] = {0}, to_p[16] = {0};
    extract_query_param(hm, "from", from_p, sizeof(from_p));
    extract_query_param(hm, "to", to_p, sizeof(to_p));

    sqlite3_stmt *stmt = NULL;
    cJSON *status_breakdown = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db,
            "SELECT b.status, COUNT(*), COALESCE(SUM(b.total_amount), 0), COALESCE(SUM(b.paid_amount), 0) "
            "FROM bills b "
            "WHERE (?1 = '' OR b.billing_period >= ?1) AND (?2 = '' OR b.billing_period <= ?2) "
            "GROUP BY b.status ORDER BY b.status;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, from_p, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, to_p, -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *row = cJSON_CreateObject();
            cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 0));
            cJSON_AddNumberToObject(row, "count", (double)sqlite3_column_int64(stmt, 1));
            cJSON_AddNumberToObject(row, "total_paise", (double)sqlite3_column_int64(stmt, 2));
            cJSON_AddNumberToObject(row, "paid_paise", (double)sqlite3_column_int64(stmt, 3));
            cJSON_AddItemToArray(status_breakdown, row);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *customer_wise = cJSON_CreateArray();
    if (sqlite3_prepare_v2(db,
            "SELECT c.customer_id, u.name, u.email, "
            "COUNT(CASE WHEN b.status != 'cancelled' THEN 1 END) AS bills_count, "
            "COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN r.consumption ELSE 0 END), 0) AS total_kl, "
            "COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_amount ELSE 0 END), 0) AS billed_paise, "
            "COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.paid_amount ELSE 0 END), 0) AS collected_paise, "
            "COALESCE(SUM(CASE WHEN b.status IN ('unpaid','partial','overdue') THEN b.total_amount - b.paid_amount ELSE 0 END), 0) AS outstanding_paise "
            "FROM customers c "
            "JOIN users u ON u.user_id = c.user_id "
            "LEFT JOIN bills b ON b.customer_id = c.customer_id "
            "  AND (?1 = '' OR b.billing_period >= ?1) AND (?2 = '' OR b.billing_period <= ?2) "
            "LEFT JOIN readings r ON r.reading_id = b.reading_id "
            "GROUP BY c.customer_id "
            "ORDER BY billed_paise DESC, u.name ASC;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, from_p, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, to_p, -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            cJSON *row = cJSON_CreateObject();
            cJSON_AddNumberToObject(row, "customer_id", (double)sqlite3_column_int64(stmt, 0));
            cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 1));
            cJSON_AddStringToObject(row, "email", (const char *)sqlite3_column_text(stmt, 2));
            cJSON_AddNumberToObject(row, "bills_count", (double)sqlite3_column_int64(stmt, 3));
            cJSON_AddNumberToObject(row, "total_consumption_kl", (double)sqlite3_column_int64(stmt, 4));
            cJSON_AddNumberToObject(row, "total_billed_paise", (double)sqlite3_column_int64(stmt, 5));
            cJSON_AddNumberToObject(row, "total_collected_paise", (double)sqlite3_column_int64(stmt, 6));
            cJSON_AddNumberToObject(row, "outstanding_paise", (double)sqlite3_column_int64(stmt, 7));
            cJSON_AddItemToArray(customer_wise, row);
        }
        sqlite3_finalize(stmt);
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "status_breakdown", status_breakdown);
    cJSON_AddItemToObject(resp, "customer_wise", customer_wise);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_reports_outstanding(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    db_refresh_overdue_bills(db);
    const char *sql =
        "SELECT b.bill_id, b.bill_number, u.name, u.email, c.phone, b.billing_period, "
        "b.total_amount, b.paid_amount, (b.total_amount - b.paid_amount) AS balance_due, b.due_date, b.status "
        "FROM bills b "
        "JOIN customers c ON c.customer_id = b.customer_id "
        "JOIN users u ON u.user_id = c.user_id "
        "WHERE b.status IN ('unpaid', 'partial', 'overdue') "
        "ORDER BY CASE WHEN b.status='overdue' THEN 0 ELSE 1 END, b.due_date ASC;";

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to query outstanding bills.");
        return;
    }

    cJSON *arr = cJSON_CreateArray();
    int64_t total_outstanding = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int64_t bal = sqlite3_column_int64(stmt, 8);
        total_outstanding += bal;
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "bill_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddStringToObject(row, "bill_number", (const char *)sqlite3_column_text(stmt, 1));
        cJSON_AddStringToObject(row, "customer_name", (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddStringToObject(row, "customer_email", (const char *)sqlite3_column_text(stmt, 3));
        cJSON_AddStringToObject(row, "phone", (const char *)sqlite3_column_text(stmt, 4));
        cJSON_AddStringToObject(row, "billing_period", (const char *)sqlite3_column_text(stmt, 5));
        cJSON_AddNumberToObject(row, "total_amount", (double)sqlite3_column_int64(stmt, 6));
        cJSON_AddNumberToObject(row, "paid_amount", (double)sqlite3_column_int64(stmt, 7));
        cJSON_AddNumberToObject(row, "balance_due", (double)bal);
        cJSON_AddStringToObject(row, "due_date", (const char *)sqlite3_column_text(stmt, 9));
        cJSON_AddStringToObject(row, "status", (const char *)sqlite3_column_text(stmt, 10));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "total_outstanding_paise", (double)total_outstanding);
    cJSON_AddItemToObject(resp, "outstanding_bills", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_notifications_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    char type_f[32] = {0};
    extract_query_param(hm, "type", type_f, sizeof(type_f));

    sqlite3_stmt *stmt = NULL;
    if (u.role == ROLE_ADMIN) {
        const char *sql =
            "SELECT n.notification_id, n.user_id, COALESCE(u.name, 'System'), n.message, n.type, n.is_read, n.created_at "
            "FROM notifications n LEFT JOIN users u ON u.user_id = n.user_id "
            "WHERE (?1 = '' OR n.type = ?1) "
            "ORDER BY n.notification_id DESC LIMIT 80;";
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
            send_error(c, 500, "DB_ERROR", "Database error.");
            return;
        }
        sqlite3_bind_text(stmt, 1, type_f, -1, SQLITE_TRANSIENT);
    } else {
        const char *sql =
            "SELECT n.notification_id, n.user_id, u.name, n.message, n.type, n.is_read, n.created_at "
            "FROM notifications n JOIN users u ON u.user_id = n.user_id "
            "WHERE n.user_id = ?1 AND (?2 = '' OR n.type = ?2) "
            "ORDER BY n.notification_id DESC LIMIT 50;";
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
            send_error(c, 500, "DB_ERROR", "Database error.");
            return;
        }
        sqlite3_bind_int64(stmt, 1, u.user_id);
        sqlite3_bind_text(stmt, 2, type_f, -1, SQLITE_TRANSIENT);
    }

    cJSON *arr = cJSON_CreateArray();
    int unread = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int is_read = sqlite3_column_int(stmt, 5);
        if (!is_read) unread++;
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "notification_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddNumberToObject(row, "user_id", (double)sqlite3_column_int64(stmt, 1));
        cJSON_AddStringToObject(row, "recipient_name", (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddStringToObject(row, "message", (const char *)sqlite3_column_text(stmt, 3));
        cJSON_AddStringToObject(row, "type", (const char *)sqlite3_column_text(stmt, 4));
        cJSON_AddBoolToObject(row, "is_read", is_read != 0);
        cJSON_AddStringToObject(row, "created_at", (const char *)sqlite3_column_text(stmt, 6));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "unread_count", unread);
    cJSON_AddItemToObject(resp, "notifications", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_notifications_read(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t notification_id) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    sqlite3_stmt *stmt = NULL;
    const char *sql = (u.role == ROLE_ADMIN)
        ? "UPDATE notifications SET is_read = 1 WHERE notification_id = ?;"
        : "UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?;";
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, notification_id);
    if (u.role != ROLE_ADMIN) sqlite3_bind_int64(stmt, 2, u.user_id);
    sqlite3_step(stmt);
    int changes = sqlite3_changes(db);
    sqlite3_finalize(stmt);

    if (changes == 0) {
        send_error(c, 404, "NOT_FOUND", "Notification not found.");
        return;
    }
    send_ok_message(c, 200, "Notification marked as read.");
}

void handle_notifications_read_all(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, "UPDATE notifications SET is_read = 1 WHERE user_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, u.user_id);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
    send_ok_message(c, 200, "All notifications marked as read.");
}

void handle_notifications_remind(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    sqlite3_stmt *stmt = NULL;
    const char *sql =
        "SELECT c.user_id, b.bill_number, b.total_amount - b.paid_amount AS bal, b.due_date "
        "FROM bills b JOIN customers c ON c.customer_id = b.customer_id "
        "WHERE b.status IN ('unpaid', 'partial', 'overdue');";
    int sent = 0;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            int64_t target_uid = sqlite3_column_int64(stmt, 0);
            const char *bnum = (const char *)sqlite3_column_text(stmt, 1);
            int64_t bal = sqlite3_column_int64(stmt, 2);
            const char *due = (const char *)sqlite3_column_text(stmt, 3);
            char msg[256];
            snprintf(msg, sizeof(msg),
                     "Payment Reminder: Bill %s has an outstanding balance of Rs %.2f (Due: %s).",
                     bnum, (double)bal / 100.0, due);
            create_notification(db, target_uid, msg, "due_reminder");
            sent++;
        }
        sqlite3_finalize(stmt);
    }
    log_audit(db, u.user_id, "REMINDERS_DISPATCH", "notification", 0, "Dispatched due reminders to unpaid/overdue accounts");
    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "reminders_sent", sent);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_notifications_send(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    int64_t customer_id = 0;
    char message[512] = {0}, type[32] = "account_update";
    json_get_int64(body, "customer_id", &customer_id);
    bool has_msg = json_get_string(body, "message", message, sizeof(message));
    json_get_string(body, "type", type, sizeof(type));
    cJSON_Delete(body);

    if (!has_msg) {
        send_error(c, 400, "VALIDATION_ERROR", "Notification message is required.");
        return;
    }
    if (strcmp(type, "bill_generated") != 0 && strcmp(type, "due_reminder") != 0 &&
        strcmp(type, "payment_received") != 0 && strcmp(type, "overdue_alert") != 0 &&
        strcmp(type, "account_update") != 0) {
        safe_strncpy(type, "account_update", sizeof(type));
    }

    int sent = 0;
    sqlite3_stmt *stmt = NULL;
    if (customer_id > 0) {
        int64_t target_uid = 0;
        if (sqlite3_prepare_v2(db, "SELECT user_id FROM customers WHERE customer_id = ? LIMIT 1;", -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_int64(stmt, 1, customer_id);
            if (sqlite3_step(stmt) == SQLITE_ROW) target_uid = sqlite3_column_int64(stmt, 0);
            sqlite3_finalize(stmt);
        }
        if (target_uid <= 0) {
            send_error(c, 404, "CUSTOMER_NOT_FOUND", "Target customer not found.");
            return;
        }
        create_notification(db, target_uid, message, type);
        sent = 1;
    } else {
        if (sqlite3_prepare_v2(db,
                "SELECT c.user_id FROM customers c JOIN users u ON u.user_id = c.user_id WHERE u.status = 'active';",
                -1, &stmt, NULL) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                create_notification(db, sqlite3_column_int64(stmt, 0), message, type);
                sent++;
            }
            sqlite3_finalize(stmt);
        }
    }

    log_audit(db, u.user_id, "NOTIFICATION_SEND", "notification", customer_id, message);
    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "sent_count", sent);
    cJSON_AddStringToObject(resp, "message", "Notification dispatched.");
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}

void handle_audit_logs_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;

    sqlite3_stmt *stmt = NULL;
    const char *sql =
        "SELECT a.log_id, COALESCE(u.name, 'System'), COALESCE(u.role, 'system'), a.action, a.entity_type, "
        "COALESCE(a.entity_id, 0), COALESCE(a.details, ''), a.created_at "
        "FROM audit_logs a LEFT JOIN users u ON u.user_id = a.user_id "
        "ORDER BY a.log_id DESC LIMIT 60;";
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database error.");
        return;
    }

    cJSON *arr = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        cJSON_AddNumberToObject(row, "log_id", (double)sqlite3_column_int64(stmt, 0));
        cJSON_AddStringToObject(row, "actor_name", (const char *)sqlite3_column_text(stmt, 1));
        cJSON_AddStringToObject(row, "actor_role", (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddStringToObject(row, "action", (const char *)sqlite3_column_text(stmt, 3));
        cJSON_AddStringToObject(row, "entity_type", (const char *)sqlite3_column_text(stmt, 4));
        cJSON_AddNumberToObject(row, "entity_id", (double)sqlite3_column_int64(stmt, 5));
        cJSON_AddStringToObject(row, "details", (const char *)sqlite3_column_text(stmt, 6));
        cJSON_AddStringToObject(row, "created_at", (const char *)sqlite3_column_text(stmt, 7));
        cJSON_AddItemToArray(arr, row);
    }
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "audit_logs", arr);
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_contact_submit(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    char name[128], email[128], subject[160], message[1024];
    if (!json_get_string(body, "name", name, sizeof(name)) ||
        !json_get_string(body, "email", email, sizeof(email)) ||
        !json_get_string(body, "subject", subject, sizeof(subject)) ||
        !json_get_string(body, "message", message, sizeof(message))) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "Name, email, subject, and message are required.");
        return;
    }
    cJSON_Delete(body);

    if (!is_valid_email(email)) {
        send_error(c, 400, "INVALID_EMAIL", "Please provide a valid email address.");
        return;
    }

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db,
            "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?);",
            -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Failed to save contact message.");
        return;
    }
    sqlite3_bind_text(stmt, 1, name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, subject, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, message, -1, SQLITE_TRANSIENT);
    sqlite3_step(stmt);
    int64_t msg_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddBoolToObject(resp, "ok", 1);
    cJSON_AddNumberToObject(resp, "message_id", (double)msg_id);
    cJSON_AddStringToObject(resp, "message", "Thank you! Your inquiry has been logged for our utility support team.");
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}
