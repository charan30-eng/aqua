#include "aquabill.h"
#include "billing.h"
#include "crypto.h"
#include "database.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int tests_run = 0;
static int tests_passed = 0;

#define ASSERT_TRUE(cond, msg) do { \
    tests_run++; \
    if (!(cond)) { \
        fprintf(stderr, "FAIL [%s:%d]: %s\n", __FILE__, __LINE__, msg); \
        exit(1); \
    } else { \
        tests_passed++; \
    } \
} while (0)

static void test_billing_engine(void) {
    printf("Running Billing Engine Unit Tests (Tests 1-3 + Slabs)...\n");

    /* Test 1: prev=1000, curr=1025, rate=1000 paise (Rs 10), fixed=5000 paise (Rs 50), tax=0% => total=30000 paise (Rs 300) */
    tariff_rule_t flat_tariff = {
        .mode = TARIFF_MODE_FLAT,
        .rate_per_kl_paise = 1000,
        .fixed_charge_paise = 5000,
        .tax_bps = 0,
        .slab_config = ""
    };
    bill_calc_result_t res;
    bill_calc_status_t st = billing_calculate(1000, 1025, &flat_tariff, &res);
    ASSERT_TRUE(st == BILL_CALC_OK, "Test 1 calculation succeeds");
    ASSERT_TRUE(res.consumption_kl == 25, "Test 1 consumption == 25 KL");
    ASSERT_TRUE(res.water_charge_paise == 25000, "Test 1 water_charge == 25000 paise (Rs 250)");
    ASSERT_TRUE(res.service_charge_paise == 5000, "Test 1 service_charge == 5000 paise (Rs 50)");
    ASSERT_TRUE(res.tax_amount_paise == 0, "Test 1 tax == 0 paise");
    ASSERT_TRUE(res.total_amount_paise == 30000, "Test 1 total == 30000 paise (Rs 300)");

    /* Test 2: Zero consumption (1000 -> 1000) */
    tariff_rule_t zero_fixed = flat_tariff;
    zero_fixed.fixed_charge_paise = 0;
    st = billing_calculate(1000, 1000, &zero_fixed, &res);
    ASSERT_TRUE(st == BILL_CALC_OK, "Test 2 zero consumption succeeds");
    ASSERT_TRUE(res.consumption_kl == 0, "Test 2 consumption == 0 KL");
    ASSERT_TRUE(res.water_charge_paise == 0, "Test 2 water_charge == 0");
    ASSERT_TRUE(res.total_amount_paise == 0, "Test 2 total == 0 when fixed_charge == 0");

    /* With standard fixed service charge Rs 50 */
    st = billing_calculate(1000, 1000, &flat_tariff, &res);
    ASSERT_TRUE(st == BILL_CALC_OK && res.total_amount_paise == 5000, "Test 2b zero usage charges only fixed fee");

    /* Test 3: Current < Previous (1000 -> 990) rejected */
    st = billing_calculate(1000, 990, &flat_tariff, &res);
    ASSERT_TRUE(st == BILL_CALC_ERR_INVALID_READING, "Test 3 current < previous rejected");

    /* Test 3b: Negative previous reading rejected */
    st = billing_calculate(-5, 10, &flat_tariff, &res);
    ASSERT_TRUE(st == BILL_CALC_ERR_INVALID_READING, "Test 3b negative reading rejected");

    /* Test 3c: Progressive Slab Billing (0-10@500, 11-20@800, 21-30@1200, 31+@1500) for 25 KL + fixed 5000 + 5% tax */
    tariff_rule_t slab_tariff = {
        .mode = TARIFF_MODE_SLAB,
        .rate_per_kl_paise = 1000,
        .fixed_charge_paise = 5000,
        .tax_bps = 500,
        .slab_config = "0-10:500,11-20:800,21-30:1200,31+:1500"
    };
    st = billing_calculate(100, 125, &slab_tariff, &res);
    /* 10*500 + 10*800 + 5*1200 = 5000 + 8000 + 6000 = 19000; + 5000 = 24000; 5% of 24000 = 1200; total = 25200 */
    ASSERT_TRUE(st == BILL_CALC_OK, "Slab tariff calculation succeeds");
    ASSERT_TRUE(res.water_charge_paise == 19000, "Slab water charge == 19000 paise");
    ASSERT_TRUE(res.tax_amount_paise == 1200, "Slab 5% tax == 1200 paise");
    ASSERT_TRUE(res.total_amount_paise == 25200, "Slab total == 25200 paise");
}

static void test_crypto(void) {
    printf("Running Password Hashing & Token Tests...\n");
    char hash[PASSWORD_HASH_BUFSZ];
    ASSERT_TRUE(crypto_hash_password("SecurePass#2026", hash, sizeof(hash)), "Password hash generation succeeds");
    ASSERT_TRUE(crypto_verify_password("SecurePass#2026", hash), "Correct password verifies");
    ASSERT_TRUE(!crypto_verify_password("WrongPassword", hash), "Incorrect password rejected");

    char tok1[65], tok2[65];
    ASSERT_TRUE(crypto_generate_token(tok1, sizeof(tok1)), "Token 1 generated");
    ASSERT_TRUE(crypto_generate_token(tok2, sizeof(tok2)), "Token 2 generated");
    ASSERT_TRUE(strcmp(tok1, tok2) != 0, "Tokens are unique CSPRNG values");
}

static void test_database_constraints_and_persistence(void) {
    printf("Running SQLite Constraints & Persistence Tests (Tests 4-6)...\n");
    const char *test_db = "/tmp/aquabill_unit_test.db";
    remove(test_db);

    sqlite3 *db = NULL;
    ASSERT_TRUE(db_init(&db, test_db, "database/schema.sql"), "Test DB initialized");
    ASSERT_TRUE(db_seed_if_empty(db), "Test DB seeded");

    /* Test 4: Invalid meter_id rejected by foreign key constraint */
    sqlite3_stmt *stmt = NULL;
    sqlite3_prepare_v2(db,
        "INSERT INTO readings (meter_id, previous_reading, current_reading, consumption, billing_period, reading_date) "
        "VALUES (999999, 100, 120, 20, '2026-12', '2026-12-01');", -1, &stmt, NULL);
    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    ASSERT_TRUE(rc != SQLITE_DONE, "Test 4 invalid meter_id rejected by FK constraint");

    /* Test 5: Duplicate reading for same (meter_id, billing_period) rejected */
    sqlite3_prepare_v2(db,
        "INSERT INTO readings (meter_id, previous_reading, current_reading, consumption, billing_period, reading_date) "
        "VALUES (1, 1092, 1110, 18, '2026-11', '2026-11-12');", -1, &stmt, NULL);
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    ASSERT_TRUE(rc == SQLITE_CONSTRAINT, "Test 5 duplicate (meter_id, billing_period) rejected");

    /* Test 6: Duplicate active bill for same reading_id rejected */
    sqlite3_prepare_v2(db,
        "INSERT INTO bills (bill_number, customer_id, reading_id, tariff_id, billing_period, "
        "water_charge, service_charge, tax_amount, total_amount, paid_amount, due_date, status) "
        "VALUES ('AQB-DUP-9999', 1, 1, 1, '2026-08', 22000, 5000, 0, 27000, 0, '2026-09-15', 'unpaid');",
        -1, &stmt, NULL);
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    ASSERT_TRUE(rc == SQLITE_CONSTRAINT, "Test 6 duplicate active bill for same reading_id rejected");

    /* Persistence across close & reopen: insert a custom contact message, reopen DB, verify preserved */
    sqlite3_exec(db,
        "INSERT INTO contact_messages (name, email, subject, message) "
        "VALUES ('Persistence Check', 'persist@example.com', 'Verify', 'Data must survive restart');",
        NULL, NULL, NULL);
    db_close(db);

    db = NULL;
    ASSERT_TRUE(db_init(&db, test_db, "database/schema.sql"), "Reopen existing DB succeeds");
    ASSERT_TRUE(db_seed_if_empty(db), "Seed check on non-empty DB is no-op");

    int found = 0;
    sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM contact_messages WHERE email='persist@example.com';", -1, &stmt, NULL);
    if (sqlite3_step(stmt) == SQLITE_ROW) found = sqlite3_column_int(stmt, 0);
    sqlite3_finalize(stmt);
    ASSERT_TRUE(found == 1, "Inserted record persisted across DB close and re-init");

    /* Admin seed check */
    int admin_count = 0;
    sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM users WHERE role='admin' AND status='active';", -1, &stmt, NULL);
    if (sqlite3_step(stmt) == SQLITE_ROW) admin_count = sqlite3_column_int(stmt, 0);
    sqlite3_finalize(stmt);
    ASSERT_TRUE(admin_count >= 1, "Active administrator account exists after seed");

    /* Existing bill immutability when tariff updates */
    int64_t orig_total = 0;
    sqlite3_prepare_v2(db, "SELECT total_amount FROM bills WHERE bill_id = 1;", -1, &stmt, NULL);
    if (sqlite3_step(stmt) == SQLITE_ROW) orig_total = sqlite3_column_int64(stmt, 0);
    sqlite3_finalize(stmt);
    ASSERT_TRUE(orig_total > 0, "Seeded bill #1 has positive stored total");

    sqlite3_exec(db, "UPDATE tariffs SET rate_per_kl = 2500 WHERE tariff_id = 1;", NULL, NULL, NULL);

    int64_t after_total = 0;
    sqlite3_prepare_v2(db, "SELECT total_amount FROM bills WHERE bill_id = 1;", -1, &stmt, NULL);
    if (sqlite3_step(stmt) == SQLITE_ROW) after_total = sqlite3_column_int64(stmt, 0);
    sqlite3_finalize(stmt);
    ASSERT_TRUE(after_total == orig_total, "Existing historical bill total remains immutable after tariff rate update");

    db_close(db);
    remove(test_db);
}

int main(void) {
    test_billing_engine();
    test_crypto();
    test_database_constraints_and_persistence();
    printf("ALL C UNIT & DB TESTS PASSED: %d / %d assertions.\n", tests_passed, tests_run);
    return 0;
}
