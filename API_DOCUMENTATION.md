# AquaBill REST API Documentation

All endpoints are served directly by the compiled C11 Mongoose HTTP server (`backend/server.c`) under `/api/*`.
Protected routes require `Authorization: Bearer <token>`. Monetary amounts in JSON payloads and responses are integer **paise** (`30000` = ₹300.00).

---

## 1. Public & Health Endpoints
- `GET /api/health` — Returns server engine status and database connectivity.
- `POST /api/contact` — Saves public contact inquiry (`{ name, email, subject, message }`).

## 2. Authentication & Profile
- `POST /api/auth/register` — Public customer registration (`{ name, email, password, phone, address }`). Rejects any non-`customer` role with `403`.
- `POST /api/auth/login` — Authenticates user and returns `{ token, user }`.
- `POST /api/auth/logout` — Invalidates current bearer token in `sessions`.
- `GET /api/auth/me` — Returns authenticated user & customer profile.
- `GET /api/profile` / `PUT /api/profile` — Read or update own `name`, `phone`, `address`.
- `PUT /api/profile/password` — Verifies `current_password` and updates PBKDF2-SHA256 hash (`new_password >= 8 chars`).

## 3. Dashboard
- `GET /api/dashboard` — Role-scoped KPI summary (`admin` gets utility totals; `customer` gets strictly own meters, usage, and dues).

## 4. Customers (Admin Only)
- `GET /api/customers?search=&status=` — Lists customers with meter counts and outstanding balances.
- `POST /api/customers` — Creates customer account (+ optional initial meter).
- `GET /api/customers/:id` — Returns customer profile, meters, and recent bills.
- `PUT /api/customers/:id` — Updates name, phone, address, or account status.
- `DELETE /api/customers/:id` — Safely deactivates customer if bills exist, or deletes if unbilled.

## 5. Meters (Admin Write / Role-Scoped Read)
- `GET /api/meters?search=&status=&customer_id=` — Admin sees all; customer sees own meters.
- `POST /api/meters` — Admin assigns unique `meter_number` to `customer_id`.
- `GET /api/meters/:id` — Returns meter details + reading history (ownership checked for customers).
- `PUT /api/meters/:id` — Admin updates `meter_number`, `status` (`active|inactive|maintenance`), or `installation_date`.

## 6. Meter Readings
- `GET /api/readings?meter_id=&period=` — Admin sees all; customer sees own readings.
- `POST /api/readings` — Admin records `{ meter_id, previous_reading, current_reading, billing_period, reading_date }`. Validates active meter, `current >= previous`, unique `(meter_id, billing_period)`, and triggers high-usage alert at `>= 35 KL`.
- `GET /api/readings/:id` — Returns reading details (ownership checked for customers).

## 7. Tariffs & Bills
- `GET /api/tariffs` — Lists active and historical tariff plans.
- `POST /api/tariffs` — Admin creates `flat` or `slab` tariff (`rate_per_kl`, `fixed_charge`, `tax_percentage` in bps, `slab_config`).
- `PUT /api/tariffs/:id` — Admin edits or activates a tariff (automatically deactivates previous active tariff).
- `GET /api/bills?status=&period=&search=` — Admin sees all; customer sees strictly own bills.
- `POST /api/bills/generate` — Admin generates bill(s) for `{ reading_id }` or bulk `{ billing_period }` using `billing_calculate()`. Prevents duplicate active bills (`409`).
- `GET /api/bills/:id` — Returns full itemized invoice + verified payment list (ownership checked).
- `PUT /api/bills/:id/cancel` — Admin cancels `unpaid` or `overdue` bill with `{ reason }`. Returns `409` if bill is `paid` or `partial`.

## 8. Payments
- `GET /api/payments?bill_id=&method=&search=` — Admin sees all; customer sees strictly own receipts.
- `POST /api/payments` — **Admin only** (`403` for customers). Records `{ bill_id, amount, payment_method, transaction_reference?, notes? }` inside a transaction, enforces `0 < amount <= balance_due` and unique `transaction_reference`, and updates bill status to `partial` or `paid`.

## 9. Reports, Notifications & Audit Trail
- `GET /api/reports/monthly?from=&to=` — Admin monthly financial & consumption aggregation.
- `GET /api/reports/consumption` — Admin gets utility trend + top consumers; customer gets strictly own trend.
- `GET /api/reports/revenue` — Admin revenue breakdown by payment method and billing period.
- `GET /api/reports/outstanding` — Admin aging list of unpaid, partial, and overdue bills.
- `GET /api/notifications` — Authenticated user's notifications + `unread_count`.
- `PUT /api/notifications/:id/read` / `PUT /api/notifications/read-all` — Marks own notifications read.
- `POST /api/notifications/remind` — Admin dispatches payment reminders to unpaid/overdue customers.
- `GET /api/audit-logs` — Admin compliance & audit trail.
