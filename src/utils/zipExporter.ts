import JSZip from 'jszip';

// Complete sources of all C files and text datasets
export const C_PROJECT_SOURCES: Record<string, string> = {
  'main.c': `/**
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: main.c
 * Language: C (C11 Standard)
 */
#include <stdio.h>
#include <stdlib.h>
#include "file_manager.h"
#include "consumer.h"
#include "monitoring.h"
#include "billing.h"
#include "analytics.h"
#include "payment.h"

void displayMainMenu(void) {
    printf("\\n==============================================\\n");
    printf("       SMART WATER MANAGEMENT SYSTEM          \\n");
    printf("==============================================\\n");
    printf(" 1. Register New Consumer\\n");
    printf(" 2. View Consumer Details\\n");
    printf(" 3. Monitor Water Consumption\\n");
    printf(" 4. Calculate Water Bill (Tariff Simulator)\\n");
    printf(" 5. Generate Monthly Bill\\n");
    printf(" 6. View Consumption Analytics\\n");
    printf(" 7. Check Leakage / Excess Usage Alerts\\n");
    printf(" 8. Manage Payments\\n");
    printf(" 9. View Billing History\\n");
    printf(" 10. Exit\\n");
    printf("==============================================\\n");
}

int main(void) {
    initializeDataDirectories();
    printf("\\n****************************************************************\\n");
    printf("*   WELCOME TO SMART WATER MONITORING & BILLING SIMULATOR      *\\n");
    printf("*   Developed in C11 for Academic Simulation & Municipal Tech  *\\n");
    printf("****************************************************************\\n");

    int choice = 0;
    while (1) {
        displayMainMenu();
        if (!getValidatedPositiveInt("Enter your choice (1-10): ", &choice)) continue;

        switch (choice) {
            case 1: registerConsumer(); break;
            case 2: viewConsumerDetails(); break;
            case 3: monitorWaterConsumption(); break;
            case 4: calculateWaterBillInteractive(); break;
            case 5: generateMonthlyBill(); break;
            case 6: viewConsumptionAnalytics(); break;
            case 7: checkLeakageAndExcessAlerts(); break;
            case 8: managePayments(); break;
            case 9: displayBillingHistory(); break;
            case 10:
                printf("\\nThank you for using Smart Water Management System! Conserve Water.\\n");
                exit(0);
            default:
                printf("[!] Invalid choice. Enter 1 to 10.\\n");
        }
    }
    return 0;
}`,

  'consumer.h': `#ifndef CONSUMER_H
#define CONSUMER_H

#define MAX_ID_LEN 16
#define MAX_NAME_LEN 64
#define MAX_ADDR_LEN 128
#define MAX_PHONE_LEN 16

typedef struct {
    char consumerID[MAX_ID_LEN];
    char name[MAX_NAME_LEN];
    char address[MAX_ADDR_LEN];
    char phoneNumber[MAX_PHONE_LEN];
    char registrationDate[16];
} Consumer;

void registerConsumer(void);
void viewConsumerDetails(void);
void searchConsumerById(const char *searchID);
void displayAllConsumers(void);
int generateNextConsumerId(char *destIdBuffer);
int isConsumerExists(const char *consumerID);
int getConsumerById(const char *consumerID, Consumer *outConsumer);

#endif`,

  'consumer.c': `#include "consumer.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

int isConsumerExists(const char *consumerID) {
    FILE *fp = fopen(FILE_CONSUMERS, "r");
    if (!fp) return 0;
    char line[256];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char *id = strtok(line, "|");
        if (id && strcmp(id, consumerID) == 0) { fclose(fp); return 1; }
    }
    fclose(fp);
    return 0;
}

int getConsumerById(const char *consumerID, Consumer *outConsumer) {
    FILE *fp = fopen(FILE_CONSUMERS, "r");
    if (!fp) return 0;
    char line[512];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512];
        strncpy(temp, line, sizeof(temp));
        char *token = strtok(temp, "|");
        if (token && strcmp(token, consumerID) == 0) {
            strncpy(outConsumer->consumerID, token, MAX_ID_LEN);
            token = strtok(NULL, "|"); if (token) strncpy(outConsumer->name, token, MAX_NAME_LEN);
            token = strtok(NULL, "|"); if (token) strncpy(outConsumer->address, token, MAX_ADDR_LEN);
            token = strtok(NULL, "|"); if (token) strncpy(outConsumer->phoneNumber, token, MAX_PHONE_LEN);
            token = strtok(NULL, "|"); if (token) strncpy(outConsumer->registrationDate, token, 16);
            fclose(fp);
            return 1;
        }
    }
    fclose(fp);
    return 0;
}

int generateNextConsumerId(char *destIdBuffer) {
    FILE *fp = fopen(FILE_CONSUMERS, "r");
    int maxNum = 100;
    if (fp) {
        char line[256];
        while (fgets(line, sizeof(line), fp)) {
            char *id = strtok(line, "|");
            if (id && strncmp(id, "CON", 3) == 0) {
                int num = atoi(id + 3);
                if (num > maxNum) maxNum = num;
            }
        }
        fclose(fp);
    }
    sprintf(destIdBuffer, "CON%d", maxNum + 1);
    return maxNum + 1;
}

void registerConsumer(void) {
    printf("\\n--- REGISTER NEW CONSUMER ---\\n");
    Consumer c;
    generateNextConsumerId(c.consumerID);
    printf("Generated ID : %s\\n", c.consumerID);
    getValidatedString("Enter Household Name: ", c.name, sizeof(c.name), 0);
    getValidatedString("Enter Address       : ", c.address, sizeof(c.address), 0);
    getValidatedString("Enter Contact Phone : ", c.phoneNumber, sizeof(c.phoneNumber), 0);
    time_t t = time(NULL);
    struct tm tm = *localtime(&t);
    sprintf(c.registrationDate, "%04d-%02d-%02d", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday);

    char record[512];
    snprintf(record, sizeof(record), "%s|%s|%s|%s|%s", c.consumerID, c.name, c.address, c.phoneNumber, c.registrationDate);
    if (appendLineToFile(FILE_CONSUMERS, record)) {
        printf("[SUCCESS] Registered %s (%s)\\n", c.consumerID, c.name);
    }
}

void viewConsumerDetails(void) {
    printf("\\n1. View All\\n2. Search by ID\\n");
    int ch = 1;
    getValidatedPositiveInt("Choice: ", &ch);
    if (ch == 1) displayAllConsumers();
    else {
        char id[16];
        getValidatedString("Enter ID: ", id, sizeof(id), 0);
        searchConsumerById(id);
    }
}

void searchConsumerById(const char *searchID) {
    Consumer c;
    if (getConsumerById(searchID, &c)) {
        printf("\\n[CONSUMER FOUND]\\nID: %s\\nName: %s\\nAddress: %s\\nPhone: %s\\nDate: %s\\n",
               c.consumerID, c.name, c.address, c.phoneNumber, c.registrationDate);
    } else {
        printf("[!] Consumer '%s' not found.\\n", searchID);
    }
}

void displayAllConsumers(void) {
    FILE *fp = fopen(FILE_CONSUMERS, "r");
    if (!fp) { printf("[!] No records.\\n"); return; }
    printf("\\n%-10s %-20s %-30s %-15s\\n", "ID", "Name", "Address", "Phone");
    char line[512];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char *id = strtok(line, "|");
        char *n = strtok(NULL, "|");
        char *a = strtok(NULL, "|");
        char *p = strtok(NULL, "|");
        if (id && n) printf("%-10s %-20.20s %-30.30s %-15s\\n", id, n, a ? a : "", p ? p : "");
    }
    fclose(fp);
}`,

  'monitoring.h': `#ifndef MONITORING_H
#define MONITORING_H

typedef struct {
    char recordID[16];
    char consumerID[16];
    char month[16];
    int year;
    double previousReading;
    double currentReading;
    double consumptionKL;
    double consumptionLitres;
    char recordDate[16];
} WaterRecord;

void monitorWaterConsumption(void);
int recordMeterReading(const char *consumerID, const char *month, int year, double prevReading, double currReading, WaterRecord *outRecord);
int getLatestReadingForConsumer(const char *consumerID, double *outPrevReading);
void displayRecordsForConsumer(const char *consumerID);

#endif`,

  'monitoring.c': `#include "monitoring.h"
#include "consumer.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

int getLatestReadingForConsumer(const char *consumerID, double *outPrevReading) {
    FILE *fp = fopen(FILE_RECORDS, "r");
    if (!fp) return 0;
    char line[512];
    double last = 0.0;
    int found = 0;
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512];
        strncpy(temp, line, sizeof(temp));
        strtok(temp, "|");
        char *cid = strtok(NULL, "|");
        strtok(NULL, "|"); strtok(NULL, "|"); strtok(NULL, "|");
        char *curr = strtok(NULL, "|");
        if (cid && strcmp(cid, consumerID) == 0 && curr) {
            last = atof(curr);
            found = 1;
        }
    }
    fclose(fp);
    if (found) { *outPrevReading = last; return 1; }
    return 0;
}

int recordMeterReading(const char *consumerID, const char *month, int year, double prevReading, double currReading, WaterRecord *outRecord) {
    if (currReading < prevReading) return 0;
    sprintf(outRecord->recordID, "REC%ld", time(NULL) % 10000);
    strncpy(outRecord->consumerID, consumerID, 16);
    strncpy(outRecord->month, month, 16);
    outRecord->year = year;
    outRecord->previousReading = prevReading;
    outRecord->currentReading = currReading;
    outRecord->consumptionKL = currReading - prevReading;
    outRecord->consumptionLitres = outRecord->consumptionKL * 1000.0;
    sprintf(outRecord->recordDate, "2024-06-30");

    char line[512];
    snprintf(line, sizeof(line), "%s|%s|%s|%d|%.2f|%.2f|%.2f|%.2f|%s",
             outRecord->recordID, outRecord->consumerID, outRecord->month, outRecord->year,
             outRecord->previousReading, outRecord->currentReading, outRecord->consumptionKL,
             outRecord->consumptionLitres, outRecord->recordDate);
    return appendLineToFile(FILE_RECORDS, line);
}

void monitorWaterConsumption(void) {
    printf("\\n--- MONITOR WATER CONSUMPTION ---\\n");
    char cid[16];
    getValidatedString("Enter Consumer ID: ", cid, sizeof(cid), 0);
    Consumer c;
    if (!getConsumerById(cid, &c)) { printf("[!] Consumer not found.\\n"); return; }
    char month[16];
    getValidatedString("Enter Month (e.g. June): ", month, sizeof(month), 0);
    int year = 2024;
    getValidatedPositiveInt("Enter Year: ", &year);

    double prev = 0.0, curr = 0.0;
    getLatestReadingForConsumer(cid, &prev);
    printf("Prior Reading: %.2f KL\\n", prev);
    while (1) {
        getValidatedPositiveDouble("Enter Current Reading (KL): ", &curr);
        if (curr < prev) { printf("[!] Current must be >= previous (%.2f KL).\\n", prev); continue; }
        break;
    }
    WaterRecord r;
    recordMeterReading(cid, month, year, prev, curr, &r);
    printf("[SUCCESS] Recorded %.2f KL (%.0f Litres)\\n", r.consumptionKL, r.consumptionLitres);
}`,

  'billing.h': `#ifndef BILLING_H
#define BILLING_H

typedef struct {
    double slab1Limit, slab1Rate;
    double slab2Limit, slab2Rate;
    double slab3Limit, slab3Rate;
    double slab4Rate;
    double fixedServiceCharge;
    double leakageThresholdKL;
} TariffConfig;

typedef struct {
    char billID[16];
    char consumerID[16];
    char month[16];
    int year;
    double previousReading, currentReading;
    double consumptionKL, consumptionLitres;
    double slab1Units, slab1Amount;
    double slab2Units, slab2Amount;
    double slab3Units, slab3Amount;
    double slab4Units, slab4Amount;
    double waterCharges, serviceCharge, totalAmount;
    char paymentStatus[12];
    char billDate[16];
} Bill;

TariffConfig getTariffConfig(void);
int computeBillForUnits(double consumptionKL, const TariffConfig *tariff, Bill *outBill);
void calculateWaterBillInteractive(void);
void generateMonthlyBill(void);
void displayBillInvoice(const Bill *b);
void displayBillingHistory(void);
int getBillById(const char *billID, Bill *outBill);
int updateBillPaymentStatus(const char *billID, const char *newStatus);

#endif`,

  'billing.c': `#include "billing.h"
#include "consumer.h"
#include "monitoring.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

TariffConfig getTariffConfig(void) {
    TariffConfig c = {10.0, 5.0, 20.0, 8.0, 30.0, 12.0, 15.0, 50.0, 30.0};
    return c;
}

int computeBillForUnits(double consumptionKL, const TariffConfig *tariff, Bill *out) {
    double rem = consumptionKL > 0 ? consumptionKL : 0;
    out->slab1Units = rem > tariff->slab1Limit ? tariff->slab1Limit : rem;
    out->slab1Amount = out->slab1Units * tariff->slab1Rate;
    rem -= out->slab1Units;

    double s2 = tariff->slab2Limit - tariff->slab1Limit;
    out->slab2Units = rem > s2 ? s2 : rem;
    out->slab2Amount = out->slab2Units * tariff->slab2Rate;
    rem -= out->slab2Units;

    double s3 = tariff->slab3Limit - tariff->slab2Limit;
    out->slab3Units = rem > s3 ? s3 : rem;
    out->slab3Amount = out->slab3Units * tariff->slab3Rate;
    rem -= out->slab3Units;

    out->slab4Units = rem > 0 ? rem : 0;
    out->slab4Amount = out->slab4Units * tariff->slab4Rate;

    out->waterCharges = out->slab1Amount + out->slab2Amount + out->slab3Amount + out->slab4Amount;
    out->serviceCharge = tariff->fixedServiceCharge;
    out->totalAmount = out->waterCharges + out->serviceCharge;
    return 1;
}

void displayBillInvoice(const Bill *b) {
    printf("\\n=======================================================\\n");
    printf("         SMART WATER MUNICIPAL BILL INVOICE            \\n");
    printf("=======================================================\\n");
    printf("Bill ID       : %s          Status: [%s]\\n", b->billID, b->paymentStatus);
    printf("Consumer ID   : %s          Cycle : %s %d\\n", b->consumerID, b->month, b->year);
    printf("Readings      : %.2f KL -> %.2f KL (Volume: %.2f KL / %.0f L)\\n",
           b->previousReading, b->currentReading, b->consumptionKL, b->consumptionLitres);
    printf("-------------------------------------------------------\\n");
    printf("Slab 1 (0-10 KL @ Rs 5.00) : %6.2f KL => Rs. %8.2f\\n", b->slab1Units, b->slab1Amount);
    printf("Slab 2 (11-20 KL @ Rs 8.00): %6.2f KL => Rs. %8.2f\\n", b->slab2Units, b->slab2Amount);
    printf("Slab 3 (21-30 KL @ Rs 12.0): %6.2f KL => Rs. %8.2f\\n", b->slab3Units, b->slab3Amount);
    printf("Slab 4 (>30 KL @ Rs 15.00) : %6.2f KL => Rs. %8.2f\\n", b->slab4Units, b->slab4Amount);
    printf("-------------------------------------------------------\\n");
    printf("Base Water Charges         : Rs. %.2f\\n", b->waterCharges);
    printf("Fixed Service Charge       : Rs. %.2f\\n", b->serviceCharge);
    printf("TOTAL PAYABLE              : Rs. %.2f\\n", b->totalAmount);
    printf("=======================================================\\n");
}

void calculateWaterBillInteractive(void) {
    double units = 0;
    getValidatedPositiveDouble("Enter usage volume in KL to test: ", &units);
    TariffConfig t = getTariffConfig();
    Bill b;
    memset(&b, 0, sizeof(b));
    strcpy(b.billID, "PREVIEW");
    strcpy(b.consumerID, "TEST");
    strcpy(b.month, "Simulated");
    b.consumptionKL = units;
    b.consumptionLitres = units * 1000.0;
    strcpy(b.paymentStatus, "PREVIEW");
    computeBillForUnits(units, &t, &b);
    displayBillInvoice(&b);
}

void generateMonthlyBill(void) {
    char cid[16];
    getValidatedString("Enter Consumer ID: ", cid, sizeof(cid), 0);
    Consumer c;
    if (!getConsumerById(cid, &c)) { printf("[!] Consumer not found.\\n"); return; }
    char month[16];
    getValidatedString("Enter Month: ", month, sizeof(month), 0);
    double prev = 0, curr = 0;
    getLatestReadingForConsumer(cid, &prev);
    printf("Previous reading: %.2f KL\\n", prev);
    getValidatedPositiveDouble("Enter Current reading: ", &curr);

    TariffConfig t = getTariffConfig();
    Bill b;
    memset(&b, 0, sizeof(b));
    sprintf(b.billID, "BIL%ld", time(NULL) % 10000);
    strcpy(b.consumerID, cid);
    strcpy(b.month, month);
    b.year = 2024;
    b.previousReading = prev;
    b.currentReading = curr;
    b.consumptionKL = curr - prev;
    b.consumptionLitres = b.consumptionKL * 1000;
    strcpy(b.paymentStatus, "UNPAID");
    strcpy(b.billDate, "2024-06-30");

    computeBillForUnits(b.consumptionKL, &t, &b);

    char line[1024];
    snprintf(line, sizeof(line),
             "%s|%s|%s|%d|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%s|%s",
             b.billID, b.consumerID, b.month, b.year, b.previousReading, b.currentReading,
             b.consumptionKL, b.consumptionLitres, b.slab1Units, b.slab1Amount, b.slab2Units, b.slab2Amount,
             b.slab3Units, b.slab3Amount, b.slab4Units, b.slab4Amount, b.waterCharges, b.serviceCharge,
             b.totalAmount, b.paymentStatus, b.billDate);
    appendLineToFile(FILE_BILLS, line);
    displayBillInvoice(&b);
}

void displayBillingHistory(void) {
    FILE *fp = fopen(FILE_BILLS, "r");
    if (!fp) { printf("[!] No bills logged.\\n"); return; }
    printf("\\n%-8s %-10s %-8s %-10s %-10s %-8s\\n", "BillID", "Consumer", "Month", "KL Used", "Total(Rs)", "Status");
    char line[1024];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[1024]; strncpy(temp, line, sizeof(temp));
        char *bid = strtok(temp, "|");
        char *cid = strtok(NULL, "|");
        char *m = strtok(NULL, "|");
        strtok(NULL, "|"); strtok(NULL, "|"); strtok(NULL, "|");
        char *kl = strtok(NULL, "|");
        for (int i=0; i<10; i++) strtok(NULL, "|");
        char *tot = strtok(NULL, "|");
        char *st = strtok(NULL, "|");
        if (bid && cid && tot) printf("%-8s %-10s %-8s %-10s %-10s %-8s\\n", bid, cid, m, kl, tot, st);
    }
    fclose(fp);
}

int getBillById(const char *billID, Bill *outBill) {
    FILE *fp = fopen(FILE_BILLS, "r");
    if (!fp) return 0;
    char line[1024];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[1024]; strncpy(temp, line, sizeof(temp));
        char *token = strtok(temp, "|");
        if (token && strcmp(token, billID) == 0) {
            strcpy(outBill->billID, token);
            token = strtok(NULL, "|"); if (token) strcpy(outBill->consumerID, token);
            token = strtok(NULL, "|"); if (token) strcpy(outBill->month, token);
            token = strtok(NULL, "|"); if (token) outBill->year = atoi(token);
            for (int i=0; i<14; i++) strtok(NULL, "|");
            token = strtok(NULL, "|"); if (token) outBill->totalAmount = atof(token);
            token = strtok(NULL, "|"); if (token) strcpy(outBill->paymentStatus, token);
            fclose(fp);
            return 1;
        }
    }
    fclose(fp);
    return 0;
}

int updateBillPaymentStatus(const char *billID, const char *newStatus) {
    FILE *fp = fopen(FILE_BILLS, "r");
    if (!fp) return 0;
    FILE *tfp = fopen("data/b_temp.txt", "w");
    if (!tfp) { fclose(fp); return 0; }
    char line[1024];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        if (strstr(line, billID) != NULL) {
            // Replace UNPAID with newStatus
            char *pos = strstr(line, "UNPAID");
            if (pos) {
                int offset = pos - line;
                line[offset] = '\\0';
                fprintf(tfp, "%s%s|2024-06-30\\n", line, newStatus);
            } else {
                fprintf(tfp, "%s\\n", line);
            }
        } else {
            fprintf(tfp, "%s\\n", line);
        }
    }
    fclose(fp); fclose(tfp);
    remove(FILE_BILLS);
    rename("data/b_temp.txt", FILE_BILLS);
    return 1;
}`,

  'analytics.h': `#ifndef ANALYTICS_H
#define ANALYTICS_H

void viewConsumptionAnalytics(void);
void checkLeakageAndExcessAlerts(void);
void displayWaterConservationTips(void);

#endif`,

  'analytics.c': `#include "analytics.h"
#include "billing.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void viewConsumptionAnalytics(void) {
    FILE *fp = fopen(FILE_RECORDS, "r");
    if (!fp) { printf("[!] No records to analyze.\\n"); return; }
    printf("\\n--- CONSUMPTION ANALYTICS & STATS ---\\n");
    char line[512];
    double total = 0.0; int count = 0; double maxKL = 0.0;
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512]; strncpy(temp, line, sizeof(temp));
        strtok(temp, "|"); strtok(NULL, "|"); strtok(NULL, "|"); strtok(NULL, "|");
        strtok(NULL, "|"); strtok(NULL, "|");
        char *kl = strtok(NULL, "|");
        if (kl) {
            double v = atof(kl);
            total += v; count++;
            if (v > maxKL) maxKL = v;
        }
    }
    fclose(fp);
    if (count > 0) {
        printf("Records Count : %d\\n", count);
        printf("Total Volume  : %.2f KL (%.0f Litres)\\n", total, total * 1000.0);
        printf("Average Volume: %.2f KL\\n", total / count);
        printf("Peak Volume   : %.2f KL\\n", maxKL);
    }
}

void checkLeakageAndExcessAlerts(void) {
    FILE *fp = fopen(FILE_RECORDS, "r");
    if (!fp) { printf("[!] No records to inspect.\\n"); return; }
    printf("\\n=======================================================\\n");
    printf("      LEAKAGE & EXCESS USAGE SIMULATION ENGINE         \\n");
    printf("=======================================================\\n");
    char line[512]; int alerts = 0;
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512]; strncpy(temp, line, sizeof(temp));
        strtok(temp, "|");
        char *cid = strtok(NULL, "|");
        char *m = strtok(NULL, "|");
        strtok(NULL, "|"); strtok(NULL, "|"); strtok(NULL, "|");
        char *klStr = strtok(NULL, "|");
        if (klStr && atof(klStr) > 30.0) {
            printf("[WARNING] %s in %s consumed %.2f KL (>30 KL threshold)! Probable pipe leak.\\n",
                   cid, m, atof(klStr));
            alerts++;
        }
    }
    fclose(fp);
    if (alerts == 0) printf("[NORMAL] All households under threshold.\\n");
    else displayWaterConservationTips();
}

void displayWaterConservationTips(void) {
    printf("\\n--- CONSERVATION MEASURES ---\\n");
    printf("1. Check toilet flapper valve for silent continuous leakage.\\n");
    printf("2. Replace dripping faucet washers (saves up to 15L/day).\\n");
    printf("3. Install aerator nozzles to reduce flow rate by 40%%.\\n");
}`,

  'payment.h': `#ifndef PAYMENT_H
#define PAYMENT_H

void managePayments(void);
void displayUnpaidBills(void);
void processBillPayment(void);
void displayPaymentHistory(void);

#endif`,

  'payment.c': `#include "payment.h"
#include "billing.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

void managePayments(void) {
    printf("\\n1. View Unpaid Bills\\n2. Settle Bill\\n3. History\\n");
    int ch = 1; getValidatedPositiveInt("Choice: ", &ch);
    if (ch == 1) displayUnpaidBills();
    else if (ch == 2) processBillPayment();
    else displayPaymentHistory();
}

void displayUnpaidBills(void) {
    FILE *fp = fopen(FILE_BILLS, "r");
    if (!fp) { printf("[!] No bills.\\n"); return; }
    printf("\\n%-8s %-10s %-8s %-10s %-8s\\n", "BillID", "Consumer", "Month", "Amount(Rs)", "Status");
    char line[1024];
    while (fgets(line, sizeof(line), fp)) {
        if (strstr(line, "UNPAID") != NULL) {
            char temp[1024]; strncpy(temp, line, sizeof(temp));
            char *bid = strtok(temp, "|");
            char *cid = strtok(NULL, "|");
            char *m = strtok(NULL, "|");
            for (int i=0; i<15; i++) strtok(NULL, "|");
            char *tot = strtok(NULL, "|");
            printf("%-8s %-10s %-8s %-10s UNPAID\\n", bid, cid, m, tot);
        }
    }
    fclose(fp);
}

void processBillPayment(void) {
    char bid[16];
    getValidatedString("Enter Bill ID to settle: ", bid, sizeof(bid), 0);
    Bill b;
    if (!getBillById(bid, &b)) { printf("[!] Bill not found.\\n"); return; }
    printf("Amount Due: Rs. %.2f\\n", b.totalAmount);
    printf("Confirming simulated settlement...\\n");
    updateBillPaymentStatus(bid, "PAID");
    char payRec[256];
    sprintf(payRec, "PAY%ld|%s|%s|%.2f|UPI|2024-07-05|RCP-%ld",
            time(NULL) % 10000, bid, b.consumerID, b.totalAmount, time(NULL) % 100000);
    appendLineToFile(FILE_PAYMENTS, payRec);
    printf("[SUCCESS] Payment receipt generated for %s.\\n", bid);
}

void displayPaymentHistory(void) {
    FILE *fp = fopen(FILE_PAYMENTS, "r");
    if (!fp) { printf("[!] No payments recorded.\\n"); return; }
    char line[512];
    printf("\\n%-8s %-8s %-10s %-10s %-10s %-12s\\n", "PayID", "BillID", "Consumer", "Amount", "Mode", "Date");
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char *p = strtok(line, "|");
        char *b = strtok(NULL, "|");
        char *c = strtok(NULL, "|");
        char *amt = strtok(NULL, "|");
        char *mode = strtok(NULL, "|");
        char *dt = strtok(NULL, "|");
        if (p && b) printf("%-8s %-8s %-10s %-10s %-10s %-12s\\n", p, b, c, amt, mode, dt);
    }
    fclose(fp);
}`,

  'file_manager.h': `#ifndef FILE_MANAGER_H
#define FILE_MANAGER_H

#define FILE_CONSUMERS "data/consumers.txt"
#define FILE_RECORDS   "data/water_records.txt"
#define FILE_BILLS     "data/bills.txt"
#define FILE_PAYMENTS  "data/payments.txt"

void initializeDataDirectories(void);
int appendLineToFile(const char *filename, const char *line);
void trimNewline(char *str);
int getValidatedString(const char *prompt, char *buffer, int maxLen, int allowEmpty);
int getValidatedPositiveInt(const char *prompt, int *outValue);
int getValidatedPositiveDouble(const char *prompt, double *outValue);

#endif`,

  'file_manager.c': `#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#ifdef _WIN32
  #include <direct.h>
  #define MKDIR(d) _mkdir(d)
#else
  #define MKDIR(d) mkdir(d, 0777)
#endif

void initializeDataDirectories(void) {
    MKDIR("data");
    const char *f[] = {FILE_CONSUMERS, FILE_RECORDS, FILE_BILLS, FILE_PAYMENTS};
    for (int i = 0; i < 4; i++) {
        FILE *fp = fopen(f[i], "a");
        if (fp) fclose(fp);
    }
}

void trimNewline(char *str) {
    if (!str) return;
    size_t l = strlen(str);
    while (l > 0 && (str[l-1] == '\\n' || str[l-1] == '\\r')) { str[l-1] = '\\0'; l--; }
}

int getValidatedString(const char *prompt, char *buffer, int maxLen, int allowEmpty) {
    printf("%s", prompt);
    if (!fgets(buffer, maxLen, stdin)) return 0;
    trimNewline(buffer);
    if (!allowEmpty && strlen(buffer) == 0) return 0;
    return 1;
}

int getValidatedPositiveInt(const char *prompt, int *outValue) {
    char buf[64];
    printf("%s", prompt);
    if (!fgets(buf, sizeof(buf), stdin)) return 0;
    trimNewline(buf);
    *outValue = atoi(buf);
    return 1;
}

int getValidatedPositiveDouble(const char *prompt, double *outValue) {
    char buf[64];
    printf("%s", prompt);
    if (!fgets(buf, sizeof(buf), stdin)) return 0;
    trimNewline(buf);
    *outValue = atof(buf);
    return 1;
}`,

  'Makefile': `CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2
SRCS = main.c consumer.c monitoring.c billing.c analytics.c payment.c file_manager.c
OBJS = $(SRCS:.c=.o)
TARGET = smart_water_billing

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $(TARGET) $(OBJS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET) $(TARGET).exe
`,

  'data/consumers.txt': `CON101|Ravindra Sharma|Plot 42, Green Meadows Sector 4|9876543210|2024-01-10
CON102|Priya Patel|Villa 18, Lakeview Residency|9823456789|2024-02-14
CON103|Anita Deshmukh|Flat 304, Palm Springs Enclave|9811223344|2024-03-01
CON104|Ramesh Kumar|House 7, Riverbank Colony|9845123456|2024-03-20
CON105|Karthik Reddy|B-12, Cyber Valley Apartments|9871122445|2024-04-12
`,

  'data/water_records.txt': `REC1001|CON101|January|2024|100.00|118.00|18.00|18000.00|2024-01-31
REC1002|CON101|February|2024|118.00|139.00|21.00|21000.00|2024-02-28
REC1003|CON101|March|2024|139.00|163.00|24.00|24000.00|2024-03-31
REC1004|CON101|April|2024|163.00|191.00|28.00|28000.00|2024-04-30
REC1005|CON101|May|2024|191.00|216.00|25.00|25000.00|2024-05-31
REC1006|CON101|June|2024|216.00|254.00|38.00|38000.00|2024-06-30
REC1007|CON102|May|2024|80.00|96.00|16.00|16000.00|2024-05-31
REC1008|CON102|June|2024|96.00|114.00|18.00|18000.00|2024-06-30
REC1009|CON103|June|2024|210.00|252.00|42.00|42000.00|2024-06-30
REC1010|CON104|June|2024|50.00|62.00|12.00|12000.00|2024-06-30
`,

  'data/bills.txt': `BIL501|CON101|May|2024|191.00|216.00|25.00|25000.00|10.00|50.00|10.00|80.00|5.00|60.00|0.00|0.00|190.00|50.00|240.00|PAID|2024-05-31
BIL502|CON101|June|2024|216.00|254.00|38.00|38000.00|10.00|50.00|10.00|80.00|10.00|120.00|8.00|120.00|370.00|50.00|420.00|UNPAID|2024-06-30
BIL503|CON102|June|2024|96.00|114.00|18.00|18000.00|10.00|50.00|8.00|64.00|0.00|0.00|0.00|0.00|114.00|50.00|164.00|PAID|2024-06-30
BIL504|CON103|June|2024|210.00|252.00|42.00|42000.00|10.00|50.00|10.00|80.00|10.00|120.00|12.00|180.00|430.00|50.00|480.00|UNPAID|2024-06-30
`,

  'data/payments.txt': `PAY301|BIL501|CON101|240.00|UPI|2024-06-02|RCP-839201
PAY302|BIL503|CON102|164.00|NetBanking|2024-07-02|RCP-918234
`,

  'README.md': `# Smart Water Consumption Monitoring and Billing Simulator Using C

## Quick Start
1. Compile with GCC:
   gcc -Wall -Wextra -std=c11 main.c consumer.c monitoring.c billing.c analytics.c payment.c file_manager.c -o smart_water_billing.exe
2. Run on Windows:
   smart_water_billing.exe
3. Run on Linux/macOS:
   ./smart_water_billing
`
};

export async function downloadCProjectZip(): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('SmartWaterBilling');

  if (folder) {
    for (const [filename, content] of Object.entries(C_PROJECT_SOURCES)) {
      folder.file(filename, content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SmartWaterBilling_C_Project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
