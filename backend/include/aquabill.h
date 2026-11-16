#ifndef AQUABILL_H
#define AQUABILL_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>
#ifdef _WIN32
#define strncasecmp _strnicmp
#define strcasecmp _stricmp
#define strtok_r strtok_s
#else
#include <strings.h>
#endif
#include "mongoose.h"
#include "cJSON.h"
#include <sqlite3.h>

#define AQUABILL_VERSION "1.0.0"
#define AQUABILL_DEFAULT_PORT "8080"
#define AQUABILL_DEFAULT_DB "database/aquabill.db"
#define AQUABILL_DEFAULT_WEBROOT "frontend"
#define AQUABILL_SESSION_TTL_HOURS 24

typedef enum {
    ROLE_NONE = 0,
    ROLE_CUSTOMER = 1,
    ROLE_ADMIN = 2
} user_role_t;

typedef struct {
    int64_t user_id;
    int64_t customer_id; /* 0 if admin */
    char name[128];
    char email[128];
    user_role_t role;
    char status[32];
} auth_user_t;

typedef struct {
    sqlite3 *db;
    char db_path[512];
    char web_root[512];
    char listen_addr[128];
} app_ctx_t;

/* JSON / HTTP Utilities (utils.c) */
void send_json(struct mg_connection *c, int status, cJSON *json);
void send_error(struct mg_connection *c, int status, const char *code, const char *message);
void send_ok_message(struct mg_connection *c, int status, const char *message);
cJSON *parse_json_body(struct mg_http_message *hm);
bool json_get_string(cJSON *obj, const char *key, char *out, size_t out_sz);
bool json_get_int64(cJSON *obj, const char *key, int64_t *out);
void safe_strncpy(char *dst, const char *src, size_t dst_sz);
bool is_valid_email(const char *email);
bool is_valid_period(const char *period); /* YYYY-MM */
bool is_valid_date(const char *date);     /* YYYY-MM-DD */
void current_date_utc(char *out, size_t out_sz);
void add_days_to_date(const char *date_ymd, int days, char *out, size_t out_sz);
bool extract_bearer_token(struct mg_http_message *hm, char *out, size_t out_sz);
bool extract_query_param(struct mg_http_message *hm, const char *name, char *out, size_t out_sz);
bool parse_path_id(struct mg_str uri, const char *prefix, int64_t *id_out, char *suffix_buf, size_t suffix_sz);

/* Audit & Notification Helpers (utils.c) */
void log_audit(sqlite3 *db, int64_t user_id, const char *action, const char *entity_type,
               int64_t entity_id, const char *details);
void create_notification(sqlite3 *db, int64_t user_id, const char *message, const char *type);

/* Auth & RBAC (auth.c) */
bool authenticate_request(sqlite3 *db, struct mg_http_message *hm, auth_user_t *user_out);
bool require_auth(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, auth_user_t *user_out);
bool require_admin(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, auth_user_t *user_out);

void handle_auth_register(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_auth_login(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_admin_auth_login(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_auth_logout(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_auth_me(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_profile_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_profile_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_profile_password(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_admin_profile_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_admin_profile_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_admin_profile_password(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);

/* Customers (customer.c) */
void handle_customers_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_customers_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_customers_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t customer_id);
void handle_customers_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t customer_id);
void handle_customers_delete(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t customer_id);

/* Meters (meter.c) */
void handle_meters_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_meters_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_meters_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t meter_id);
void handle_meters_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t meter_id);

/* Readings (reading.c) */
void handle_readings_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_readings_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_readings_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t reading_id);

/* Tariffs & Bills (billing_api.c) */
void handle_tariffs_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_tariffs_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_tariffs_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t tariff_id);

void handle_bills_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_bills_preview(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_bills_generate(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_bills_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t bill_id);
void handle_bills_cancel(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t bill_id);

/* Payments (payment.c) */
void handle_payments_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_payments_create(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);

/* Reports, Notifications, Audit, Contact (reports.c) */
void handle_reports_monthly(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_reports_consumption(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_reports_revenue(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_reports_outstanding(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_reports_summary(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_dashboard_summary(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);

void handle_notifications_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_notifications_read(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, int64_t notification_id);
void handle_notifications_read_all(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_notifications_remind(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_notifications_send(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);

void handle_audit_logs_list(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);
void handle_contact_submit(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm);

/* Server (server.c) */
void aquabill_http_handler(struct mg_connection *c, int ev, void *ev_data);

#endif
