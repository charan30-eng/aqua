# AquaBill Comprehensive Test Report

All tests listed below were executed against the compiled C11 Mongoose backend (`backend/aquabill_server`), SQLite3 database (`database/aquabill.db`), and Chromium browser via `playwright-cli` on `http://localhost:3000`.

---

## 1. C Unit & SQLite Database Constraint Tests (`tests/test_aquabill.c`)
- **Command**: `./tests/test_aquabill`
- **Observed Result**: `ALL C UNIT & DB TESTS PASSED: 31 / 31 assertions.`
- **Covered Cases**:
  - **Billing Test 1 (Standard Flat Tariff)**: `prev=1000, curr=1025 @ ₹10.00/KL + ₹50.00 fixed + 0% tax` => `25 KL`, `water=25000 paise`, `service=5000 paise`, `tax=0`, `total=30000 paise (₹300.00)`. **PASS**
  - **Billing Test 2 (Zero Consumption)**: `1000 -> 1000` => `0 KL`, `water=0 paise`; `total=0` when `fixed=0` and `total=5000` when `fixed=5000`. **PASS**
  - **Billing Test 3 (Lower / Negative Reading)**: `1000 -> 990` and `-5 -> 10` => `BILL_CALC_ERR_INVALID_READING`. **PASS**
  - **Billing Test 3c (Progressive Slab Mode)**: `0-10@500, 11-20@800, 21-30@1200, 31+@1500` for `25 KL + ₹50.00 fixed + 5% tax` => `total=25200 paise (₹252.00)`. **PASS**
  - **Crypto / Auth**: PBKDF2-HMAC-SHA256 hashing, valid password verification, wrong password rejection, CSPRNG token uniqueness. **PASS**
  - **DB Test 4 (Invalid Meter FK)**: Reading insertion for non-existent `meter_id = 999999` rejected by SQLite foreign key constraint. **PASS**
  - **DB Test 5 (Duplicate Reading Period)**: Duplicate `(meter_id=1, billing_period='2026-11')` rejected with `SQLITE_CONSTRAINT`. **PASS**
  - **DB Test 6 (Duplicate Active Bill)**: Duplicate active bill for same `reading_id` rejected by partial unique index `idx_bills_active_reading`. **PASS**
  - **Persistence Across Restart**: Custom row written, DB closed, reopened with `db_init()` + `db_seed_if_empty()`, record verified intact. **PASS**

---

## 2. Live REST API & RBAC Security Tests (`http://127.0.0.1:3000/api/*`)
- **Observed Result**: `ALL LIVE API & RBAC TESTS PASSED (15/15)`
- **Verified Assertions**:
  1. `GET /api/health` -> `200 OK` (`AquaBill C/Mongoose`).
  2. `POST /api/auth/register` with `role: "admin"` -> `403 FORBIDDEN_ROLE`.
  3. `GET /api/bills` unauthenticated -> `401 UNAUTHORIZED`.
  4. Customer login (`aarav.sharma@aquabill.local`) -> `200 OK`.
  5. Customer `GET /api/customers` -> `403 FORBIDDEN`.
  6. Customer `POST /api/payments` (attempting to mark own bill paid) -> `403 FORBIDDEN`.
  7. Customer `GET /api/bills` returns strictly own bills; `GET /api/bills/5` (another customer) -> `403 FORBIDDEN`.
  8. Admin login (`admin@aquabill.local`) -> `200 OK`.
  9. `POST /api/readings` with `current < previous` -> `400 INVALID_READING`.
  10. `POST /api/readings` duplicate `(meter_id, billing_period)` -> `409 DUPLICATE_READING`.
  11. `PUT /api/bills/:id/cancel` on a `paid` bill -> `409 PAID_BILL_IMMUTABLE`.
  12. `POST /api/bills/generate` for already-billed reading -> `409 DUPLICATE_BILL`.
  13. `PUT /api/notifications/:id/read` -> `200 OK`.
  14. `GET /api/reports/monthly`, `/consumption`, `/revenue`, `/outstanding` -> `200 OK`.
  15. `POST /api/contact` -> `201 Created` (`message_id = 1`).

---

## 3. Headless Chromium E2E & Visual Verification (`playwright-cli`)
- **Desktop Viewport (`1440x900`)**:
  - Public Landing, Login page, Admin Dashboard (4 KPIs + 2 Chart.js graphs), Bill Generation (2 unbilled readings queued), Bill Management (43 bills table), Official Invoice Modal (`AQB-202609-0043`), Reports & Analytics (Doughnut + Bar charts + CSV buttons), Logout, Customer Dashboard, and Dark Mode Consumption Trend verified.
- **Mobile Viewport (`390x844`)**:
  - Customer portal dark mode inspected: `scrollWidth = 390`, `innerWidth = 390`, `overflow = false` (zero horizontal overflow).
- **Browser Console Check**:
  - `Total messages: 0 (Errors: 0, Warnings: 0)`.

---

## 4. Build & TypeScript Lint Verification
- `./build.sh` (GCC 12.3.0 `-std=c11 -O2 -Wall -Wextra`): compiled cleanly with 0 errors.
- `npm run build` (`vite build`): succeeded.
- `npm run lint` (`tsc --noEmit`): succeeded with 0 errors.
