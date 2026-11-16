# AquaBill – College Faculty Demo & Dataset Guide

This guide summarizes the pre-seeded sample datasets built into **AquaBill** (`C11` + Cesanta Mongoose + `SQLite3`) for demonstrating end-to-end water utility operations to college faculty.

---

## 1. Demo Login Credentials

### Administrator Console (Select **Administrator Console** on Sign In)
- **Email**: `admin@aquabill.local`
- **Password**: `Admin@1234` *(configurable via `AQUABILL_ADMIN_PASSWORD`)*

### Customer Portal Accounts (Select **Customer Portal** on Sign In; default password: `Customer@1234`)
| Account Type | Name | Email | What It Demonstrates |
| :--- | :--- | :--- | :--- |
| **Household (Standard)** | Aarav Sharma | `aarav.sharma@aquabill.local` | Single meter (`AQB-MTR-1001`), 6-month usage trend, paid history + current unpaid `2026-11` bill |
| **Multi-Meter Campus** | Engineering Hostel Wing A | `hostel.winga@aquabill.local` | **2 active meters** (`AQB-MTR-1014A` Main Supply & `AQB-MTR-1014B` Mess Block), high consumption |
| **Overdue & High Usage** | Rohan Verma | `rohan.verma@aquabill.local` | Overdue `2026-10` alert notification + unpaid `2026-11` invoice |
| **Faculty Residence** | Prof. Rajeshwari Deshpande | `rajeshwari.faculty@aquabill.local` | Progressive Domestic Slab billing with 5% tax & early settlement |
| **Multi-Meter Society** | Sunrise Co-op Housing Society | `sunrise.society@aquabill.local` | **2 meters** (`AQB-MTR-1016A` unbilled `2026-11`, `AQB-MTR-1016B` paid) + partial `2026-10` balance |
| **Commercial Connection** |GreenLeaf Campus Cafe | `greenleaf.cafe@aquabill.local` | Commercial Utility Tier pricing (`₹18/KL + ₹150 fixed + 5% tax`) |

---

## 2. Seeded Dataset Summary (6 Months: `2026-06` to `2026-11`)

- **Customers (`16`)**: 12 residential households across Indian cities + 4 campus/institutional/commercial accounts (Faculty Quarters, Engineering Hostel Wing A, GreenLeaf Campus Cafe, Sunrise Co-op Housing Society).
- **Water Meters (`18`)**:
  - `16` Active meters (including dual meters for Hostel & Housing Society)
  - `1` Maintenance meter (`AQB-MTR-1011` — Siddharth Malhotra)
  - `1` Inactive meter (`AQB-MTR-1012` — Nandini Deshmukh)
- **Tariff Schedules (`4`)**:
  1. `Standard Domestic Flat` (`flat`, ₹10.00/KL + ₹50.00 fixed, 0% tax) — *Active*
  2. `Progressive Domestic Slab (Academic Standard)` (`slab`, `0-10: ₹5`, `11-20: ₹8`, `21-30: ₹12`, `31+: ₹15` + ₹50.00 fixed, 5% tax)
  3. `Commercial & Hostel Utility Tier` (`flat`, ₹18.00/KL + ₹150.00 fixed, 5% tax)
  4. `Municipal Conservation Rebate Slab` (`slab`, `0-15: ₹4`, `16-30: ₹9`, `31+: ₹18` + ₹40.00 fixed, 0% tax)
- **Readings & Bills**:
  - **6 billing periods** (`2026-06` through `2026-11`) powering 6-month Chart.js revenue & consumption trends.
  - **All bill statuses present**: `paid`, `partial`, `overdue`, `unpaid`, and `cancelled` (calibration adjustment audit case on `AQB-MTR-1011`).
  - **3 Unbilled `2026-11` Readings** ready for live generation: `Devansh Joshi` (`AQB-MTR-1009`), `Ishita Chatterjee` (`AQB-MTR-1010`), and `Sunrise Co-op Housing Society` (`AQB-MTR-1016A`).
- **Payments, Notifications & Audit Trail**:
  - Completed settlements across **UPI**, **Bank Transfer**, and **Cash**, plus 1 `failed` UPI retry entry (`TXN-AQB-FAIL01`) to demonstrate status filtering.
  - 3 public contact messages, customer & admin notifications, and pre-seeded operational audit logs.

---

## 3. Suggested 5-Minute Faculty Demo Script

1. **Public Portal & Architecture**: Show the Home/About pages highlighting the C11 Mongoose HTTP backend + SQLite3 integer-paise storage.
2. **Administrator Dashboard**: Sign in as `admin@aquabill.local` -> point out the 6 live KPI cards, 6-month Billed vs. Collected revenue chart, consumption trend, and 4 activity feeds.
3. **Live C-Engine Bill Preview & Generation**: Open **Bill Generation**, select `Devansh Joshi (AQB-MTR-1009)` or `Sunrise Co-op Housing Society (AQB-MTR-1016A)`, switch between **Standard Domestic Flat** and **Progressive Domestic Slab (Academic Standard)**, click **Preview Calculation (C Engine)** to prove billing math runs on the C backend, then click **Generate Bill**.
4. **Payment Reconciliation & Printable Invoice**: Open **Bill Management** -> inspect `cancelled`, `overdue`, `partial`, and `unpaid` invoices -> open a printable **View Invoice** statement -> record a payment in **Payment Management** and watch KPI revenue update immediately.
5. **Reports & CSV Export**: Open **Reports & Analytics** -> review Bill Status Breakdown, Customer-Wise Billing Summary, and export a CSV report.
6. **Customer Portal & Multi-Meter View**: Log out -> sign in as `hostel.winga@aquabill.local` (2 meters) or `aarav.sharma@aquabill.local` -> show role-scoped isolation and personal consumption analytics.
