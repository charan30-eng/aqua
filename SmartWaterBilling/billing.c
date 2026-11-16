/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: billing.c
 * Description: Module 3 & 4 - Progressive slab billing calculation & bill invoice generator
 * Language: C (C11 Standard)
 * ============================================================================
 */

#include "billing.h"
#include "consumer.h"
#include "monitoring.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

TariffConfig getTariffConfig(void) {
    TariffConfig cfg;
    cfg.slab1Limit = DEFAULT_SLAB1_LIMIT;
    cfg.slab1Rate = DEFAULT_SLAB1_RATE;
    cfg.slab2Limit = DEFAULT_SLAB2_LIMIT;
    cfg.slab2Rate = DEFAULT_SLAB2_RATE;
    cfg.slab3Limit = DEFAULT_SLAB3_LIMIT;
    cfg.slab3Rate = DEFAULT_SLAB3_RATE;
    cfg.slab4Rate = DEFAULT_SLAB4_RATE;
    cfg.fixedServiceCharge = DEFAULT_SERVICE_CHG;
    cfg.leakageThresholdKL = 30.0;
    return cfg;
}

int computeBillForUnits(double consumptionKL, const TariffConfig *tariff, Bill *outBill) {
    if (consumptionKL < 0.0) return 0;

    double remaining = consumptionKL;

    // Slab 1: 0 to 10 KL
    if (remaining > tariff->slab1Limit) {
        outBill->slab1Units = tariff->slab1Limit;
    } else {
        outBill->slab1Units = remaining;
    }
    outBill->slab1Amount = outBill->slab1Units * tariff->slab1Rate;
    remaining -= outBill->slab1Units;
    if (remaining < 0) remaining = 0;

    // Slab 2: 10 to 20 KL (span = 10 KL)
    double slab2Span = tariff->slab2Limit - tariff->slab1Limit;
    if (remaining > slab2Span) {
        outBill->slab2Units = slab2Span;
    } else {
        outBill->slab2Units = remaining;
    }
    outBill->slab2Amount = outBill->slab2Units * tariff->slab2Rate;
    remaining -= outBill->slab2Units;
    if (remaining < 0) remaining = 0;

    // Slab 3: 20 to 30 KL (span = 10 KL)
    double slab3Span = tariff->slab3Limit - tariff->slab2Limit;
    if (remaining > slab3Span) {
        outBill->slab3Units = slab3Span;
    } else {
        outBill->slab3Units = remaining;
    }
    outBill->slab3Amount = outBill->slab3Units * tariff->slab3Rate;
    remaining -= outBill->slab3Units;
    if (remaining < 0) remaining = 0;

    // Slab 4: Above 30 KL
    outBill->slab4Units = remaining;
    outBill->slab4Amount = outBill->slab4Units * tariff->slab4Rate;

    outBill->waterCharges = outBill->slab1Amount + outBill->slab2Amount + 
                            outBill->slab3Amount + outBill->slab4Amount;
    outBill->serviceCharge = tariff->fixedServiceCharge;
    outBill->totalAmount = outBill->waterCharges + outBill->serviceCharge;

    return 1;
}

static int generateNextBillId(char *destBuffer) {
    FILE *fp = fopen(FILE_BILLS, "r");
    int maxNum = 500;
    if (fp != NULL) {
        char line[512];
        while (fgets(line, sizeof(line), fp)) {
            char *id = strtok(line, "|");
            if (id != NULL && strncmp(id, "BIL", 3) == 0) {
                int num = atoi(id + 3);
                if (num > maxNum) maxNum = num;
            }
        }
        fclose(fp);
    }
    sprintf(destBuffer, "BIL%d", maxNum + 1);
    return maxNum + 1;
}

int saveBillRecord(const Bill *b) {
    char line[1024];
    snprintf(line, sizeof(line),
             "%s|%s|%s|%d|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%s|%s",
             b->billID, b->consumerID, b->month, b->year,
             b->previousReading, b->currentReading, b->consumptionKL, b->consumptionLitres,
             b->slab1Units, b->slab1Amount,
             b->slab2Units, b->slab2Amount,
             b->slab3Units, b->slab3Amount,
             b->slab4Units, b->slab4Amount,
             b->waterCharges, b->serviceCharge, b->totalAmount,
             b->paymentStatus, b->billDate);

    return appendLineToFile(FILE_BILLS, line);
}

void displayBillInvoice(const Bill *b) {
    Consumer c;
    getConsumerById(b->consumerID, &c);

    printf("\n======================================================================\n");
    printf("                 AQUA SMART WATER BILLING INVOICE                     \n");
    printf("======================================================================\n");
    printf(" Bill Number     : %-20s Bill Date   : %s\n", b->billID, b->billDate);
    printf(" Consumer ID     : %-20s Status      : [%s]\n", b->consumerID, b->paymentStatus);
    printf(" Consumer Name   : %-20s Phone       : %s\n", c.name, c.phoneNumber);
    printf(" Address         : %s\n", c.address);
    printf(" Billing Cycle   : %s %d\n", b->month, b->year);
    printf("----------------------------------------------------------------------\n");
    printf(" METER READING SUMMARY:\n");
    printf("   Previous Reading      : %10.2f KL\n", b->previousReading);
    printf("   Current Reading       : %10.2f KL\n", b->currentReading);
    printf("   Total Billed Volume   : %10.2f KL  (%.0f Litres)\n", b->consumptionKL, b->consumptionLitres);
    printf("----------------------------------------------------------------------\n");
    printf(" PROGRESSIVE SLAB BILLING BREAKDOWN:\n");
    printf("   Slab 1 (0  - 10 KL) @ Rs.  5.00/KL : %6.2f KL  =>  Rs. %8.2f\n", b->slab1Units, b->slab1Amount);
    printf("   Slab 2 (11 - 20 KL) @ Rs.  8.00/KL : %6.2f KL  =>  Rs. %8.2f\n", b->slab2Units, b->slab2Amount);
    printf("   Slab 3 (21 - 30 KL) @ Rs. 12.00/KL : %6.2f KL  =>  Rs. %8.2f\n", b->slab3Units, b->slab3Amount);
    printf("   Slab 4 (>  30 KL  ) @ Rs. 15.00/KL : %6.2f KL  =>  Rs. %8.2f\n", b->slab4Units, b->slab4Amount);
    printf("----------------------------------------------------------------------\n");
    printf("   Base Water Charges                 : Rs. %12.2f\n", b->waterCharges);
    printf("   Fixed Service Charge               : Rs. %12.2f\n", b->serviceCharge);
    printf("======================================================================\n");
    printf("   TOTAL PAYABLE AMOUNT               : Rs. %12.2f\n", b->totalAmount);
    printf("======================================================================\n");
    if (b->consumptionKL > 30.0) {
        printf(" [!] NOTICE: Consumption exceeded 30 KL. Excess usage tariff applied.\n");
    }
    printf(" Payment instructions: Pay via Module 8 or municipal smart counter.\n");
    printf("======================================================================\n\n");
}

void calculateWaterBillInteractive(void) {
    printf("\n==================================================\n");
    printf("    MODULE 3: WATER BILL TARIFF CALCULATOR\n");
    printf("==================================================\n");

    TariffConfig tariff = getTariffConfig();
    printf("Current Tariff Structure:\n");
    printf("  0  - 10 KL : Rs. %.2f per KL\n", tariff.slab1Rate);
    printf("  11 - 20 KL : Rs. %.2f per KL\n", tariff.slab2Rate);
    printf("  21 - 30 KL : Rs. %.2f per KL\n", tariff.slab3Rate);
    printf("  Above 30 KL: Rs. %.2f per KL\n", tariff.slab4Rate);
    printf("  Fixed Service Charge: Rs. %.2f\n", tariff.fixedServiceCharge);
    printf("--------------------------------------------------\n");

    double testConsumption;
    if (!getValidatedPositiveDouble("Enter Water Consumption in Kilolitres (KL): ", &testConsumption)) {
        return;
    }

    Bill dummy;
    memset(&dummy, 0, sizeof(Bill));
    strcpy(dummy.billID, "PREVIEW");
    strcpy(dummy.consumerID, "DEMO");
    strcpy(dummy.month, "Preview");
    dummy.year = 2024;
    dummy.previousReading = 0.0;
    dummy.currentReading = testConsumption;
    dummy.consumptionKL = testConsumption;
    dummy.consumptionLitres = testConsumption * 1000.0;
    strcpy(dummy.paymentStatus, "UNPAID");
    strcpy(dummy.billDate, "2024-06-15");

    computeBillForUnits(testConsumption, &tariff, &dummy);
    displayBillInvoice(&dummy);
}

void generateMonthlyBill(void) {
    printf("\n==================================================\n");
    printf("       MODULE 4: GENERATE MONTHLY WATER BILL\n");
    printf("==================================================\n");

    char consumerID[MAX_ID_LEN];
    getValidatedString("Enter Consumer ID (e.g. CON101): ", consumerID, sizeof(consumerID), 0);

    Consumer consumer;
    if (!getConsumerById(consumerID, &consumer)) {
        printf("[!] Consumer '%s' does not exist.\n", consumerID);
        return;
    }

    char month[16];
    getValidatedString("Enter Billing Month (e.g. June): ", month, sizeof(month), 0);

    int year = 2024;
    getValidatedPositiveInt("Enter Billing Year: ", &year);

    double prevReading = 0.0;
    getLatestReadingForConsumer(consumerID, &prevReading);

    printf("Previous Recorded Reading: %.2f KL\n", prevReading);
    double currReading = 0.0;
    while (1) {
        getValidatedPositiveDouble("Enter Current Meter Reading (KL): ", &currReading);
        if (currReading < prevReading) {
            printf("[!] Error: Current reading cannot be less than previous reading (%.2f KL).\n", prevReading);
            continue;
        }
        break;
    }

    TariffConfig tariff = getTariffConfig();
    Bill b;
    memset(&b, 0, sizeof(Bill));
    generateNextBillId(b.billID);
    strncpy(b.consumerID, consumerID, sizeof(b.consumerID));
    strncpy(b.month, month, sizeof(b.month));
    b.year = year;
    b.previousReading = prevReading;
    b.currentReading = currReading;
    b.consumptionKL = currReading - prevReading;
    b.consumptionLitres = b.consumptionKL * 1000.0;
    strcpy(b.paymentStatus, "UNPAID");

    time_t t = time(NULL);
    struct tm tm = *localtime(&t);
    sprintf(b.billDate, "%04d-%02d-%02d", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday);

    computeBillForUnits(b.consumptionKL, &tariff, &b);

    // Also persist water record if not already recorded
    WaterRecord rec;
    recordMeterReading(consumerID, month, year, prevReading, currReading, &rec);

    if (saveBillRecord(&b)) {
        printf("\n[SUCCESS] Bill %s successfully generated and saved to database!\n", b.billID);
        displayBillInvoice(&b);
    } else {
        printf("[!] Failed to save bill record.\n");
    }
}

void displayBillingHistory(void) {
    FILE *fp = fopen(FILE_BILLS, "r");
    if (fp == NULL) {
        printf("[!] No billing records found.\n");
        return;
    }

    printf("\n+----------+------------+-----------+------+------------+-------------+------------+----------+\n");
    printf("| BillID   | ConsumerID | Month     | Year | Usage (KL) | Base (Rs.)  | Total(Rs.) | Status   |\n");
    printf("+----------+------------+-----------+------+------------+-------------+------------+----------+\n");

    char line[1024];
    int count = 0;
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[1024];
        strncpy(temp, line, sizeof(temp));

        char *token = strtok(temp, "|");
        char *billId = token;
        char *cId = strtok(NULL, "|");
        char *month = strtok(NULL, "|");
        char *yearStr = strtok(NULL, "|");
        char *prev = strtok(NULL, "|");
        char *curr = strtok(NULL, "|");
        char *kl = strtok(NULL, "|");
        char *liters = strtok(NULL, "|");
        (void)prev; (void)curr; (void)liters;

        // Skip slab fields
        for (int i = 0; i < 8; i++) strtok(NULL, "|");
        char *waterChg = strtok(NULL, "|");
        char *servChg = strtok(NULL, "|");
        (void)servChg;
        char *totalAmt = strtok(NULL, "|");
        char *status = strtok(NULL, "|");

        if (billId && cId && month && yearStr && kl && totalAmt && status) {
            printf("| %-8s | %-10s | %-9s | %-4s | %10.2f | %11.2f | %10.2f | %-8s |\n",
                   billId, cId, month, yearStr,
                   atof(kl),
                   waterChg ? atof(waterChg) : 0.0,
                   atof(totalAmt),
                   status);
            count++;
        }
    }
    printf("+----------+------------+-----------+------+------------+-------------+------------+----------+\n");
    printf("Total bills logged: %d\n", count);
    fclose(fp);
}

int getBillById(const char *billID, Bill *outBill) {
    FILE *fp = fopen(FILE_BILLS, "r");
    if (fp == NULL) return 0;

    char line[1024];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[1024];
        strncpy(temp, line, sizeof(temp));

        char *token = strtok(temp, "|");
        if (token && strcmp(token, billID) == 0) {
            strncpy(outBill->billID, token, sizeof(outBill->billID));
            token = strtok(NULL, "|"); if (token) strncpy(outBill->consumerID, token, sizeof(outBill->consumerID));
            token = strtok(NULL, "|"); if (token) strncpy(outBill->month, token, sizeof(outBill->month));
            token = strtok(NULL, "|"); if (token) outBill->year = atoi(token);
            token = strtok(NULL, "|"); if (token) outBill->previousReading = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->currentReading = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->consumptionKL = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->consumptionLitres = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->slab1Units = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->slab1Amount = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->slab2Units = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->slab2Amount = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->slab3Units = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->slab3Amount = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->slab4Units = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->slab4Amount = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->waterCharges = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->serviceCharge = atof(token);
            token = strtok(NULL, "|"); if (token) outBill->totalAmount = atof(token);
            token = strtok(NULL, "|"); if (token) strncpy(outBill->paymentStatus, token, sizeof(outBill->paymentStatus));
            token = strtok(NULL, "|"); if (token) strncpy(outBill->billDate, token, sizeof(outBill->billDate));

            fclose(fp);
            return 1;
        }
    }
    fclose(fp);
    return 0;
}

int updateBillPaymentStatus(const char *billID, const char *newStatus) {
    FILE *fp = fopen(FILE_BILLS, "r");
    if (fp == NULL) return 0;

    FILE *tempFp = fopen("data/bills_temp.txt", "w");
    if (tempFp == NULL) {
        fclose(fp);
        return 0;
    }

    char line[1024];
    int updated = 0;
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char checkCopy[1024];
        strncpy(checkCopy, line, sizeof(checkCopy));

        char *token = strtok(checkCopy, "|");
        if (token && strcmp(token, billID) == 0) {
            // Reconstruct with updated paymentStatus
            Bill b;
            getBillById(billID, &b);
            strncpy(b.paymentStatus, newStatus, sizeof(b.paymentStatus));

            fprintf(tempFp,
                    "%s|%s|%s|%d|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%s|%s\n",
                    b.billID, b.consumerID, b.month, b.year,
                    b.previousReading, b.currentReading, b.consumptionKL, b.consumptionLitres,
                    b.slab1Units, b.slab1Amount,
                    b.slab2Units, b.slab2Amount,
                    b.slab3Units, b.slab3Amount,
                    b.slab4Units, b.slab4Amount,
                    b.waterCharges, b.serviceCharge, b.totalAmount,
                    b.paymentStatus, b.billDate);
            updated = 1;
        } else {
            fprintf(tempFp, "%s\n", line);
        }
    }

    fclose(fp);
    fclose(tempFp);

    remove(FILE_BILLS);
    rename("data/bills_temp.txt", FILE_BILLS);
    return updated;
}
