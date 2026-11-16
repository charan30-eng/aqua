#include "database.h"
#include "aquabill.h"
#include "billing.h"
#include "crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static char *read_entire_file(const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;
    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        return NULL;
    }
    long sz = ftell(f);
    if (sz <= 0 || sz > 2 * 1024 * 1024) {
        fclose(f);
        return NULL;
    }
    rewind(f);
    char *buf = (char *)malloc((size_t)sz + 1);
    if (!buf) {
        fclose(f);
        return NULL;
    }
    size_t n = fread(buf, 1, (size_t)sz, f);
    buf[n] = '\0';
    fclose(f);
    return buf;
}

static bool table_exists(sqlite3 *db, const char *table_name) {
    const char *sql = "SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1;";
    sqlite3_stmt *stmt = NULL;
    bool exists = false;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, table_name, -1, SQLITE_TRANSIENT);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            exists = true;
        }
        sqlite3_finalize(stmt);
    }
    return exists;
}

bool db_init(sqlite3 **db_out, const char *db_path, const char *schema_path) {
    if (!db_out || !db_path) return false;
    sqlite3 *db = NULL;
    if (sqlite3_open(db_path, &db) != SQLITE_OK) {
        fprintf(stderr, "[DB] Failed to open %s: %s\n", db_path, db ? sqlite3_errmsg(db) : "unknown");
        if (db) sqlite3_close(db);
        return false;
    }

    char *errmsg = NULL;
    if (sqlite3_exec(db, "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
                     NULL, NULL, &errmsg) != SQLITE_OK) {
        fprintf(stderr, "[DB] PRAGMA failed: %s\n", errmsg ? errmsg : "unknown");
        sqlite3_free(errmsg);
        sqlite3_close(db);
        return false;
    }

    /* Apply schema only if database has not been initialized yet (never wipe existing data) */
    if (!table_exists(db, "users")) {
        char *schema_sql = NULL;
        if (schema_path) {
            schema_sql = read_entire_file(schema_path);
        }
        if (!schema_sql) {
            schema_sql = read_entire_file("database/schema.sql");
        }
        if (!schema_sql) {
            schema_sql = read_entire_file("../database/schema.sql");
        }
        if (!schema_sql) {
            fprintf(stderr, "[DB] Could not locate database/schema.sql\n");
            sqlite3_close(db);
            return false;
        }
        if (sqlite3_exec(db, schema_sql, NULL, NULL, &errmsg) != SQLITE_OK) {
            fprintf(stderr, "[DB] Schema migration failed: %s\n", errmsg ? errmsg : "unknown");
            sqlite3_free(errmsg);
            free(schema_sql);
            sqlite3_close(db);
            return false;
        }
        free(schema_sql);
        printf("[DB] Initialized schema in %s\n", db_path);
    }

    *db_out = db;
    return true;
}

void db_refresh_overdue_bills(sqlite3 *db) {
    char today[16];
    current_date_utc(today, sizeof(today));
    const char *sql =
        "UPDATE bills SET status = 'overdue' "
        "WHERE status = 'unpaid' AND due_date < ?;";
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, today, -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
}

typedef struct {
    const char *name;
    const char *email;
    const char *phone;
    const char *address;
} seed_customer_t;

typedef struct {
    int customer_idx;
    const char *meter_number;
    const char *install_date;
    const char *meter_status;
    int tariff_idx; /* 0 = Standard Flat, 1 = Progressive Slab, 2 = Commercial Tier */
    int64_t base_reading;
    int64_t usage[6]; /* 2026-06, 2026-07, 2026-08, 2026-09, 2026-10, 2026-11 */
} seed_meter_t;

static void ensure_admin_exists(sqlite3 *db) {
    int admin_count = 0;
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM users WHERE role = 'admin';", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) admin_count = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
    }
    if (admin_count > 0) return;

    const char *env_email = getenv("AQUABILL_ADMIN_EMAIL");
    const char *env_pass = getenv("AQUABILL_ADMIN_PASSWORD");
    const char *env_name = getenv("AQUABILL_ADMIN_NAME");
    const char *app_env = getenv("AQUABILL_ENV");

    if (app_env && strcmp(app_env, "production") == 0 && (!env_email || !env_pass || strlen(env_pass) < 8)) {
        fprintf(stderr, "[DB] Production mode requires AQUABILL_ADMIN_EMAIL and AQUABILL_ADMIN_PASSWORD (>= 8 chars) to create initial admin.\n");
        return;
    }

    const char *admin_email = (env_email && env_email[0]) ? env_email : "admin@aquabill.local";
    const char *admin_pass = (env_pass && env_pass[0]) ? env_pass : "Admin@1234";
    const char *admin_name = (env_name && env_name[0]) ? env_name : "Vikramaditya Rao";

    char admin_hash[PASSWORD_HASH_BUFSZ];
    if (!crypto_hash_password(admin_pass, admin_hash, sizeof(admin_hash))) return;

    if (sqlite3_prepare_v2(db,
            "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'active');",
            -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, admin_name, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, admin_email, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, admin_hash, -1, SQLITE_TRANSIENT);
        if (sqlite3_step(stmt) == SQLITE_DONE) {
            int64_t aid = sqlite3_last_insert_rowid(db);
            log_audit(db, aid, "ADMIN_SEED", "user", aid, "Administrator account provisioned.");
            printf("[DB] Provisioned administrator account (%s).\n", admin_email);
        }
        sqlite3_finalize(stmt);
    }
}

bool db_seed_if_empty(sqlite3 *db) {
    if (!db) return false;
    int user_count = 0;
    sqlite3_stmt *cnt_stmt = NULL;
    if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM users;", -1, &cnt_stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(cnt_stmt) == SQLITE_ROW) {
            user_count = sqlite3_column_int(cnt_stmt, 0);
        }
        sqlite3_finalize(cnt_stmt);
    }
    if (user_count > 0) {
        ensure_admin_exists(db);
        db_refresh_overdue_bills(db);
        return true;
    }

    const char *env_email = getenv("AQUABILL_ADMIN_EMAIL");
    const char *env_pass = getenv("AQUABILL_ADMIN_PASSWORD");
    const char *env_name = getenv("AQUABILL_ADMIN_NAME");
    const char *admin_email = (env_email && env_email[0]) ? env_email : "admin@aquabill.local";
    const char *admin_pass = (env_pass && env_pass[0]) ? env_pass : "Admin@1234";
    const char *admin_name = (env_name && env_name[0]) ? env_name : "Vikramaditya Rao";

    char admin_hash[PASSWORD_HASH_BUFSZ];
    char cust_hash[PASSWORD_HASH_BUFSZ];
    if (!crypto_hash_password(admin_pass, admin_hash, sizeof(admin_hash)) ||
        !crypto_hash_password("Customer@1234", cust_hash, sizeof(cust_hash))) {
        fprintf(stderr, "[DB] Password hashing failed during seed\n");
        return false;
    }

    char *errmsg = NULL;
    if (sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION;", NULL, NULL, &errmsg) != SQLITE_OK) {
        fprintf(stderr, "[DB] Seed transaction begin failed: %s\n", errmsg ? errmsg : "unknown");
        sqlite3_free(errmsg);
        return false;
    }

    /* 1. Seed 4 Realistic Tariff Plans */
    const char *tariff_sql =
        "INSERT INTO tariffs (name, billing_mode, rate_per_kl, fixed_charge, tax_percentage, slab_config, effective_from, status) VALUES "
        "('Standard Domestic Flat', 'flat', 1000, 5000, 0, '', '2026-01-01', 'active'), "
        "('Progressive Domestic Slab (Academic Standard)', 'slab', 1000, 5000, 500, '0-10:500,11-20:800,21-30:1200,31+:1500', '2026-01-01', 'inactive'), "
        "('Commercial & Hostel Utility Tier', 'flat', 1800, 15000, 500, '', '2026-01-01', 'inactive'), "
        "('Municipal Conservation Rebate Slab', 'slab', 900, 4000, 0, '0-15:400,16-30:900,31+:1800', '2026-01-01', 'inactive');";
    if (sqlite3_exec(db, tariff_sql, NULL, NULL, &errmsg) != SQLITE_OK) {
        fprintf(stderr, "[DB] Tariff seed failed: %s\n", errmsg ? errmsg : "unknown");
        sqlite3_free(errmsg);
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        return false;
    }

    tariff_rule_t tariff_rules[3] = {
        { .mode = TARIFF_MODE_FLAT, .rate_per_kl_paise = 1000, .fixed_charge_paise = 5000,  .tax_bps = 0,   .slab_config = "" },
        { .mode = TARIFF_MODE_SLAB, .rate_per_kl_paise = 1000, .fixed_charge_paise = 5000,  .tax_bps = 500, .slab_config = "0-10:500,11-20:800,21-30:1200,31+:1500" },
        { .mode = TARIFF_MODE_FLAT, .rate_per_kl_paise = 1800, .fixed_charge_paise = 15000, .tax_bps = 500, .slab_config = "" }
    };

    /* 2. Seed Admin */
    sqlite3_stmt *u_stmt = NULL;
    sqlite3_prepare_v2(db, "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'active');",
                       -1, &u_stmt, NULL);
    sqlite3_bind_text(u_stmt, 1, admin_name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(u_stmt, 2, admin_email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(u_stmt, 3, admin_hash, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(u_stmt, 4, "admin", -1, SQLITE_STATIC);
    if (sqlite3_step(u_stmt) != SQLITE_DONE) {
        sqlite3_finalize(u_stmt);
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        return false;
    }
    int64_t admin_user_id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(u_stmt);

    /* 3. Seed 16 Diverse Customers (Residential, Faculty, Hostel, Commercial, Housing Society) */
    static const seed_customer_t cust_seeds[16] = {
        {"Aarav Sharma",              "aarav.sharma@aquabill.local",       "+91-98201-44101", "104 Sapphire Heights, Sector 14, Navi Mumbai"},
        {"Priya Patel",               "priya.patel@aquabill.local",        "+91-98201-44102", "22B Greenview Residency, Satellite Rd, Ahmedabad"},
        {"Rohan Verma",               "rohan.verma@aquabill.local",        "+91-98201-44103", "19 Lakefront Enclave, Indiranagar, Bengaluru"},
        {"Ananya Iyer",               "ananya.iyer@aquabill.local",        "+91-98201-44104", "77 Marina Crest, Adyar, Chennai"},
        {"Kabir Mehta",               "kabir.mehta@aquabill.local",        "+91-98201-44105", "8B Crestwood Villa, Koregaon Park, Pune"},
        {"Sneha Nair",                "sneha.nair@aquabill.local",         "+91-98201-44106", "45 Backwater Gardens, Panampilly Nagar, Kochi"},
        {"Arjun Kulkarni",            "arjun.kulkarni@aquabill.local",     "+91-98201-44107", "302 Silver Oak Residency, Shivajinagar, Pune"},
        {"Meera Krishnan",            "meera.krishnan@aquabill.local",     "+91-98201-44108", "12 Banyan Courtyard, Jubilee Hills, Hyderabad"},
        {"Devansh Joshi",             "devansh.joshi@aquabill.local",      "+91-98201-44109", "61 Heritage Square, Civil Lines, Jaipur"},
        {"Ishita Chatterjee",         "ishita.chatterjee@aquabill.local",  "+91-98201-44110", "88 Riverbend Towers, Salt Lake Sector V, Kolkata"},
        {"Siddharth Malhotra",        "siddharth.m@aquabill.local",        "+91-98201-44111", "14 Pinecrest Avenue, Vasant Kunj, New Delhi"},
        {"Nandini Deshmukh",          "nandini.d@aquabill.local",          "+91-98201-44112", "509 Lotus Promenade, Baner, Pune"},
        {"Prof. Rajeshwari Deshpande","rajeshwari.faculty@aquabill.local", "+91-98220-55113", "Faculty Quarters Block B-12, Engineering Campus, Pune"},
        {"Engineering Hostel Wing A", "hostel.winga@aquabill.local",       "+91-98220-55114", "North Campus Student Hostel Complex, Pune"},
        {"GreenLeaf Campus Cafe",     "greenleaf.cafe@aquabill.local",     "+91-98220-55115", "Student Activity Center, Ground Floor, Campus Rd, Pune"},
        {"Sunrise Co-op Housing Society","sunrise.society@aquabill.local", "+91-98220-55116", "Plot 18, Wakad Ring Road, Pune"}
    };

    int64_t cust_user_ids[16];
    int64_t cust_ids[16];

    for (int i = 0; i < 16; i++) {
        const seed_customer_t *s = &cust_seeds[i];
        sqlite3_stmt *stmt = NULL;

        sqlite3_prepare_v2(db, "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'customer', 'active');",
                           -1, &stmt, NULL);
        sqlite3_bind_text(stmt, 1, s->name, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 2, s->email, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 3, cust_hash, -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        cust_user_ids[i] = sqlite3_last_insert_rowid(db);
        sqlite3_finalize(stmt);

        sqlite3_prepare_v2(db, "INSERT INTO customers (user_id, phone, address) VALUES (?, ?, ?);",
                           -1, &stmt, NULL);
        sqlite3_bind_int64(stmt, 1, cust_user_ids[i]);
        sqlite3_bind_text(stmt, 2, s->phone, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 3, s->address, -1, SQLITE_STATIC);
        sqlite3_step(stmt);
        cust_ids[i] = sqlite3_last_insert_rowid(db);
        sqlite3_finalize(stmt);
    }

    /* 4. Seed 18 Water Meters (including multi-meter connections for Hostel & Housing Society) */
    static const seed_meter_t meter_seeds[18] = {
        { 0, "AQB-MTR-1001",  "2025-03-15", "active",      0, 956,  {21, 23, 22, 24, 21, 25} },
        { 1, "AQB-MTR-1002",  "2025-04-02", "active",      0, 804,  {17, 19, 18, 19, 22, 20} },
        { 2, "AQB-MTR-1003",  "2025-05-10", "active",      0, 1360, {28, 32, 31, 29, 34, 32} },
        { 3, "AQB-MTR-1004",  "2025-06-18", "active",      0, 582,  {14, 14, 14, 15, 16, 15} },
        { 4, "AQB-MTR-1005",  "2025-07-04", "active",      0, 2098, {25, 27, 27, 25, 28, 26} },
        { 5, "AQB-MTR-1006",  "2025-07-22", "active",      0, 898,  {15, 17, 16, 17, 15, 18} },
        { 6, "AQB-MTR-1007",  "2025-08-11", "active",      0, 1238, {20, 22, 20, 23, 24, 22} },
        { 7, "AQB-MTR-1008",  "2025-09-01", "active",      0, 1672, {33, 35, 35, 38, 33, 36} },
        { 8, "AQB-MTR-1009",  "2025-09-19", "active",      0, 496,  {12, 12, 12, 13, 14, 15} },
        { 9, "AQB-MTR-1010",  "2025-10-05", "active",      0, 1068, {18, 19, 19, 21, 20, 23} },
        {10, "AQB-MTR-1011",  "2025-11-12", "maintenance", 0, 730,  {14, 16, 15, 16, 14,  0} },
        {11, "AQB-MTR-1012",  "2025-12-01", "inactive",    0, 380,  {10, 10, 10, 11,  0,  0} },
        {12, "AQB-MTR-1013",  "2025-12-15", "active",      1, 640,  {18, 20, 19, 21, 22, 20} },
        {13, "AQB-MTR-1014A", "2026-01-08", "active",      2, 4120, {88, 94, 92, 98, 102, 96} },
        {13, "AQB-MTR-1014B", "2026-01-08", "active",      2, 1850, {46, 50, 48, 52, 54, 49} },
        {14, "AQB-MTR-1015",  "2026-01-20", "active",      2, 2300, {38, 42, 40, 44, 46, 43} },
        {15, "AQB-MTR-1016A", "2026-02-05", "active",      1, 3100, {62, 66, 64, 68, 72, 69} },
        {15, "AQB-MTR-1016B", "2026-02-05", "active",      1, 2940, {58, 60, 59, 63, 65, 61} }
    };

    const char *periods[6]    = {"2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"};
    const char *read_dates[6] = {"2026-06-28", "2026-07-28", "2026-08-28", "2026-09-28", "2026-10-28", "2026-11-10"};
    const char *due_dates[6]  = {"2026-07-12", "2026-08-12", "2026-09-12", "2026-10-12", "2026-11-08", "2026-11-25"};
    const char *methods[3]    = {"UPI", "Bank Transfer", "Cash"};

    int bill_seq = 1;
    int pay_seq = 1;
    int64_t sample_cancelled_bill_id = 0;

    for (int m = 0; m < 18; m++) {
        const seed_meter_t *ms = &meter_seeds[m];
        int ci = ms->customer_idx;
        int64_t customer_id = cust_ids[ci];
        int64_t user_id = cust_user_ids[ci];
        int64_t tariff_id = (int64_t)(ms->tariff_idx + 1);
        const tariff_rule_t *rule = &tariff_rules[ms->tariff_idx];

        sqlite3_stmt *stmt = NULL;
        sqlite3_prepare_v2(db, "INSERT INTO meters (customer_id, meter_number, installation_date, status) VALUES (?, ?, ?, ?);",
                           -1, &stmt, NULL);
        sqlite3_bind_int64(stmt, 1, customer_id);
        sqlite3_bind_text(stmt, 2, ms->meter_number, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 3, ms->install_date, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 4, ms->meter_status, -1, SQLITE_STATIC);
        sqlite3_step(stmt);
        int64_t meter_id = sqlite3_last_insert_rowid(db);
        sqlite3_finalize(stmt);

        int64_t prev_val = ms->base_reading;

        for (int p = 0; p < 6; p++) {
            /* Inactive/maintenance meters stop recording after earlier cycles */
            if (strcmp(ms->meter_status, "inactive") == 0 && p >= 4) continue;
            if (strcmp(ms->meter_status, "maintenance") == 0 && p >= 5) continue;

            int64_t cur_val = prev_val + ms->usage[p];
            int64_t cons = cur_val - prev_val;

            sqlite3_prepare_v2(db,
                "INSERT INTO readings (meter_id, previous_reading, current_reading, consumption, billing_period, reading_date) "
                "VALUES (?, ?, ?, ?, ?, ?);", -1, &stmt, NULL);
            sqlite3_bind_int64(stmt, 1, meter_id);
            sqlite3_bind_int64(stmt, 2, prev_val);
            sqlite3_bind_int64(stmt, 3, cur_val);
            sqlite3_bind_int64(stmt, 4, cons);
            sqlite3_bind_text(stmt, 5, periods[p], -1, SQLITE_STATIC);
            sqlite3_bind_text(stmt, 6, read_dates[p], -1, SQLITE_STATIC);
            sqlite3_step(stmt);
            int64_t reading_id = sqlite3_last_insert_rowid(db);
            sqlite3_finalize(stmt);

            /* Leave 2026-11 unbilled for 3 meters (indices 8, 9, 16) for live Bill Generation & C Preview demo */
            bool skip_bill = (p == 5 && (m == 8 || m == 9 || m == 16));
            if (!skip_bill) {
                bill_calc_result_t calc;
                billing_calculate(prev_val, cur_val, rule, &calc);

                /* Seed one cancelled historical draft before re-issuing on meter 10 (Siddharth) in 2026-09 */
                if (m == 10 && p == 3) {
                    char canc_num[48];
                    snprintf(canc_num, sizeof(canc_num), "AQB-%c%c%c%c%c%c-%04d",
                             periods[p][0], periods[p][1], periods[p][2], periods[p][3],
                             periods[p][5], periods[p][6], bill_seq++);
                    sqlite3_prepare_v2(db,
                        "INSERT INTO bills (bill_number, customer_id, reading_id, tariff_id, billing_period, "
                        "water_charge, service_charge, tax_amount, total_amount, paid_amount, due_date, status, cancel_reason) "
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'cancelled', 'Meter calibration drift adjusted prior to re-billing');",
                        -1, &stmt, NULL);
                    sqlite3_bind_text(stmt, 1, canc_num, -1, SQLITE_TRANSIENT);
                    sqlite3_bind_int64(stmt, 2, customer_id);
                    sqlite3_bind_int64(stmt, 3, reading_id);
                    sqlite3_bind_int64(stmt, 4, tariff_id);
                    sqlite3_bind_text(stmt, 5, periods[p], -1, SQLITE_STATIC);
                    sqlite3_bind_int64(stmt, 6, calc.water_charge_paise + 2000);
                    sqlite3_bind_int64(stmt, 7, calc.service_charge_paise);
                    sqlite3_bind_int64(stmt, 8, calc.tax_amount_paise);
                    sqlite3_bind_int64(stmt, 9, calc.total_amount_paise + 2000);
                    sqlite3_bind_text(stmt, 10, due_dates[p], -1, SQLITE_STATIC);
                    sqlite3_step(stmt);
                    sample_cancelled_bill_id = sqlite3_last_insert_rowid(db);
                    sqlite3_finalize(stmt);
                }

                char bill_num[48];
                snprintf(bill_num, sizeof(bill_num), "AQB-%c%c%c%c%c%c-%04d",
                         periods[p][0], periods[p][1], periods[p][2], periods[p][3],
                         periods[p][5], periods[p][6], bill_seq++);

                const char *bill_status = "unpaid";
                int64_t paid_amt = 0;
                if (p <= 3) {
                    /* 2026-06 through 2026-09 settled */
                    bill_status = "paid";
                    paid_amt = calc.total_amount_paise;
                } else if (p == 4) {
                    /* 2026-10: mix of paid, partial, and overdue */
                    if (m % 3 == 0 || m == 12 || m == 13) {
                        bill_status = "paid";
                        paid_amt = calc.total_amount_paise;
                    } else if (m % 3 == 1 || m == 15) {
                        bill_status = "partial";
                        paid_amt = calc.total_amount_paise / 2;
                    } else {
                        bill_status = "overdue";
                        paid_amt = 0;
                    }
                } else {
                    /* 2026-11: current billing cycle */
                    if (m == 1 || m == 3 || m == 12 || m == 17) {
                        bill_status = "paid";
                        paid_amt = calc.total_amount_paise;
                    } else {
                        bill_status = "unpaid";
                        paid_amt = 0;
                    }
                }

                sqlite3_prepare_v2(db,
                    "INSERT INTO bills (bill_number, customer_id, reading_id, tariff_id, billing_period, "
                    "water_charge, service_charge, tax_amount, total_amount, paid_amount, due_date, status) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", -1, &stmt, NULL);
                sqlite3_bind_text(stmt, 1, bill_num, -1, SQLITE_TRANSIENT);
                sqlite3_bind_int64(stmt, 2, customer_id);
                sqlite3_bind_int64(stmt, 3, reading_id);
                sqlite3_bind_int64(stmt, 4, tariff_id);
                sqlite3_bind_text(stmt, 5, periods[p], -1, SQLITE_STATIC);
                sqlite3_bind_int64(stmt, 6, calc.water_charge_paise);
                sqlite3_bind_int64(stmt, 7, calc.service_charge_paise);
                sqlite3_bind_int64(stmt, 8, calc.tax_amount_paise);
                sqlite3_bind_int64(stmt, 9, calc.total_amount_paise);
                sqlite3_bind_int64(stmt, 10, paid_amt);
                sqlite3_bind_text(stmt, 11, due_dates[p], -1, SQLITE_STATIC);
                sqlite3_bind_text(stmt, 12, bill_status, -1, SQLITE_STATIC);
                sqlite3_step(stmt);
                int64_t bill_id = sqlite3_last_insert_rowid(db);
                sqlite3_finalize(stmt);

                /* Seed one failed UPI attempt on Kabir's (m=4) 2026-09 bill before successful retry */
                if (m == 4 && p == 3) {
                    sqlite3_prepare_v2(db,
                        "INSERT INTO payments (bill_id, transaction_reference, amount, payment_method, status, notes) "
                        "VALUES (?, 'TXN-AQB-FAIL01', ?, 'UPI', 'failed', 'UPI gateway timeout - retried by customer');",
                        -1, &stmt, NULL);
                    sqlite3_bind_int64(stmt, 1, bill_id);
                    sqlite3_bind_int64(stmt, 2, calc.total_amount_paise);
                    sqlite3_step(stmt);
                    sqlite3_finalize(stmt);
                }

                if (paid_amt > 0) {
                    char txn_ref[64];
                    snprintf(txn_ref, sizeof(txn_ref), "TXN-AQB-%06d", pay_seq++);
                    const char *pmethod = methods[(m + p) % 3];
                    const char *pnote = strcmp(pmethod, "UPI") == 0
                        ? "Settled via UPI instant utility pay"
                        : (strcmp(pmethod, "Bank Transfer") == 0
                            ? "NEFT/IMPS utility settlement"
                            : "Municipal counter cash receipt");
                    sqlite3_prepare_v2(db,
                        "INSERT INTO payments (bill_id, transaction_reference, amount, payment_method, status, notes) "
                        "VALUES (?, ?, ?, ?, 'completed', ?);",
                        -1, &stmt, NULL);
                    sqlite3_bind_int64(stmt, 1, bill_id);
                    sqlite3_bind_text(stmt, 2, txn_ref, -1, SQLITE_TRANSIENT);
                    sqlite3_bind_int64(stmt, 3, paid_amt);
                    sqlite3_bind_text(stmt, 4, pmethod, -1, SQLITE_STATIC);
                    sqlite3_bind_text(stmt, 5, pnote, -1, SQLITE_STATIC);
                    sqlite3_step(stmt);
                    sqlite3_finalize(stmt);
                }

                if (p == 5 && strcmp(bill_status, "unpaid") == 0) {
                    char msg[256];
                    snprintf(msg, sizeof(msg),
                             "New water bill %s (%s) for %s is ready (Amount: Rs %.2f, Due: %s).",
                             bill_num, ms->meter_number, periods[p], (double)calc.total_amount_paise / 100.0, due_dates[p]);
                    create_notification(db, user_id, msg, "bill_generated");
                } else if (strcmp(bill_status, "overdue") == 0) {
                    char msg[256];
                    snprintf(msg, sizeof(msg),
                             "Bill %s (%s) for %s is overdue. Please settle Rs %.2f at the earliest.",
                             bill_num, ms->meter_number, periods[p], (double)calc.total_amount_paise / 100.0);
                    create_notification(db, user_id, msg, "overdue_alert");
                }
            }

            prev_val = cur_val;
        }
    }

    /* 5. Seed Public Contact Messages */
    const char *contact_sql =
        "INSERT INTO contact_messages (name, email, subject, message) VALUES "
        "('Dr. Arvind Gokhale', 'arvind.gokhale@college.edu', 'Campus Meter Expansion', "
        " 'Requesting two additional smart sub-meters for the Mechanical Engineering Workshop block.'), "
        "('Priya Patel', 'priya.patel@aquabill.local', 'Progressive Slab Schedule Inquiry', "
        " 'Please confirm whether the 4-tier progressive domestic slab rates apply automatically next quarter.'), "
        "('Rohan Verma', 'rohan.verma@aquabill.local', 'October Invoice NEFT Reference', "
        " 'Initiated NEFT settlement for overdue October bill; kindly verify ledger update.');";
    sqlite3_exec(db, contact_sql, NULL, NULL, NULL);

    /* 6. Seed Admin Notifications & Rich Audit Logs */
    create_notification(db, admin_user_id,
                        "2026-11 billing cycle active: 3 customer meter readings pending bill generation.",
                        "due_reminder");
    create_notification(db, admin_user_id,
                        "4 October 2026 invoices are currently overdue and eligible for batch reminders.",
                        "overdue_alert");
    create_notification(db, admin_user_id,
                        "Meter AQB-MTR-1011 (Siddharth Malhotra) is flagged for scheduled calibration maintenance.",
                        "account_update");
    create_notification(db, admin_user_id,
                        "Faculty Quarters (AQB-MTR-1013) and Priya Patel settled 2026-11 bills early.",
                        "payment_received");

    log_audit(db, admin_user_id, "SYSTEM_SEED", "database", 1,
              "Initialized college faculty demo dataset: 16 customers, 18 meters, 4 tariffs, 6 months (2026-06 to 2026-11).");
    log_audit(db, admin_user_id, "TARIFF_SCHEDULE_CREATED", "tariff", 2,
              "Configured Progressive Domestic Slab (0-10:500, 11-20:800, 21-30:1200, 31+:1500) with 5% tax.");
    log_audit(db, admin_user_id, "METER_COMMISSIONED", "meter", 14,
              "Commissioned dual smart meters AQB-MTR-1014A & AQB-MTR-1014B for Engineering Hostel Wing A.");
    if (sample_cancelled_bill_id > 0) {
        log_audit(db, admin_user_id, "BILL_CANCELLED", "bill", sample_cancelled_bill_id,
                  "Cancelled pre-calibration bill; re-issued verified invoice after meter check.");
    }
    log_audit(db, admin_user_id, "METER_MAINTENANCE", "meter", 11,
              "Flagged AQB-MTR-1011 for scheduled ultrasonic flow sensor maintenance.");

    if (sqlite3_exec(db, "COMMIT;", NULL, NULL, &errmsg) != SQLITE_OK) {
        fprintf(stderr, "[DB] Seed commit failed: %s\n", errmsg ? errmsg : "unknown");
        sqlite3_free(errmsg);
        sqlite3_exec(db, "ROLLBACK;", NULL, NULL, NULL);
        return false;
    }

    db_refresh_overdue_bills(db);
    printf("[DB] Seeded college faculty demo AquaBill dataset (16 customers, 18 meters, 6 billing periods).\n");
    return true;
}

void db_close(sqlite3 *db) {
    if (db) {
        sqlite3_close(db);
    }
}
