# AquaBill Database Design (`database/schema.sql`)

AquaBill uses **SQLite3** with `PRAGMA foreign_keys = ON` and Write-Ahead Logging (`WAL`).
All monetary values are stored as **64-bit integer paise** (`1 INR = 100 paise`) and tax rates are stored in **basis points** (`500 = 5.00%`) so financial calculations never suffer from IEEE-754 floating-point drift.

---

## Entity-Relationship Summary

1. **`schema_migrations`** (`version PK, description, applied_at`): Tracks schema versions so restarts preserve existing data.
2. **`users`** (`user_id PK, name, email UNIQUE, password_hash, role, created_at, status`): Stores authentication credentials and RBAC role (`admin` | `customer`).
3. **`sessions`** (`session_id PK, token_hash UNIQUE, user_id FK->users, expires_at, created_at`): Stores SHA-256 hashes of CSPRNG bearer tokens with 24-hour TTL.
4. **`customers`** (`customer_id PK, user_id UNIQUE FK->users, phone, address, created_at`): 1:1 profile extension for `customer` users.
5. **`meters`** (`meter_id PK, customer_id FK->customers, meter_number UNIQUE, installation_date, status`): Tracks household water meters (`active` | `inactive` | `maintenance`).
6. **`readings`** (`reading_id PK, meter_id FK->meters, previous_reading, current_reading, consumption, billing_period, reading_date`): Enforces `CHECK(current_reading >= previous_reading)` and `UNIQUE(meter_id, billing_period)`.
7. **`tariffs`** (`tariff_id PK, name, billing_mode, rate_per_kl, fixed_charge, tax_percentage, slab_config, effective_from, effective_until, status`): Supports `flat` and `slab` billing rules with historical retention.
8. **`bills`** (`bill_id PK, bill_number UNIQUE, customer_id FK, reading_id FK, tariff_id FK, billing_period, water_charge, service_charge, tax_amount, total_amount, paid_amount, due_date, status, cancel_reason`): Uses partial unique index `idx_bills_active_reading ON bills(reading_id) WHERE status != 'cancelled'` to prevent duplicate active billing while allowing re-billing if an unpaid bill is cancelled.
9. **`payments`** (`payment_id PK, bill_id FK->bills, transaction_reference UNIQUE, amount, payment_method, payment_date, status, notes`): Records `Cash`, `UPI`, and `Bank Transfer` settlements with unique transaction references.
10. **`notifications`** (`notification_id PK, user_id FK->users, message, type, is_read, created_at`): User-scoped billing, due reminder, payment receipt, and high-usage alerts.
11. **`audit_logs`** (`log_id PK, user_id FK->users, action, entity_type, entity_id, details, created_at`): Immutable operational audit trail.
12. **`contact_messages`** (`message_id PK, name, email, subject, message, created_at`): Stores inquiries submitted from the public Contact Us page.

---

## Integrity Rules Enforced at Database Layer

- **Zero Negative Consumption**: `CHECK(previous_reading >= 0)` and `CHECK(current_reading >= previous_reading)`.
- **No Duplicate Monthly Readings**: `UNIQUE(meter_id, billing_period)`.
- **No Double-Billing on Same Reading**: Partial unique index `idx_bills_active_reading ON bills(reading_id) WHERE status != 'cancelled'`.
- **No Duplicate Payment Submission**: `transaction_reference TEXT NOT NULL UNIQUE` and `CHECK(amount > 0)`.
- **Referential Protection**: `ON DELETE RESTRICT` on `readings(meter_id)`, `bills(customer_id, reading_id, tariff_id)`, and `payments(bill_id)` so historical financial records cannot be silently orphaned.
