#include "aquabill.h"
#include "crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static bool create_session_token(sqlite3 *db, int64_t user_id, char *out_token, size_t out_sz) {
    if (!crypto_generate_token(out_token, out_sz)) return false;
    char token_hash[65];
    crypto_sha256_hex(out_token, strlen(out_token), token_hash, sizeof(token_hash));

    const char *sql =
        "INSERT INTO sessions (token_hash, user_id, expires_at) "
        "VALUES (?, ?, datetime('now', '+24 hours'));";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;
    sqlite3_bind_text(stmt, 1, token_hash, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 2, user_id);
    bool ok = (sqlite3_step(stmt) == SQLITE_DONE);
    sqlite3_finalize(stmt);
    return ok;
}

static cJSON *build_user_json(const auth_user_t *u, const char *phone, const char *address) {
    cJSON *obj = cJSON_CreateObject();
    cJSON_AddNumberToObject(obj, "user_id", (double)u->user_id);
    if (u->customer_id > 0) {
        cJSON_AddNumberToObject(obj, "customer_id", (double)u->customer_id);
    } else {
        cJSON_AddNullToObject(obj, "customer_id");
    }
    cJSON_AddStringToObject(obj, "name", u->name);
    cJSON_AddStringToObject(obj, "email", u->email);
    cJSON_AddStringToObject(obj, "role", u->role == ROLE_ADMIN ? "admin" : "customer");
    cJSON_AddStringToObject(obj, "status", u->status);
    if (phone) cJSON_AddStringToObject(obj, "phone", phone);
    if (address) cJSON_AddStringToObject(obj, "address", address);
    return obj;
}

bool authenticate_request(sqlite3 *db, struct mg_http_message *hm, auth_user_t *user_out) {
    if (!db || !hm || !user_out) return false;
    char token[128];
    if (!extract_bearer_token(hm, token, sizeof(token))) return false;

    char token_hash[65];
    crypto_sha256_hex(token, strlen(token), token_hash, sizeof(token_hash));

    const char *sql =
        "SELECT u.user_id, COALESCE(c.customer_id, 0), u.name, u.email, u.role, u.status "
        "FROM sessions s "
        "JOIN users u ON u.user_id = s.user_id "
        "LEFT JOIN customers c ON c.user_id = u.user_id "
        "WHERE s.token_hash = ? AND s.expires_at > datetime('now') "
        "LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;
    sqlite3_bind_text(stmt, 1, token_hash, -1, SQLITE_TRANSIENT);

    bool found = false;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        const char *role_str = (const char *)sqlite3_column_text(stmt, 4);
        const char *status_str = (const char *)sqlite3_column_text(stmt, 5);
        if (status_str && strcmp(status_str, "active") == 0) {
            user_out->user_id = sqlite3_column_int64(stmt, 0);
            user_out->customer_id = sqlite3_column_int64(stmt, 1);
            safe_strncpy(user_out->name, (const char *)sqlite3_column_text(stmt, 2), sizeof(user_out->name));
            safe_strncpy(user_out->email, (const char *)sqlite3_column_text(stmt, 3), sizeof(user_out->email));
            safe_strncpy(user_out->status, status_str, sizeof(user_out->status));
            if (role_str && strcmp(role_str, "admin") == 0) user_out->role = ROLE_ADMIN;
            else if (role_str && strcmp(role_str, "customer") == 0) user_out->role = ROLE_CUSTOMER;
            else user_out->role = ROLE_NONE;
            found = (user_out->role != ROLE_NONE);
        }
    }
    sqlite3_finalize(stmt);
    return found;
}

bool require_auth(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, auth_user_t *user_out) {
    if (!authenticate_request(db, hm, user_out)) {
        send_error(c, 401, "UNAUTHORIZED", "Authentication required. Please sign in.");
        return false;
    }
    return true;
}

bool require_admin(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, auth_user_t *user_out) {
    if (!require_auth(c, db, hm, user_out)) return false;
    if (user_out->role != ROLE_ADMIN) {
        send_error(c, 403, "FORBIDDEN", "Administrator privileges are required for this action.");
        return false;
    }
    return true;
}

void handle_auth_register(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Request body must be valid JSON.");
        return;
    }

    char name[128], email[128], password[128], phone[64], address[256];
    if (!json_get_string(body, "name", name, sizeof(name)) ||
        !json_get_string(body, "email", email, sizeof(email)) ||
        !json_get_string(body, "password", password, sizeof(password)) ||
        !json_get_string(body, "phone", phone, sizeof(phone)) ||
        !json_get_string(body, "address", address, sizeof(address))) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "Name, email, password, phone, and address are required.");
        return;
    }

    /* Security guard: reject any attempt to supply role="admin" on public registration */
    cJSON *role_item = cJSON_GetObjectItemCaseSensitive(body, "role");
    if (cJSON_IsString(role_item) && role_item->valuestring &&
        strcasecmp(role_item->valuestring, "customer") != 0) {
        cJSON_Delete(body);
        send_error(c, 403, "FORBIDDEN_ROLE", "Public registration is strictly restricted to customer accounts.");
        return;
    }
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
        send_error(c, 500, "CRYPTO_ERROR", "Failed to hash password.");
        return;
    }

    char *errmsg = NULL;
    if (sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION;", NULL, NULL, &errmsg) != SQLITE_OK) {
        sqlite3_free(errmsg);
        send_error(c, 500, "DB_ERROR", "Could not start registration transaction.");
        return;
    }

    const char *ins_user =
        "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'customer', 'active');";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, ins_user, -1, &stmt, NULL) != SQLITE_OK) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 500, "DB_ERROR", "Failed to prepare user insert.");
        return;
    }
    sqlite3_bind_text(stmt, 1, name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, pass_hash, -1, SQLITE_TRANSIENT);
    int rc = sqlite3_step(stmt);
    int64_t new_user_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        if (rc == SQLITE_CONSTRAINT) {
            send_error(c, 409, "DUPLICATE_EMAIL", "An account with this email address already exists.");
        } else {
            send_error(c, 500, "DB_ERROR", "Failed to register user account.");
        }
        return;
    }

    const char *ins_cust = "INSERT INTO customers (user_id, phone, address) VALUES (?, ?, ?);";
    if (sqlite3_prepare_v2(db, ins_cust, -1, &stmt, NULL) != SQLITE_OK) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 500, "DB_ERROR", "Failed to prepare customer insert.");
        return;
    }
    sqlite3_bind_int64(stmt, 1, new_user_id);
    sqlite3_bind_text(stmt, 2, phone, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, address, -1, SQLITE_TRANSIENT);
    rc = sqlite3_step(stmt);
    int64_t new_customer_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 500, "DB_ERROR", "Failed to create customer profile.");
        return;
    }

    create_notification(db, new_user_id,
                        "Welcome to AquaBill! Your customer portal is active. An administrator will link your water meter shortly.",
                        "account_update");
    log_audit(db, new_user_id, "CUSTOMER_REGISTER", "customer", new_customer_id,
              "New customer self-registered via public portal.");

    if (sqlite3_exec(db, "COMMIT;", NULL, NULL, &errmsg) != SQLITE_OK) {
        sqlite3_free(errmsg);
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        send_error(c, 500, "DB_ERROR", "Failed to commit registration.");
        return;
    }

    char token[128];
    if (!create_session_token(db, new_user_id, token, sizeof(token))) {
        send_error(c, 500, "SESSION_ERROR", "Account created but session initialization failed.");
        return;
    }

    auth_user_t u = {0};
    u.user_id = new_user_id;
    u.customer_id = new_customer_id;
    safe_strncpy(u.name, name, sizeof(u.name));
    safe_strncpy(u.email, email, sizeof(u.email));
    u.role = ROLE_CUSTOMER;
    safe_strncpy(u.status, "active", sizeof(u.status));

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddStringToObject(resp, "token", token);
    cJSON_AddItemToObject(resp, "user", build_user_json(&u, phone, address));
    send_json(c, 201, resp);
    cJSON_Delete(resp);
}

static void perform_login(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm, bool admin_only) {
    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Request body must be valid JSON.");
        return;
    }
    char email[128], password[128];
    if (!json_get_string(body, "email", email, sizeof(email)) ||
        !json_get_string(body, "password", password, sizeof(password))) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "Email and password are required.");
        return;
    }
    cJSON_Delete(body);

    const char *sql =
        "SELECT u.user_id, COALESCE(c.customer_id, 0), u.name, u.email, u.password_hash, u.role, u.status, "
        "COALESCE(c.phone, ''), COALESCE(c.address, '') "
        "FROM users u LEFT JOIN customers c ON c.user_id = u.user_id "
        "WHERE u.email = ? LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        send_error(c, 500, "DB_ERROR", "Database query error.");
        return;
    }
    sqlite3_bind_text(stmt, 1, email, -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        send_error(c, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
        return;
    }

    int64_t user_id = sqlite3_column_int64(stmt, 0);
    int64_t customer_id = sqlite3_column_int64(stmt, 1);
    char name[128], db_email[128], stored_hash[160], role_str[32], status_str[32], phone[64], address[256];
    safe_strncpy(name, (const char *)sqlite3_column_text(stmt, 2), sizeof(name));
    safe_strncpy(db_email, (const char *)sqlite3_column_text(stmt, 3), sizeof(db_email));
    safe_strncpy(stored_hash, (const char *)sqlite3_column_text(stmt, 4), sizeof(stored_hash));
    safe_strncpy(role_str, (const char *)sqlite3_column_text(stmt, 5), sizeof(role_str));
    safe_strncpy(status_str, (const char *)sqlite3_column_text(stmt, 6), sizeof(status_str));
    safe_strncpy(phone, (const char *)sqlite3_column_text(stmt, 7), sizeof(phone));
    safe_strncpy(address, (const char *)sqlite3_column_text(stmt, 8), sizeof(address));
    sqlite3_finalize(stmt);

    if (!crypto_verify_password(password, stored_hash)) {
        send_error(c, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
        return;
    }
    if (strcmp(status_str, "active") != 0) {
        send_error(c, 403, "ACCOUNT_INACTIVE", "This account is currently inactive or suspended.");
        return;
    }
    if (admin_only && strcmp(role_str, "admin") != 0) {
        send_error(c, 403, "FORBIDDEN", "Administrator privileges are required to sign in to the Admin Console.");
        return;
    }

    /* Clean up expired sessions opportunistically */
    sqlite3_exec(db, "DELETE FROM sessions WHERE expires_at <= datetime('now');", NULL, NULL, NULL);

    char token[128];
    if (!create_session_token(db, user_id, token, sizeof(token))) {
        send_error(c, 500, "SESSION_ERROR", "Failed to establish user session.");
        return;
    }

    log_audit(db, user_id, admin_only ? "ADMIN_LOGIN" : "USER_LOGIN", "user", user_id, role_str);

    auth_user_t u = {0};
    u.user_id = user_id;
    u.customer_id = customer_id;
    safe_strncpy(u.name, name, sizeof(u.name));
    safe_strncpy(u.email, db_email, sizeof(u.email));
    u.role = (strcmp(role_str, "admin") == 0) ? ROLE_ADMIN : ROLE_CUSTOMER;
    safe_strncpy(u.status, status_str, sizeof(u.status));

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddStringToObject(resp, "token", token);
    cJSON_AddItemToObject(resp, "user", build_user_json(&u, customer_id > 0 ? phone : NULL, customer_id > 0 ? address : NULL));
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_auth_login(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    perform_login(c, db, hm, false);
}

void handle_admin_auth_login(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    perform_login(c, db, hm, true);
}

void handle_auth_logout(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    char token[128];
    if (extract_bearer_token(hm, token, sizeof(token))) {
        char token_hash[65];
        crypto_sha256_hex(token, strlen(token), token_hash, sizeof(token_hash));
        sqlite3_stmt *stmt = NULL;
        if (sqlite3_prepare_v2(db, "DELETE FROM sessions WHERE token_hash = ?;", -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_text(stmt, 1, token_hash, -1, SQLITE_TRANSIENT);
            sqlite3_step(stmt);
            sqlite3_finalize(stmt);
        }
    }
    send_ok_message(c, 200, "Logged out successfully.");
}

void handle_auth_me(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    char phone[64] = {0}, address[256] = {0};
    if (u.customer_id > 0) {
        sqlite3_stmt *stmt = NULL;
        if (sqlite3_prepare_v2(db, "SELECT phone, address FROM customers WHERE customer_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_int64(stmt, 1, u.customer_id);
            if (sqlite3_step(stmt) == SQLITE_ROW) {
                safe_strncpy(phone, (const char *)sqlite3_column_text(stmt, 0), sizeof(phone));
                safe_strncpy(address, (const char *)sqlite3_column_text(stmt, 1), sizeof(address));
            }
            sqlite3_finalize(stmt);
        }
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "user", build_user_json(&u, u.customer_id > 0 ? phone : NULL, u.customer_id > 0 ? address : NULL));
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_profile_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    handle_auth_me(c, db, hm);
}

void handle_profile_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    char name[128], phone[64], address[256];
    bool has_name = json_get_string(body, "name", name, sizeof(name));
    bool has_phone = json_get_string(body, "phone", phone, sizeof(phone));
    bool has_address = json_get_string(body, "address", address, sizeof(address));
    cJSON_Delete(body);

    if (!has_name) safe_strncpy(name, u.name, sizeof(name));

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, "UPDATE users SET name = ? WHERE user_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, name, -1, SQLITE_TRANSIENT);
        sqlite3_bind_int64(stmt, 2, u.user_id);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    if (u.customer_id > 0 && (has_phone || has_address)) {
        const char *csql =
            "UPDATE customers SET "
            "phone = COALESCE(?, phone), "
            "address = COALESCE(?, address) "
            "WHERE customer_id = ?;";
        if (sqlite3_prepare_v2(db, csql, -1, &stmt, NULL) == SQLITE_OK) {
            if (has_phone) sqlite3_bind_text(stmt, 1, phone, -1, SQLITE_TRANSIENT);
            else sqlite3_bind_null(stmt, 1);
            if (has_address) sqlite3_bind_text(stmt, 2, address, -1, SQLITE_TRANSIENT);
            else sqlite3_bind_null(stmt, 2);
            sqlite3_bind_int64(stmt, 3, u.customer_id);
            sqlite3_step(stmt);
            sqlite3_finalize(stmt);
        }
    }

    log_audit(db, u.user_id, "PROFILE_UPDATE", "user", u.user_id, "Updated own profile details.");
    send_ok_message(c, 200, "Profile updated successfully.");
}

void handle_profile_password(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_auth(c, db, hm, &u)) return;

    cJSON *body = parse_json_body(hm);
    if (!body) {
        send_error(c, 400, "INVALID_JSON", "Invalid JSON payload.");
        return;
    }

    char current_pw[128], new_pw[128];
    if (!json_get_string(body, "current_password", current_pw, sizeof(current_pw)) ||
        !json_get_string(body, "new_password", new_pw, sizeof(new_pw))) {
        cJSON_Delete(body);
        send_error(c, 400, "VALIDATION_ERROR", "Current password and new password are required.");
        return;
    }
    cJSON_Delete(body);

    if (strlen(new_pw) < 8) {
        send_error(c, 400, "WEAK_PASSWORD", "New password must be at least 8 characters long.");
        return;
    }

    sqlite3_stmt *stmt = NULL;
    char stored_hash[160] = {0};
    if (sqlite3_prepare_v2(db, "SELECT password_hash FROM users WHERE user_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, u.user_id);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            safe_strncpy(stored_hash, (const char *)sqlite3_column_text(stmt, 0), sizeof(stored_hash));
        }
        sqlite3_finalize(stmt);
    }

    if (!crypto_verify_password(current_pw, stored_hash)) {
        send_error(c, 400, "INVALID_PASSWORD", "Current password is incorrect.");
        return;
    }

    char new_hash[PASSWORD_HASH_BUFSZ];
    if (!crypto_hash_password(new_pw, new_hash, sizeof(new_hash))) {
        send_error(c, 500, "CRYPTO_ERROR", "Failed to hash new password.");
        return;
    }

    if (sqlite3_prepare_v2(db, "UPDATE users SET password_hash = ? WHERE user_id = ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, new_hash, -1, SQLITE_TRANSIENT);
        sqlite3_bind_int64(stmt, 2, u.user_id);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    log_audit(db, u.user_id, "PASSWORD_CHANGE", "user", u.user_id, "User changed account password.");
    send_ok_message(c, 200, "Password changed successfully.");
}

void handle_admin_profile_get(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;
    cJSON *resp = cJSON_CreateObject();
    cJSON_AddItemToObject(resp, "user", build_user_json(&u, NULL, NULL));
    send_json(c, 200, resp);
    cJSON_Delete(resp);
}

void handle_admin_profile_update(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;
    handle_profile_update(c, db, hm);
}

void handle_admin_profile_password(struct mg_connection *c, sqlite3 *db, struct mg_http_message *hm) {
    auth_user_t u;
    if (!require_admin(c, db, hm, &u)) return;
    handle_profile_password(c, db, hm);
}
