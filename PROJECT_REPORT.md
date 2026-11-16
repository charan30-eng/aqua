# AquaBill — Academic Project Report

## 1. Executive Summary
**AquaBill (Smart Water Consumption Monitoring and Billing Management System)** is a full-stack commercial-style utility web platform developed with a **C11 REST backend** (Cesanta Mongoose HTTP server + SQLite3 relational database) and a **responsive HTML5/CSS3/Vanilla JavaScript frontend** featuring **Chart.js** analytics and **Lucide** icons.

---

## 2. Problem Statement & Objectives
Traditional manual water utility billing suffers from meter reading transcription errors, floating-point currency discrepancies, delayed invoice delivery, opaque consumption trends, and poor separation between operational staff and consumers. AquaBill addresses these issues by:
1. Automating meter reading validation (`current_reading >= previous_reading`, unique `(meter_id, billing_period)`).
2. Calculating utility bills in **fixed-point integer paise** inside the C backend (`1 INR = 100 paise`).
3. Enforcing strict **Role-Based Access Control (RBAC)** separating Administrator operations from Customer self-service.
4. Providing interactive Chart.js analytics, CSV financial exports, printable/downloadable invoices, and light/dark UI modes.

---

## 3. System Architecture
- **Presentation Layer (`frontend/`)**: Single-page responsive interface built in pure HTML5, CSS3 (custom design tokens for Light & Dark themes), and modular Vanilla JavaScript (`api.js`, `state.js`, `charts.js`, `invoice.js`, `public.js`, `admin.js`, `customer.js`, `app.js`).
- **Application & Business Logic Layer (`backend/`)**: Compiled C11 HTTP server (`aquabill_server`) embedding Cesanta Mongoose (`v7.16`) and `cJSON` (`v1.7.18`). Handles authentication, PBKDF2-HMAC-SHA256 password hashing, CSPRNG session management, RBAC guards, billing calculations, payment reconciliation, and reporting aggregations.
- **Persistence Layer (`database/`)**: SQLite3 database (`aquabill.db`) with 12 tables (`schema_migrations`, `users`, `sessions`, `customers`, `meters`, `readings`, `tariffs`, `bills`, `payments`, `notifications`, `audit_logs`, `contact_messages`), foreign key enforcement, and transactional updates.

---

## 4. Billing Calculation Methodology
All monetary values use 64-bit signed integer **paise**:
- `consumption_kl = current_reading - previous_reading`
- **Flat Mode**: `water_charge_paise = consumption_kl * rate_per_kl_paise`
- **Progressive Slab Mode**: Parses tiered bands (e.g., `0-10:500,11-20:800,21-30:1200,31+:1500`) and applies marginal rates per band.
- `tax_amount_paise = ( (water_charge_paise + service_charge_paise) * tax_bps + 5000 ) / 10000` (rounded half-up)
- `total_amount_paise = water_charge_paise + service_charge_paise + tax_amount_paise`

---

## 5. Security & Known Localhost Limitations
- **Implemented Controls**:
  - Salted PBKDF2-HMAC-SHA256 password hashing (10,000 iterations).
  - SHA-256 hashed 256-bit bearer session tokens with 24-hour expiration.
  - Strict role enforcement blocking public admin registration (`403 FORBIDDEN_ROLE`) and blocking customers from admin routes, other customers' records, or marking own bills paid (`403 FORBIDDEN`).
  - SQLite parameterized prepared statements across every query.
  - Paid bill immutability (`409 PAID_BILL_IMMUTABLE`).
- **Known Limitations (Academic/Localhost Scope)**:
  - Plain HTTP is used on localhost; production deployments should terminate TLS (HTTPS) via a reverse proxy (Nginx/Caddy).
  - Payment methods (`Cash`, `UPI`, `Bank Transfer`) are simulated settlement records without live banking/payment gateway webhooks.
  - High-consumption alerts (`>= 35 KL`) are rule-based analytical warnings rather than physical IoT pipe-sensor telemetry.
