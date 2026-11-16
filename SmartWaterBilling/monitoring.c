/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: monitoring.c
 * Description: Module 2 - Water consumption monitoring & meter record storage
 * Language: C (C11 Standard)
 * ============================================================================
 */

#include "monitoring.h"
#include "consumer.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

int getLatestReadingForConsumer(const char *consumerID, double *outPrevReading) {
    FILE *fp = fopen(FILE_RECORDS, "r");
    if (fp == NULL) return 0;

    char line[512];
    double lastReading = 0.0;
    int found = 0;

    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512];
        strncpy(temp, line, sizeof(temp));

        char *recId = strtok(temp, "|");
        char *cId = strtok(NULL, "|");
        char *month = strtok(NULL, "|");
        char *yearStr = strtok(NULL, "|");
        char *prevStr = strtok(NULL, "|");
        char *currStr = strtok(NULL, "|");

        (void)recId;
        (void)month;
        (void)yearStr;
        (void)prevStr;

        if (cId != NULL && strcmp(cId, consumerID) == 0 && currStr != NULL) {
            lastReading = atof(currStr);
            found = 1;
        }
    }
    fclose(fp);

    if (found) {
        *outPrevReading = lastReading;
        return 1;
    }
    return 0;
}

static int generateNextRecordId(char *destBuffer) {
    FILE *fp = fopen(FILE_RECORDS, "r");
    int maxNum = 1000;
    if (fp != NULL) {
        char line[512];
        while (fgets(line, sizeof(line), fp)) {
            char *id = strtok(line, "|");
            if (id != NULL && strncmp(id, "REC", 3) == 0) {
                int num = atoi(id + 3);
                if (num > maxNum) maxNum = num;
            }
        }
        fclose(fp);
    }
    sprintf(destBuffer, "REC%d", maxNum + 1);
    return maxNum + 1;
}

int recordMeterReading(const char *consumerID, const char *month, int year, 
                       double prevReading, double currReading, WaterRecord *outRecord) {
    if (currReading < prevReading) {
        printf("\n[!] Error: Current reading (%.2f KL) cannot be less than previous reading (%.2f KL)!\n",
               currReading, prevReading);
        return 0;
    }

    generateNextRecordId(outRecord->recordID);
    strncpy(outRecord->consumerID, consumerID, sizeof(outRecord->consumerID));
    strncpy(outRecord->month, month, sizeof(outRecord->month));
    outRecord->year = year;
    outRecord->previousReading = prevReading;
    outRecord->currentReading = currReading;
    outRecord->consumptionKL = currReading - prevReading;
    outRecord->consumptionLitres = outRecord->consumptionKL * 1000.0;

    time_t t = time(NULL);
    struct tm tm = *localtime(&t);
    sprintf(outRecord->recordDate, "%04d-%02d-%02d", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday);

    char line[512];
    snprintf(line, sizeof(line), "%s|%s|%s|%d|%.2f|%.2f|%.2f|%.2f|%s",
             outRecord->recordID, outRecord->consumerID, outRecord->month, outRecord->year,
             outRecord->previousReading, outRecord->currentReading,
             outRecord->consumptionKL, outRecord->consumptionLitres, outRecord->recordDate);

    return appendLineToFile(FILE_RECORDS, line);
}

void monitorWaterConsumption(void) {
    printf("\n==================================================\n");
    printf("   MODULE 2: WATER CONSUMPTION MONITORING\n");
    printf("==================================================\n");

    char consumerID[MAX_ID_LEN];
    getValidatedString("Enter Consumer ID (e.g. CON101): ", consumerID, sizeof(consumerID), 0);

    Consumer consumer;
    if (!getConsumerById(consumerID, &consumer)) {
        printf("[!] Consumer ID '%s' does not exist. Please register the household first.\n", consumerID);
        return;
    }

    printf("Consumer Found: %s (%s)\n", consumer.name, consumer.address);

    char month[MAX_MONTH_LEN];
    getValidatedString("Enter Billing Month (e.g., June): ", month, sizeof(month), 0);

    int year = 2024;
    getValidatedPositiveInt("Enter Billing Year (e.g., 2024): ", &year);

    double prevReading = 0.0;
    if (getLatestReadingForConsumer(consumerID, &prevReading)) {
        printf("Detected previous recorded reading: %.2f KL\n", prevReading);
        printf("1. Use this previous reading (%.2f KL)\n", prevReading);
        printf("2. Enter new previous reading manually\n");
        int opt = 1;
        getValidatedPositiveInt("Select option (1-2): ", &opt);
        if (opt == 2) {
            getValidatedPositiveDouble("Enter Previous Meter Reading (KL): ", &prevReading);
        }
    } else {
        printf("[Notice] No prior meter readings found for this consumer.\n");
        getValidatedPositiveDouble("Enter Initial Previous Reading (KL): ", &prevReading);
    }

    double currReading = 0.0;
    while (1) {
        getValidatedPositiveDouble("Enter Current Meter Reading (KL) : ", &currReading);
        if (currReading < prevReading) {
            printf("[!] Invalid Input: Current reading (%.2f KL) is less than previous reading (%.2f KL)!\n",
                   currReading, prevReading);
            printf("    Water consumption cannot be negative. Please re-enter.\n");
            continue;
        }
        break;
    }

    WaterRecord rec;
    if (recordMeterReading(consumerID, month, year, prevReading, currReading, &rec)) {
        printf("\n==================================================\n");
        printf("         METER READING STORED SUCCESSFULLY\n");
        printf("==================================================\n");
        printf("Record ID            : %s\n", rec.recordID);
        printf("Consumer ID          : %s (%s)\n", consumerID, consumer.name);
        printf("Billing Cycle        : %s, %d\n", rec.month, rec.year);
        printf("Previous Reading     : %.2f KL\n", rec.previousReading);
        printf("Current Reading      : %.2f KL\n", rec.currentReading);
        printf("Total Consumption    : %.2f KL\n", rec.consumptionKL);
        printf("Consumption in Litres: %.0f Litres\n", rec.consumptionLitres);
        printf("Logged Date          : %s\n", rec.recordDate);
        printf("==================================================\n");

        if (rec.consumptionKL > 30.0) {
            printf("[ALERT] High consumption detected (%.2f KL > 30 KL threshold).\n", rec.consumptionKL);
            printf("        Inspect pipelines for simulated leaks or high usage fixtures.\n");
        }
    } else {
        printf("[!] Failed to save meter reading.\n");
    }
}

void displayRecordsForConsumer(const char *consumerID) {
    FILE *fp = fopen(FILE_RECORDS, "r");
    if (fp == NULL) {
        printf("[!] No water consumption records found.\n");
        return;
    }

    printf("\n+----------+-----------+------+------------+------------+-------------+-----------------+\n");
    printf("| RecordID | Month     | Year | Prev (KL)  | Curr (KL)  | Usage (KL)  | Usage (Litres)  |\n");
    printf("+----------+-----------+------+------------+------------+-------------+-----------------+\n");

    char line[512];
    int count = 0;
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512];
        strncpy(temp, line, sizeof(temp));

        char *recId = strtok(temp, "|");
        char *cId = strtok(NULL, "|");
        char *month = strtok(NULL, "|");
        char *yearStr = strtok(NULL, "|");
        char *prevStr = strtok(NULL, "|");
        char *currStr = strtok(NULL, "|");
        char *klStr = strtok(NULL, "|");
        char *lStr = strtok(NULL, "|");

        if (cId && strcmp(cId, consumerID) == 0) {
            printf("| %-8s | %-9s | %-4s | %10.2f | %10.2f | %11.2f | %15.0f |\n",
                   recId ? recId : "-",
                   month ? month : "-",
                   yearStr ? yearStr : "-",
                   prevStr ? atof(prevStr) : 0.0,
                   currStr ? atof(currStr) : 0.0,
                   klStr ? atof(klStr) : 0.0,
                   lStr ? atof(lStr) : 0.0);
            count++;
        }
    }
    printf("+----------+-----------+------+------------+------------+-------------+-----------------+\n");
    printf("Total records found for %s: %d\n", consumerID, count);
    fclose(fp);
}
