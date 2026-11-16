#include "aquabill.h"
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

void safe_strncpy(char *dst, const char *src, size_t dst_sz) {
    if (!dst || dst_sz == 0) return;
    if (!src) {
        dst[0] = '\0';
        return;
    }
    strncpy(dst, src, dst_sz - 1);
    dst[dst_sz - 1] = '\0';
}

void send_json(struct mg_connection *c, int status, cJSON *json) {
    char *body = cJSON_PrintUnformatted(json);
    if (!body) {
        mg_http_reply(c, 500,
                      "Content-Type: application/json\r\n"
                      "Access-Control-Allow-Origin: *\r\n",
                      "{\"error\":{\"code\":\"INTERNAL_ERROR\",\"message\":\"JSON serialization failed\"}}");
        return;
    }
    mg_http_reply(c, status,
                  "Content-Type: application/json\r\n"
                  "Cache-Control: no-store\r\n"
                  "X-Content-Type-Options: nosniff\r\n"
                  "Access-Control-Allow-Origin: *\r\n"
                  "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
                  "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n",
                  "%s", body);
    free(body);
}

void send_error(struct mg_connection *c, int status, const char *code, const char *message) {
    cJSON *root = cJSON_CreateObject();
    cJSON *err = cJSON_CreateObject();
    cJSON_AddStringToObject(err, "code", code ? code : "ERROR");
    cJSON_AddStringToObject(err, "message", message ? message : "Request failed");
    cJSON_AddItemToObject(root, "error", err);
    send_json(c, status, root);
    cJSON_Delete(root);
}

void send_ok_message(struct mg_connection *c, int status, const char *message) {
    cJSON *root = cJSON_CreateObject();
    cJSON_AddBoolToObject(root, "ok", 1);
    cJSON_AddStringToObject(root, "message", message ? message : "Success");
    send_json(c, status, root);
    cJSON_Delete(root);
}

cJSON *parse_json_body(struct mg_http_message *hm) {
    if (!hm || hm->body.len == 0 || hm->body.len > 1024 * 1024) return NULL;
    char *buf = (char *)malloc(hm->body.len + 1);
    if (!buf) return NULL;
    memcpy(buf, hm->body.buf, hm->body.len);
    buf[hm->body.len] = '\0';
    cJSON *parsed = cJSON_Parse(buf);
    free(buf);
    return parsed;
}

bool json_get_string(cJSON *obj, const char *key, char *out, size_t out_sz) {
    if (!obj || !key || !out || out_sz == 0) return false;
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (!cJSON_IsString(item) || !item->valuestring) return false;
    /* Trim leading/trailing whitespace */
    const char *s = item->valuestring;
    while (*s && isspace((unsigned char)*s)) s++;
    size_t len = strlen(s);
    while (len > 0 && isspace((unsigned char)s[len - 1])) len--;
    if (len == 0) return false;
    size_t copy_len = len < out_sz - 1 ? len : out_sz - 1;
    memcpy(out, s, copy_len);
    out[copy_len] = '\0';
    return true;
}

bool json_get_int64(cJSON *obj, const char *key, int64_t *out) {
    if (!obj || !key || !out) return false;
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (!cJSON_IsNumber(item)) return false;
    *out = (int64_t)item->valuedouble;
    return true;
}

bool is_valid_email(const char *email) {
    if (!email) return false;
    size_t len = strlen(email);
    if (len < 5 || len > 120) return false;
    const char *at = strchr(email, '@');
    if (!at || at == email) return false;
    const char *dot = strchr(at + 1, '.');
    if (!dot || dot == at + 1 || dot[1] == '\0') return false;
    for (size_t i = 0; i < len; i++) {
        if (isspace((unsigned char)email[i])) return false;
    }
    return true;
}

bool is_valid_period(const char *period) {
    if (!period || strlen(period) != 7) return false;
    for (int i = 0; i < 7; i++) {
        if (i == 4) {
            if (period[i] != '-') return false;
        } else {
            if (!isdigit((unsigned char)period[i])) return false;
        }
    }
    int year = atoi(period);
    int month = atoi(period + 5);
    return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
}

bool is_valid_date(const char *date) {
    if (!date || strlen(date) != 10) return false;
    for (int i = 0; i < 10; i++) {
        if (i == 4 || i == 7) {
            if (date[i] != '-') return false;
        } else {
            if (!isdigit((unsigned char)date[i])) return false;
        }
    }
    int y = atoi(date);
    int m = atoi(date + 5);
    int d = atoi(date + 8);
    return y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

void current_date_utc(char *out, size_t out_sz) {
    time_t now = time(NULL);
    struct tm tm_utc;
#ifdef _WIN32
    gmtime_s(&tm_utc, &now);
#else
    gmtime_r(&now, &tm_utc);
#endif
    strftime(out, out_sz, "%Y-%m-%d", &tm_utc);
}

void add_days_to_date(const char *date_ymd, int days, char *out, size_t out_sz) {
    struct tm t = {0};
    int y = 2026, m = 1, d = 1;
    if (sscanf(date_ymd, "%d-%d-%d", &y, &m, &d) == 3) {
        t.tm_year = y - 1900;
        t.tm_mon = m - 1;
        t.tm_mday = d + days;
        t.tm_hour = 12;
        mktime(&t);
        strftime(out, out_sz, "%Y-%m-%d", &t);
    } else {
        safe_strncpy(out, date_ymd, out_sz);
    }
}

bool extract_bearer_token(struct mg_http_message *hm, char *out, size_t out_sz) {
    struct mg_str *auth = mg_http_get_header(hm, "Authorization");
    if (!auth || auth->len < 8) return false;
    if (strncasecmp(auth->buf, "Bearer ", 7) != 0) return false;
    size_t tok_len = auth->len - 7;
    if (tok_len == 0 || tok_len >= out_sz) return false;
    memcpy(out, auth->buf + 7, tok_len);
    out[tok_len] = '\0';
    /* Trim trailing whitespace */
    while (tok_len > 0 && isspace((unsigned char)out[tok_len - 1])) {
        out[--tok_len] = '\0';
    }
    return tok_len > 0;
}

bool extract_query_param(struct mg_http_message *hm, const char *name, char *out, size_t out_sz) {
    if (!hm || !name || !out || out_sz == 0) return false;
    out[0] = '\0';
    if (hm->query.len == 0) return false;
    int len = mg_http_get_var(&hm->query, name, out, out_sz);
    return len > 0;
}

bool parse_path_id(struct mg_str uri, const char *prefix, int64_t *id_out, char *suffix_buf, size_t suffix_sz) {
    size_t plen = strlen(prefix);
    if (uri.len <= plen || strncmp(uri.buf, prefix, plen) != 0) return false;
    const char *p = uri.buf + plen;
    size_t rem = uri.len - plen;
    if (!isdigit((unsigned char)p[0])) return false;

    int64_t val = 0;
    size_t i = 0;
    while (i < rem && isdigit((unsigned char)p[i])) {
        val = val * 10 + (p[i] - '0');
        i++;
    }
    if (i == 0) return false;
    if (id_out) *id_out = val;
    if (suffix_buf && suffix_sz > 0) {
        size_t slen = rem - i;
        if (slen >= suffix_sz) slen = suffix_sz - 1;
        if (slen > 0) memcpy(suffix_buf, p + i, slen);
        suffix_buf[slen] = '\0';
    }
    return true;
}

void log_audit(sqlite3 *db, int64_t user_id, const char *action, const char *entity_type,
               int64_t entity_id, const char *details) {
    const char *sql =
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) "
        "VALUES (?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        if (user_id > 0) sqlite3_bind_int64(stmt, 1, user_id);
        else sqlite3_bind_null(stmt, 1);
        sqlite3_bind_text(stmt, 2, action ? action : "ACTION", -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, entity_type ? entity_type : "system", -1, SQLITE_TRANSIENT);
        if (entity_id > 0) sqlite3_bind_int64(stmt, 4, entity_id);
        else sqlite3_bind_null(stmt, 4);
        sqlite3_bind_text(stmt, 5, details ? details : "", -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
}

void create_notification(sqlite3 *db, int64_t user_id, const char *message, const char *type) {
    const char *sql =
        "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?);";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, user_id);
        sqlite3_bind_text(stmt, 2, message ? message : "", -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, type ? type : "account_update", -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
}
