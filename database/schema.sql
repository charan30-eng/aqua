-- ============================================================================
-- AquaBill - Smart Water Consumption Monitoring and Billing Management System
-- File: database/schema.sql
-- Version: 1.0.0 (Versioned Schema Migration)
-- Engine: SQLite3 (Foreign Keys & Referential Integrity Enabled)
-- Note: All monetary values (rate_per_kl, fixed_charge, water_charge, etc.)
--       are stored in integer PAISE (1 INR = 100 paise) to avoid floating-point
--       currency rounding errors. Tax percentage is stored in basis points
--       (e.g., 500 = 5.00%, 0 = 0.00%) or scaled integers.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 0. Schema Migrations Tracking Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1. Users Table (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'customer')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Sessions Table (Persistent Token Auth with Expiration)
CREATE TABLE IF NOT EXISTS sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- 4. Meters Table
CREATE TABLE IF NOT EXISTS meters (
    meter_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    meter_number TEXT NOT NULL UNIQUE,
    installation_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance')),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meters_customer_id ON meters(customer_id);
CREATE INDEX IF NOT EXISTS idx_meters_number ON meters(meter_number);

-- 5. Readings Table
-- Enforces one reading per meter per billing_period via UNIQUE(meter_id, billing_period)
CREATE TABLE IF NOT EXISTS readings (
    reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
    meter_id INTEGER NOT NULL,
    previous_reading INTEGER NOT NULL CHECK(previous_reading >= 0),
    current_reading INTEGER NOT NULL CHECK(current_reading >= previous_reading),
    consumption INTEGER NOT NULL CHECK(consumption >= 0),
    billing_period TEXT NOT NULL,
    reading_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (meter_id) REFERENCES meters(meter_id) ON DELETE RESTRICT,
    UNIQUE(meter_id, billing_period)
);

CREATE INDEX IF NOT EXISTS idx_readings_meter_period ON readings(meter_id, billing_period);

-- 6. Tariffs Table
-- rate_per_kl_paise: integer paise per KL (e.g., 1000 = Rs 10.00/KL)
-- fixed_charge_paise: integer paise (e.g., 5000 = Rs 50.00)
-- tax_bps: basis points (e.g., 500 = 5.00%, 0 = 0%)
-- billing_mode: 'flat' (default) or 'slab' (optional progressive slabs)
CREATE TABLE IF NOT EXISTS tariffs (
    tariff_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Standard Domestic Tariff',
    billing_mode TEXT NOT NULL DEFAULT 'flat' CHECK(billing_mode IN ('flat', 'slab')),
    rate_per_kl INTEGER NOT NULL CHECK(rate_per_kl >= 0),
    fixed_charge INTEGER NOT NULL CHECK(fixed_charge >= 0),
    tax_percentage INTEGER NOT NULL DEFAULT 0 CHECK(tax_percentage >= 0 AND tax_percentage <= 10000),
    slab_config TEXT DEFAULT '',
    effective_from TEXT NOT NULL,
    effective_until TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tariffs_status ON tariffs(status);

-- 7. Bills Table
-- One reading can generate at most one active bill via UNIQUE(reading_id)
-- Wait: if an unpaid bill is cancelled, allow re-generation? Or keep status='cancelled'
-- We enforce partial unique index on reading_id WHERE status != 'cancelled'!
CREATE TABLE IF NOT EXISTS bills (
    bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    reading_id INTEGER NOT NULL,
    tariff_id INTEGER NOT NULL,
    billing_period TEXT NOT NULL,
    water_charge INTEGER NOT NULL CHECK(water_charge >= 0),
    service_charge INTEGER NOT NULL CHECK(service_charge >= 0),
    tax_amount INTEGER NOT NULL CHECK(tax_amount >= 0),
    total_amount INTEGER NOT NULL CHECK(total_amount >= 0),
    paid_amount INTEGER NOT NULL DEFAULT 0 CHECK(paid_amount >= 0),
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'partial', 'paid', 'overdue', 'cancelled')),
    cancel_reason TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    FOREIGN KEY (reading_id) REFERENCES readings(reading_id) ON DELETE RESTRICT,
    FOREIGN KEY (tariff_id) REFERENCES tariffs(tariff_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_active_reading
    ON bills(reading_id) WHERE status != 'cancelled';
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_period ON bills(billing_period);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    transaction_reference TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL CHECK(amount > 0),
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash', 'UPI', 'Bank Transfer')),
    payment_date TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'failed', 'reversed')),
    notes TEXT DEFAULT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(transaction_reference);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('bill_generated', 'due_reminder', 'payment_received', 'overdue_alert', 'account_update')),
    is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER DEFAULT NULL,
    details TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- 11. Public Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_migrations (version, description)
VALUES (1, 'Initial AquaBill relational schema with fixed-point paise monetary storage');
