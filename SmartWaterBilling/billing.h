/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: billing.h
 * Description: Header file for progressive slab-based water billing calculations
 * Language: C (C11 Standard)
 * ============================================================================
 */

#ifndef BILLING_H
#define BILLING_H

#define DEFAULT_SLAB1_LIMIT  10.0   // 0 - 10 KL
#define DEFAULT_SLAB1_RATE   5.0    // ₹5 per KL
#define DEFAULT_SLAB2_LIMIT  20.0   // 11 - 20 KL
#define DEFAULT_SLAB2_RATE   8.0    // ₹8 per KL
#define DEFAULT_SLAB3_LIMIT  30.0   // 21 - 30 KL
#define DEFAULT_SLAB3_RATE   12.0   // ₹12 per KL
#define DEFAULT_SLAB4_RATE   15.0   // Above 30 KL: ₹15 per KL
#define DEFAULT_SERVICE_CHG  50.0   // ₹50 Fixed service charge

/**
 * Tariff Configuration
 */
typedef struct {
    double slab1Limit;
    double slab1Rate;
    double slab2Limit;
    double slab2Rate;
    double slab3Limit;
    double slab3Rate;
    double slab4Rate;
    double fixedServiceCharge;
    double leakageThresholdKL;      // Default 30 KL
} TariffConfig;

/**
 * Bill Structure
 */
typedef struct {
    char billID[16];                // e.g. BIL2024-001
    char consumerID[16];
    char month[16];
    int year;
    double previousReading;
    double currentReading;
    double consumptionKL;
    double consumptionLitres;
    double slab1Units;
    double slab1Amount;
    double slab2Units;
    double slab2Amount;
    double slab3Units;
    double slab3Amount;
    double slab4Units;
    double slab4Amount;
    double waterCharges;
    double serviceCharge;
    double totalAmount;
    char paymentStatus[12];         // "UNPAID" or "PAID"
    char billDate[16];
} Bill;

// Prototypes
TariffConfig getTariffConfig(void);
void calculateWaterBillInteractive(void);
void generateMonthlyBill(void);
int computeBillForUnits(double consumptionKL, const TariffConfig *tariff, Bill *outBill);
void displayBillInvoice(const Bill *b);
void displayBillingHistory(void);
int saveBillRecord(const Bill *b);
int getBillById(const char *billID, Bill *outBill);
int updateBillPaymentStatus(const char *billID, const char *newStatus);

#endif // BILLING_H
