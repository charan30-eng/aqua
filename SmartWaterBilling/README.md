# Smart Water Consumption Monitoring and Billing Simulator Using C

An Academic and Municipal Software Simulation Project  
Language Standard: **C11 (ISO/IEC 9899:2011)**  
Compiler: **GCC (GNU Compiler Collection)**  
Platform: **Windows (MinGW/Dev-C++/Code::Blocks/VS Code), Linux, macOS**

---

## 1. Project Introduction
Rapid urbanisation and population growth have placed immense pressure on municipal freshwater supply systems. Conventional analog water meters require manual physical visits, leading to billing delays, transcription errors, undetected household leaks, and lack of real-time awareness for consumers. 

**Smart Water Consumption Monitoring and Billing Simulator** is an educational, console-based software system engineered in standard C. It simulates how an automated municipal water telemetry system tracks consumption, implements progressive conservation-oriented slab tariffs, generates professional consumer bills, detects anomalous surges (simulated leaks), and provides payment ledger tracking.

---

## 2. Problem Statement
Traditional utility water management faces multiple vulnerabilities:
- **Manual Meter Reading Inefficiencies:** Labor-intensive physical meter rounds result in late and erroneous billing cycles.
- **Flat-Rate Waste Inequity:** Without progressive slab tariffs, heavy consumers are not penalised, discouraging water conservation.
- **Undetected Underground & Fixture Leaks:** Continuous pipe leaks go unnoticed for weeks until astronomical bills arrive or water is irreparably lost.
- **Lack of Historic Analytical Visibility:** Consumers cannot inspect their month-over-month consumption trends or identify peak usage patterns.

---

## 3. Objectives
1. **Automate Meter Data Capture:** Compute water consumption in both Kilolitres (KL) and Litres from current and previous meter readings without physical IoT hardware.
2. **Implement Progressive Slab Tariffs:** Discourage excessive water usage through multi-tiered rates (0–10 KL @ ₹5, 11–20 KL @ ₹8, 21–30 KL @ ₹12, >30 KL @ ₹15) plus service charges.
3. **Generate Audit-Ready Bills:** Print itemised breakdown invoices with slab calculation units, charges, and status.
4. **Simulate Heuristic Leak Detection:** Alert consumers when current consumption exceeds 30 KL threshold or spikes abnormally.
5. **Demonstrate Robust Modular C Engineering:** Adhere strictly to C11 principles: separation of concerns, header files, struct representations, safe pointer manipulation, and persistent disk file handling.

---

## 4. Existing System vs. Proposed System

| Parameter | Existing Conventional System | Proposed Smart C Simulator |
|---|---|---|
| **Reading Method** | Physical door-to-door human inspection | Automated input validation & delta compute |
| **Tariff Model** | Fixed flat charge or static rate | Progressive multi-slab conservation tariff |
| **Data Persistence** | Physical paper registers or disconnected sheets | Structured delimited text files (`data/*.txt`) |
| **Leakage Detection** | None until post-facto billing complaint | Heuristic anomaly & surge detection alert |
| **Analytics** | No historical trend insights | Month-over-month ASCII bar charts & peak analysis |
| **Payment Status** | Manual receipt stamping | Electronic simulation ledger with receipt IDs |

---

## 5. System Requirements

### Hardware Requirements
- **Processor:** x86/x64 or ARM processor (1.0 GHz or higher)
- **RAM:** 512 MB minimum (application footprint is < 10 MB)
- **Disk Storage:** 50 MB available space for binaries and text logs
- **Display:** Standard 80x25 character terminal or any modern command prompt

### Software Requirements
- **Operating System:** Windows 7 / 10 / 11, Linux (Ubuntu, Fedora, Debian), macOS
- **Compiler:** GCC (GNU Compiler Collection) 5.0 or later with C11 standard support
- **Build Tools:** GNU Make (optional)
- **Recommended IDEs:** Visual Studio Code, Code::Blocks, Dev-C++, CLion

---

## 6. Modular Architecture & File Structure

```
SmartWaterBilling/
├── main.c              # Application entry point & interactive menu loop
├── consumer.h          # Consumer structure definitions and prototypes
├── consumer.c          # Module 1: Household registration, search, validation
├── monitoring.h        # WaterRecord structure definitions
├── monitoring.c        # Module 2: Meter reading calculations and logging
├── billing.h           # TariffConfig and Bill structures
├── billing.c           # Module 3 & 4: Progressive slab billing & invoice generator
├── analytics.h         # Analytics prototypes
├── analytics.c         # Module 5 & 6: Historical trends, ASCII charts, leakage engine
├── payment.h           # Payment structure
├── payment.c           # Module 7: Unpaid bills ledger and receipt settlement
├── file_manager.h      # File system definitions & safe input helper prototypes
├── file_manager.c      # Safe delimited text read/write and string helpers
├── Makefile            # Automated multi-platform compilation script
└── data/
    ├── consumers.txt       # Consumer records (ID, name, address, phone, date)
    ├── water_records.txt   # Monthly meter readings and volume in KL/L
    ├── bills.txt           # Generated bills with detailed slab breakdown
    └── payments.txt        # Payment transaction logs and simulated receipts
```

---

## 7. Mathematical Model & Tariff Calculation

### Consumption Delta Formula
$$\text{Water Consumption (KL)} = \text{Current Reading (KL)} - \text{Previous Reading (KL)}$$
$$\text{Water Consumption (Litres)} = \text{Consumption (KL)} \times 1000$$

### Progressive Slab Billing Model
A tiered tariff structure charges progressive portions of consumption at graduated unit prices:

| Slab | Consumption Range | Rate per KL | Formula for units $U$ in range |
|---|---|---|---|
| **Slab 1** | $0 \le U \le 10$ KL | ₹ 5.00 | $U_1 = \min(U, 10)$ |
| **Slab 2** | $10 < U \le 20$ KL | ₹ 8.00 | $U_2 = \min(\max(U - 10, 0), 10)$ |
| **Slab 3** | $20 < U \le 30$ KL | ₹ 12.00 | $U_3 = \min(\max(U - 20, 0), 10)$ |
| **Slab 4** | $U > 30$ KL | ₹ 15.00 | $U_4 = \max(U - 30, 0)$ |

$$\text{Base Water Charges} = (U_1 \times 5) + (U_2 \times 8) + (U_3 \times 12) + (U_4 \times 15)$$
$$\text{Total Bill Amount} = \text{Base Water Charges} + \text{Fixed Service Charge (₹50)}$$

#### Example Calculation (38 KL Consumption)
1. **Slab 1 (10 KL):** $10 \times 5 = ₹50.00$
2. **Slab 2 (10 KL):** $10 \times 8 = ₹80.00$
3. **Slab 3 (10 KL):** $10 \times 12 = ₹120.00$
4. **Slab 4 (8 KL):** $8 \times 15 = ₹120.00$
- **Base Charges:** $50 + 80 + 120 + 120 = ₹370.00$
- **Service Charge:** $₹50.00$
- **Total Payable:** $₹420.00$

---

## 8. System Flowchart (ASCII Representation)

```
        +-----------------------------------+
        |            START MAIN             |
        +-----------------------------------+
                          |
        +-----------------------------------+
        | initializeDataDirectories()       |
        +-----------------------------------+
                          |
             +------------+------------+
             |                         |
             v                         |
    +-------------------+              |
    | DISPLAY MAIN MENU | <------------+
    +-------------------+              |
             |                         |
             v                         |
    +-------------------+              |
    | Get User Choice   |              |
    +-------------------+              |
             |                         |
    +--------+--------+--------+       |
    | (1-9)           | (10)   | (Err) |
    v                 v        v       |
 [Execute Module]   [Exit]  [Prompt]   |
    |                 |        |       |
    +-----------------+--------+-------+
```

---

## 9. Important C Functions Explained for Beginners

- `int getValidatedPositiveDouble(const char *prompt, double *out)`:  
  Uses `fgets()` instead of `scanf()` to prevent infinite loops from invalid character input. Parses numbers using `strtod()` and verifies that consumption is strictly non-negative.
- `int computeBillForUnits(double consumptionKL, const TariffConfig *tariff, Bill *outBill)`:  
  Calculates progressive charges block by block using bounds clipping.
- `int appendLineToFile(const char *filename, const char *line)`:  
  Appends serialized records using pipe `|` delimiters, allowing addresses with spaces without string truncation.
- `void renderAsciiBarChart(...)`:  
  Computes proportional bar lengths and prints graphical `#` bars directly to the terminal without external graphics libraries.

---

## 10. Compilation and Execution Instructions

### On Windows using GCC (MinGW / MSYS2 / VS Code Terminal)
```bash
# Navigate to the folder
cd SmartWaterBilling

# Compile all modules with GCC
gcc -Wall -Wextra -std=c11 main.c consumer.c monitoring.c billing.c analytics.c payment.c file_manager.c -o smart_water_billing.exe

# Run the program
smart_water_billing.exe
```

### On Linux / macOS
```bash
cd SmartWaterBilling
make
./smart_water_billing
```

### In Code::Blocks or Dev-C++
1. Create a **New Project** -> **Console Application (C)**.
2. Add all `.c` and `.h` files to the project tree.
3. Enable C11 in **Project Build Options** -> **Compiler Flags** (`-std=c11`).
4. Click **Build and Run (F9)**.

---

## 11. Sample Terminal Output

```
==============================================
       SMART WATER MANAGEMENT SYSTEM          
==============================================
 1. Register New Consumer
 2. View Consumer Details
 3. Monitor Water Consumption
 4. Calculate Water Bill (Tariff Simulator)
 5. Generate Monthly Bill
 6. View Consumption Analytics
 7. Check Leakage / Excess Usage Alerts
 8. Manage Payments
 9. View Billing History
 10. Exit
==============================================
Enter your choice (1-10): 5

======================================================================
                 AQUA SMART WATER BILLING INVOICE                     
======================================================================
 Bill Number     : BIL502               Bill Date   : 2024-06-30
 Consumer ID     : CON101               Status      : [UNPAID]
 Consumer Name   : Ravindra Sharma      Phone       : 9876543210
 Address         : Plot 42, Green Meadows Sector 4
 Billing Cycle   : June 2024
----------------------------------------------------------------------
 METER READING SUMMARY:
   Previous Reading      :     216.00 KL
   Current Reading       :     254.00 KL
   Total Billed Volume   :      38.00 KL  (38000 Litres)
----------------------------------------------------------------------
 PROGRESSIVE SLAB BILLING BREAKDOWN:
   Slab 1 (0  - 10 KL) @ Rs.  5.00/KL :  10.00 KL  =>  Rs.    50.00
   Slab 2 (11 - 20 KL) @ Rs.  8.00/KL :  10.00 KL  =>  Rs.    80.00
   Slab 3 (21 - 30 KL) @ Rs. 12.00/KL :  10.00 KL  =>  Rs.   120.00
   Slab 4 (>  30 KL  ) @ Rs. 15.00/KL :   8.00 KL  =>  Rs.   120.00
----------------------------------------------------------------------
   Base Water Charges                 : Rs.       370.00
   Fixed Service Charge               : Rs.        50.00
======================================================================
   TOTAL PAYABLE AMOUNT               : Rs.       420.00
======================================================================
 [!] NOTICE: Consumption exceeded 30 KL. Excess usage tariff applied.
======================================================================
```

---

## 12. Limitations & Future Enhancements

### Current Limitations
- Operates in offline terminal environment; relies on simulated readings rather than physical ultrasonic IoT flow meters.
- File system concurrency is sequential (single-process access).

### Future Enhancements
- Hardware LoRaWAN / NB-IoT telemetry gateway integration.
- Automated SMS / WhatsApp bill dispatching.
- GIS mapping for municipal valve isolation during high leakage events.

---

## 13. Conclusion
The **Smart Water Consumption Monitoring and Billing Simulator** demonstrates how structured C11 programming, algorithmic progressive billing, and clean modular software architecture solve fundamental municipal utility challenges while educating undergraduate engineering students.
