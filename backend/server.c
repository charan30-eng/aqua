#include "aquabill.h"
#include <stdio.h>
#include <string.h>

static bool method_is(struct mg_http_message *hm, const char *m) {
    size_t len = strlen(m);
    return hm->method.len == len && strncasecmp(hm->method.buf, m, len) == 0;
}

static bool uri_is(struct mg_http_message *hm, const char *path) {
    size_t len = strlen(path);
    return hm->uri.len == len && strncmp(hm->uri.buf, path, len) == 0;
}

void aquabill_http_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev != MG_EV_HTTP_MSG) return;

    struct mg_http_message *hm = (struct mg_http_message *)ev_data;
    app_ctx_t *ctx = (app_ctx_t *)c->fn_data;
    sqlite3 *db = ctx->db;

    /* Handle CORS preflight */
    if (method_is(hm, "OPTIONS")) {
        mg_http_reply(c, 204,
                      "Access-Control-Allow-Origin: *\r\n"
                      "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
                      "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n",
                      "");
        return;
    }

    /* API Routes */
    if (hm->uri.len >= 4 && strncmp(hm->uri.buf, "/api", 4) == 0) {
        if (uri_is(hm, "/api/health") && method_is(hm, "GET")) {
            cJSON *resp = cJSON_CreateObject();
            cJSON_AddStringToObject(resp, "status", "ok");
            cJSON_AddStringToObject(resp, "engine", "AquaBill C/Mongoose");
            cJSON_AddStringToObject(resp, "version", AQUABILL_VERSION);
            cJSON_AddStringToObject(resp, "db", db ? "connected" : "disconnected");
            send_json(c, 200, resp);
            cJSON_Delete(resp);
            return;
        }

        if (uri_is(hm, "/api/contact") && method_is(hm, "POST")) {
            handle_contact_submit(c, db, hm); return;
        }

        /* Admin Auth & Strictly Protected Admin API Routes */
        if (uri_is(hm, "/api/admin/auth/login") && method_is(hm, "POST")) {
            handle_admin_auth_login(c, db, hm); return;
        }
        if (uri_is(hm, "/api/admin/auth/register")) {
            send_error(c, 403, "FORBIDDEN", "Public administrator registration is disabled.");
            return;
        }
        if (hm->uri.len >= 11 && strncmp(hm->uri.buf, "/api/admin/", 11) == 0) {
            auth_user_t admin_u;
            if (!require_admin(c, db, hm, &admin_u)) return;

            int64_t aid = 0;
            char asuf[64] = {0};

            if (uri_is(hm, "/api/admin/dashboard") && method_is(hm, "GET")) {
                handle_dashboard_summary(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/profile")) {
                if (method_is(hm, "GET")) { handle_admin_profile_get(c, db, hm); return; }
                if (method_is(hm, "PUT")) { handle_admin_profile_update(c, db, hm); return; }
            }
            if (uri_is(hm, "/api/admin/profile/password") && method_is(hm, "PUT")) {
                handle_admin_profile_password(c, db, hm); return;
            }

            if (uri_is(hm, "/api/admin/customers")) {
                if (method_is(hm, "GET")) { handle_customers_list(c, db, hm); return; }
                if (method_is(hm, "POST")) { handle_customers_create(c, db, hm); return; }
            }
            if (parse_path_id(hm->uri, "/api/admin/customers/", &aid, asuf, sizeof(asuf)) && asuf[0] == '\0') {
                if (method_is(hm, "GET")) { handle_customers_get(c, db, hm, aid); return; }
                if (method_is(hm, "PUT")) { handle_customers_update(c, db, hm, aid); return; }
                if (method_is(hm, "DELETE")) { handle_customers_delete(c, db, hm, aid); return; }
            }

            if (uri_is(hm, "/api/admin/meters")) {
                if (method_is(hm, "GET")) { handle_meters_list(c, db, hm); return; }
                if (method_is(hm, "POST")) { handle_meters_create(c, db, hm); return; }
            }
            if (parse_path_id(hm->uri, "/api/admin/meters/", &aid, asuf, sizeof(asuf)) && asuf[0] == '\0') {
                if (method_is(hm, "GET")) { handle_meters_get(c, db, hm, aid); return; }
                if (method_is(hm, "PUT")) { handle_meters_update(c, db, hm, aid); return; }
            }

            if (uri_is(hm, "/api/admin/readings")) {
                if (method_is(hm, "GET")) { handle_readings_list(c, db, hm); return; }
                if (method_is(hm, "POST")) { handle_readings_create(c, db, hm); return; }
            }
            if (parse_path_id(hm->uri, "/api/admin/readings/", &aid, asuf, sizeof(asuf)) && asuf[0] == '\0') {
                if (method_is(hm, "GET")) { handle_readings_get(c, db, hm, aid); return; }
            }

            if (uri_is(hm, "/api/admin/tariffs")) {
                if (method_is(hm, "GET")) { handle_tariffs_list(c, db, hm); return; }
                if (method_is(hm, "POST")) { handle_tariffs_create(c, db, hm); return; }
            }
            if (parse_path_id(hm->uri, "/api/admin/tariffs/", &aid, asuf, sizeof(asuf)) && asuf[0] == '\0') {
                if (method_is(hm, "PUT")) { handle_tariffs_update(c, db, hm, aid); return; }
            }

            if (uri_is(hm, "/api/admin/bills") && method_is(hm, "GET")) {
                handle_bills_list(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/bills/preview") && method_is(hm, "POST")) {
                handle_bills_preview(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/bills/generate") && method_is(hm, "POST")) {
                handle_bills_generate(c, db, hm); return;
            }
            if (parse_path_id(hm->uri, "/api/admin/bills/", &aid, asuf, sizeof(asuf))) {
                if (asuf[0] == '\0' && method_is(hm, "GET")) { handle_bills_get(c, db, hm, aid); return; }
                if (strcmp(asuf, "/cancel") == 0 && method_is(hm, "PUT")) { handle_bills_cancel(c, db, hm, aid); return; }
            }

            if (uri_is(hm, "/api/admin/payments")) {
                if (method_is(hm, "GET")) { handle_payments_list(c, db, hm); return; }
                if (method_is(hm, "POST")) { handle_payments_create(c, db, hm); return; }
            }

            if (uri_is(hm, "/api/admin/reports/monthly") && method_is(hm, "GET")) {
                handle_reports_monthly(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/reports/consumption") && method_is(hm, "GET")) {
                handle_reports_consumption(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/reports/revenue") && method_is(hm, "GET")) {
                handle_reports_revenue(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/reports/outstanding") && method_is(hm, "GET")) {
                handle_reports_outstanding(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/reports/summary") && method_is(hm, "GET")) {
                handle_reports_summary(c, db, hm); return;
            }

            if (uri_is(hm, "/api/admin/notifications") && method_is(hm, "GET")) {
                handle_notifications_list(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/notifications/read-all") && method_is(hm, "PUT")) {
                handle_notifications_read_all(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/notifications/remind") && method_is(hm, "POST")) {
                handle_notifications_remind(c, db, hm); return;
            }
            if (uri_is(hm, "/api/admin/notifications/send") && method_is(hm, "POST")) {
                handle_notifications_send(c, db, hm); return;
            }
            if (parse_path_id(hm->uri, "/api/admin/notifications/", &aid, asuf, sizeof(asuf)) &&
                strcmp(asuf, "/read") == 0 && method_is(hm, "PUT")) {
                handle_notifications_read(c, db, hm, aid); return;
            }

            if (uri_is(hm, "/api/admin/audit-logs") && method_is(hm, "GET")) {
                handle_audit_logs_list(c, db, hm); return;
            }

            send_error(c, 404, "ENDPOINT_NOT_FOUND", "The requested admin API endpoint does not exist.");
            return;
        }

        /* Auth & Profile */
        if (uri_is(hm, "/api/auth/register") && method_is(hm, "POST")) {
            handle_auth_register(c, db, hm); return;
        }
        if (uri_is(hm, "/api/auth/login") && method_is(hm, "POST")) {
            handle_auth_login(c, db, hm); return;
        }
        if (uri_is(hm, "/api/auth/logout") && method_is(hm, "POST")) {
            handle_auth_logout(c, db, hm); return;
        }
        if (uri_is(hm, "/api/auth/me") && method_is(hm, "GET")) {
            handle_auth_me(c, db, hm); return;
        }
        if (uri_is(hm, "/api/profile")) {
            if (method_is(hm, "GET")) { handle_profile_get(c, db, hm); return; }
            if (method_is(hm, "PUT")) { handle_profile_update(c, db, hm); return; }
        }
        if (uri_is(hm, "/api/profile/password") && method_is(hm, "PUT")) {
            handle_profile_password(c, db, hm); return;
        }

        /* Dashboard */
        if (uri_is(hm, "/api/dashboard") && method_is(hm, "GET")) {
            handle_dashboard_summary(c, db, hm); return;
        }

        /* Customers */
        if (uri_is(hm, "/api/customers")) {
            if (method_is(hm, "GET")) { handle_customers_list(c, db, hm); return; }
            if (method_is(hm, "POST")) { handle_customers_create(c, db, hm); return; }
        }
        int64_t id = 0;
        char suffix[64] = {0};
        if (parse_path_id(hm->uri, "/api/customers/", &id, suffix, sizeof(suffix)) && suffix[0] == '\0') {
            if (method_is(hm, "GET")) { handle_customers_get(c, db, hm, id); return; }
            if (method_is(hm, "PUT")) { handle_customers_update(c, db, hm, id); return; }
            if (method_is(hm, "DELETE")) { handle_customers_delete(c, db, hm, id); return; }
        }

        /* Meters */
        if (uri_is(hm, "/api/meters")) {
            if (method_is(hm, "GET")) { handle_meters_list(c, db, hm); return; }
            if (method_is(hm, "POST")) { handle_meters_create(c, db, hm); return; }
        }
        if (parse_path_id(hm->uri, "/api/meters/", &id, suffix, sizeof(suffix)) && suffix[0] == '\0') {
            if (method_is(hm, "GET")) { handle_meters_get(c, db, hm, id); return; }
            if (method_is(hm, "PUT")) { handle_meters_update(c, db, hm, id); return; }
        }

        /* Readings */
        if (uri_is(hm, "/api/readings")) {
            if (method_is(hm, "GET")) { handle_readings_list(c, db, hm); return; }
            if (method_is(hm, "POST")) { handle_readings_create(c, db, hm); return; }
        }
        if (parse_path_id(hm->uri, "/api/readings/", &id, suffix, sizeof(suffix)) && suffix[0] == '\0') {
            if (method_is(hm, "GET")) { handle_readings_get(c, db, hm, id); return; }
        }

        /* Tariffs */
        if (uri_is(hm, "/api/tariffs")) {
            if (method_is(hm, "GET")) { handle_tariffs_list(c, db, hm); return; }
            if (method_is(hm, "POST")) { handle_tariffs_create(c, db, hm); return; }
        }
        if (parse_path_id(hm->uri, "/api/tariffs/", &id, suffix, sizeof(suffix)) && suffix[0] == '\0') {
            if (method_is(hm, "PUT")) { handle_tariffs_update(c, db, hm, id); return; }
        }

        /* Bills */
        if (uri_is(hm, "/api/bills") && method_is(hm, "GET")) {
            handle_bills_list(c, db, hm); return;
        }
        if (uri_is(hm, "/api/bills/preview") && method_is(hm, "POST")) {
            handle_bills_preview(c, db, hm); return;
        }
        if (uri_is(hm, "/api/bills/generate") && method_is(hm, "POST")) {
            handle_bills_generate(c, db, hm); return;
        }
        if (parse_path_id(hm->uri, "/api/bills/", &id, suffix, sizeof(suffix))) {
            if (suffix[0] == '\0' && method_is(hm, "GET")) {
                handle_bills_get(c, db, hm, id); return;
            }
            if (strcmp(suffix, "/cancel") == 0 && method_is(hm, "PUT")) {
                handle_bills_cancel(c, db, hm, id); return;
            }
        }

        /* Payments */
        if (uri_is(hm, "/api/payments")) {
            if (method_is(hm, "GET")) { handle_payments_list(c, db, hm); return; }
            if (method_is(hm, "POST")) { handle_payments_create(c, db, hm); return; }
        }

        /* Reports */
        if (uri_is(hm, "/api/reports/monthly") && method_is(hm, "GET")) {
            handle_reports_monthly(c, db, hm); return;
        }
        if (uri_is(hm, "/api/reports/consumption") && method_is(hm, "GET")) {
            handle_reports_consumption(c, db, hm); return;
        }
        if (uri_is(hm, "/api/reports/revenue") && method_is(hm, "GET")) {
            handle_reports_revenue(c, db, hm); return;
        }
        if (uri_is(hm, "/api/reports/outstanding") && method_is(hm, "GET")) {
            handle_reports_outstanding(c, db, hm); return;
        }
        if (uri_is(hm, "/api/reports/summary") && method_is(hm, "GET")) {
            handle_reports_summary(c, db, hm); return;
        }

        /* Notifications */
        if (uri_is(hm, "/api/notifications") && method_is(hm, "GET")) {
            handle_notifications_list(c, db, hm); return;
        }
        if (uri_is(hm, "/api/notifications/read-all") && method_is(hm, "PUT")) {
            handle_notifications_read_all(c, db, hm); return;
        }
        if (uri_is(hm, "/api/notifications/remind") && method_is(hm, "POST")) {
            handle_notifications_remind(c, db, hm); return;
        }
        if (uri_is(hm, "/api/notifications/send") && method_is(hm, "POST")) {
            handle_notifications_send(c, db, hm); return;
        }
        if (parse_path_id(hm->uri, "/api/notifications/", &id, suffix, sizeof(suffix)) &&
            strcmp(suffix, "/read") == 0 && method_is(hm, "PUT")) {
            handle_notifications_read(c, db, hm, id); return;
        }

        /* Audit logs */
        if (uri_is(hm, "/api/audit-logs") && method_is(hm, "GET")) {
            handle_audit_logs_list(c, db, hm); return;
        }

        send_error(c, 404, "ENDPOINT_NOT_FOUND", "The requested API endpoint does not exist.");
        return;
    }

    /* Serve static frontend files */
    struct mg_http_serve_opts opts = {
        .root_dir = ctx->web_root,
        .extra_headers = "X-Content-Type-Options: nosniff\r\n"
    };
    mg_http_serve_dir(c, hm, &opts);
}
