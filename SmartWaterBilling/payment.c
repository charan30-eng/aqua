/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: payment.c
 * Description: Module 7 - Bill payment processing, status updates, and receipts
 * Language: C (C11 Standard)
 * ============================================================================
 */

#include "payment.h"
#include "billing.h"
#include "consumer.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static int generateNextPaymentId(char *destBuffer) {
    FILE *fp = fopen(FILE_PAYMENTS, "r");
    int maxNum = 300;
    if (fp != NULL) {
        char line[512];
        while (fgets(line, sizeof(line), fp)) {
            char *id = strtok(line, "|");
            if (id != NULL && strncmp(id, "PAY", 3) == 0) {
                int num = atoi(id + 3);
                if (num > maxNum) maxNum = num;
            }
        }
        fclose(fp);
    }
    sprintf(destBuffer, "PAY%d", maxNum + 1);
    return maxNum + 1;
}

int savePaymentRecord(const Payment *p) {
    char line[512];
    snprintf(line, sizeof(line), "%s|%s|%s|%.2f|%s|%s|%s",
             p->paymentID, p->billID, p->consumerID,
             p->amountPaid, p->paymentMode, p->paymentDate, p->receiptNumber);
    return appendLineToFile(FILE_PAYMENTS, line);
}

void displayUnpaidBills(void) {
    FILE *fp = fopen(FILE_BILLS, "r");
    if (fp == NULL) {
        printf("[!] No bills registered yet.\n");
        return;
    }

    printf("\n+----------+------------+-----------+------+------------+--------------+------------+\n");
    printf("| Bill ID  | ConsumerID | Month     | Year | Usage (KL) | Payable (Rs) | Status     |\n");
    printf("+----------+------------+-----------+------+------------+--------------+------------+\n");

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
        for (int i = 0; i < 4; i++) strtok(NULL, "|"); // skip prev, curr, kl, lit
        for (int i = 0; i < 8; i++) strtok(NULL, "|"); // skip slab breakdown
        strtok(NULL, "|"); // waterChg
        strtok(NULL, "|"); // servChg
        char *totalAmt = strtok(NULL, "|");
        char *status = strtok(NULL, "|");

        if (status != NULL && strcmp(status, "UNPAID") == 0) {
            printf("| %-8s | %-10s | %-9s | %-4s | %10.2f | %12.2f | %-10s |\n",
                   billId, cId, month, yearStr,
                   atof(temp), // usage
                   totalAmt ? atof(totalAmt) : 0.0,
                   status);
            count++;
        }
    }
    printf("+----------+------------+-----------+------+------------+--------------+------------+\n");
    if (count == 0) {
        printf("Great news! There are currently NO unpaid water bills pending.\n");
    } else {
        printf("Total unpaid bills awaiting settlement: %d\n", count);
    }
    fclose(fp);
}

void processBillPayment(void) {
    printf("\n==================================================\n");
    printf("         SETTLE / PAY PENDING WATER BILL\n");
    printf("==================================================\n");

    char billID[16];
    getValidatedString("Enter Bill ID to settle (e.g., BIL501): ", billID, sizeof(billID), 0);

    Bill b;
    if (!getBillById(billID, &b)) {
        printf("[!] Bill '%s' not found.\n", billID);
        return;
    }

    if (strcmp(b.paymentStatus, "PAID") == 0) {
        printf("[Notice] Bill '%s' is already marked as PAID on record.\n", billID);
        return;
    }

    Consumer c;
    getConsumerById(b.consumerID, &c);

    printf("\nBill Summary for Settlement:\n");
    printf("  Bill Number  : %s\n", b.billID);
    printf("  Consumer     : %s (%s)\n", c.name, b.consumerID);
    printf("  Cycle        : %s %d\n", b.month, b.year);
    printf("  Consumption  : %.2f KL (%.0f Litres)\n", b.consumptionKL, b.consumptionLitres);
    printf("  Total Amount : Rs. %.2f\n", b.totalAmount);
    printf("--------------------------------------------------\n");

    printf("Select Simulation Payment Mode:\n");
    printf("1. Cash at Municipal Center\n");
    printf("2. UPI Smart Pay (Simulated)\n");
    printf("3. Credit / Debit Card (Simulated)\n");
    printf("4. NetBanking (Simulated)\n");
    printf("5. Cancel Payment\n");

    int modeChoice = 1;
    getValidatedPositiveInt("Choose payment option (1-5): ", &modeChoice);
    if (modeChoice == 5) {
        printf("Payment transaction cancelled.\n");
        return;
    }

    Payment p;
    generateNextPaymentId(p.paymentID);
    strncpy(p.billID, b.billID, sizeof(p.billID));
    strncpy(p.consumerID, b.consumerID, sizeof(p.consumerID));
    p.amountPaid = b.totalAmount;

    switch (modeChoice) {
        case 1: strcpy(p.paymentMode, "Cash"); break;
        case 2: strcpy(p.paymentMode, "UPI"); break;
        case 3: strcpy(p.paymentMode, "BankCard"); break;
        case 4: strcpy(p.paymentMode, "NetBanking"); break;
        default: strcpy(p.paymentMode, "DirectPay"); break;
    }

    time_t t = time(NULL);
    struct tm tm = *localtime(&t);
    sprintf(p.paymentDate, "%04d-%02d-%02d", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday);
    sprintf(p.receiptNumber, "RCP-%ld", (long)t % 1000000);

    // Save payment and update bill
    if (savePaymentRecord(&p) && updateBillPaymentStatus(b.billID, "PAID")) {
        printf("\n============================================================\n");
        printf("                  PAYMENT RECEIPT (SIMULATED)               \n");
        printf("============================================================\n");
        printf(" Transaction ID  : %s\n", p.paymentID);
        printf(" Receipt Number  : %s\n", p.receiptNumber);
        printf(" Bill ID Settled : %s\n", p.billID);
        printf(" Consumer Name   : %s (ID: %s)\n", c.name, b.consumerID);
        printf(" Amount Paid     : Rs. %.2f\n", p.amountPaid);
        printf(" Payment Mode    : %s\n", p.paymentMode);
        printf(" Date of Payment : %s\n", p.paymentDate);
        printf(" Status          : [SETTLED / PAID SUCCESSFUL]\n");
        printf("============================================================\n");
    } else {
        printf("[!] Payment recording failed due to file access error.\n");
    }
}

void displayPaymentHistory(void) {
    FILE *fp = fopen(FILE_PAYMENTS, "r");
    if (fp == NULL) {
        printf("[!] No payment transactions found in database.\n");
        return;
    }

    printf("\n+----------+----------+------------+------------+-------------+------------+----------------+\n");
    printf("| Pay ID   | Bill ID  | ConsumerID | Paid (Rs.) | Mode        | Date       | Receipt        |\n");
    printf("+----------+----------+------------+------------+-------------+------------+----------------+\n");

    char line[512];
    int count = 0;
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char *pid = strtok(line, "|");
        char *bid = strtok(NULL, "|");
        char *cid = strtok(NULL, "|");
        char *amt = strtok(NULL, "|");
        char *mode = strtok(NULL, "|");
        char *date = strtok(NULL, "|");
        char *rcp = strtok(NULL, "|");

        if (pid && bid && cid && amt && mode && date) {
            printf("| %-8s | %-8s | %-10s | %10.2f | %-11s | %-10s | %-14s |\n",
                   pid, bid, cid, atof(amt), mode, date, rcp ? rcp : "-");
            count++;
        }
    }
    printf("+----------+----------+------------+------------+-------------+------------+----------------+\n");
    printf("Total completed payment transactions: %d\n", count);
    fclose(fp);
}

void managePayments(void) {
    while (1) {
        printf("\n==================================================\n");
        printf("         MODULE 7: PAYMENT MANAGEMENT\n");
        printf("==================================================\n");
        printf("1. View All Unpaid Bills\n");
        printf("2. Settle / Pay a Bill\n");
        printf("3. View Payment Transaction History\n");
        printf("4. Return to Main Menu\n");
        printf("--------------------------------------------------\n");

        int choice;
        if (!getValidatedPositiveInt("Enter choice (1-4): ", &choice)) continue;

        switch (choice) {
            case 1: displayUnpaidBills(); break;
            case 2: processBillPayment(); break;
            case 3: displayPaymentHistory(); break;
            case 4: return;
            default: printf("[!] Invalid selection. Please choose 1 to 4.\n");
        }
    }
}
