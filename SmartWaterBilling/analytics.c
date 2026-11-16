/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: analytics.c
 * Description: Module 5 & 6 - Consumption analytics, ASCII charts, and leakage alert engine
 * Language: C (C11 Standard)
 * ============================================================================
 */

#include "analytics.h"
#include "billing.h"
#include "consumer.h"
#include "monitoring.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void renderAsciiBarChart(const char *labels[], const double values[], int count, double maxVal) {
    if (count == 0 || maxVal <= 0.0) return;

    printf("\n--- WATER USAGE ASCII BAR CHART (KL) ---\n");
    const int maxBarWidth = 40;

    for (int i = 0; i < count; i++) {
        int barLen = (int)((values[i] / maxVal) * maxBarWidth);
        if (barLen < 1 && values[i] > 0) barLen = 1;

        printf("%-10s | ", labels[i]);
        for (int b = 0; b < barLen; b++) {
            printf("#");
        }
        printf(" %.2f KL (%.0f L)\n", values[i], values[i] * 1000.0);
    }
    printf("           +---------------------------------------->\n");
    printf("Scale: '#' represents proportional volume up to %.1f KL\n", maxVal);
}

void viewConsumptionAnalytics(void) {
    printf("\n==================================================\n");
    printf("       MODULE 5: WATER USAGE ANALYTICS\n");
    printf("==================================================\n");

    char consumerID[MAX_ID_LEN];
    getValidatedString("Enter Consumer ID (or 'ALL' for community overall): ", consumerID, sizeof(consumerID), 0);

    FILE *fp = fopen(FILE_RECORDS, "r");
    if (fp == NULL) {
        printf("[!] No consumption records available to analyze.\n");
        return;
    }

    int filterAll = (strcmp(consumerID, "ALL") == 0 || strcmp(consumerID, "all") == 0);
    if (!filterAll) {
        Consumer c;
        if (!getConsumerById(consumerID, &c)) {
            printf("[!] Consumer '%s' not found.\n", consumerID);
            fclose(fp);
            return;
        }
        printf("Analyzing water consumption records for: %s (%s)\n", c.name, consumerID);
    } else {
        printf("Analyzing aggregated community water consumption...\n");
    }

    char line[512];
    char months[64][16];
    double usages[64];
    int count = 0;
    double totalUsage = 0.0;
    double maxUsage = -1.0;
    char maxMonth[16] = "None";

    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512];
        strncpy(temp, line, sizeof(temp));

        char *recId = strtok(temp, "|");
        char *cId = strtok(NULL, "|");
        char *m = strtok(NULL, "|");
        char *y = strtok(NULL, "|");
        char *prev = strtok(NULL, "|");
        char *curr = strtok(NULL, "|");
        char *klStr = strtok(NULL, "|");
        (void)recId; (void)y; (void)prev; (void)curr;

        if (cId && klStr && (filterAll || strcmp(cId, consumerID) == 0)) {
            double usage = atof(klStr);
            if (count < 64) {
                strncpy(months[count], m ? m : "Month", 16);
                usages[count] = usage;
                count++;
            }
            totalUsage += usage;
            if (usage > maxUsage) {
                maxUsage = usage;
                strncpy(maxMonth, m ? m : "Month", 16);
            }
        }
    }
    fclose(fp);

    if (count == 0) {
        printf("[!] No records found for the requested query.\n");
        return;
    }

    double avgUsage = totalUsage / count;

    printf("\n+-------------------------------------------------------------+\n");
    printf("|                CONSUMPTION ANALYTICS SUMMARY                |\n");
    printf("+-------------------------------------------------------------+\n");
    printf("  Total Records Analyzed     : %-30d |\n", count);
    printf("  Total Water Consumed       : %-10.2f KL  (%10.0f L) |\n", totalUsage, totalUsage * 1000.0);
    printf("  Average Monthly Usage      : %-10.2f KL  (%10.0f L) |\n", avgUsage, avgUsage * 1000.0);
    printf("  Peak Consumption Month     : %-15s (%.2f KL)    |\n", maxMonth, maxUsage);
    if (count >= 2) {
        double currentMonthUsage = usages[count - 1];
        double previousMonthUsage = usages[count - 2];
        double diff = currentMonthUsage - previousMonthUsage;
        double pct = previousMonthUsage > 0 ? (diff / previousMonthUsage) * 100.0 : 0.0;
        printf("  Latest vs Prior Month Delta: %+.2f KL (%+.1f%%)         |\n", diff, pct);
    }
    printf("+-------------------------------------------------------------+\n");

    const char *labelPointers[64];
    for (int i = 0; i < count; i++) {
        labelPointers[i] = months[i];
    }
    renderAsciiBarChart(labelPointers, usages, count, maxUsage > 0 ? maxUsage : 10.0);
}

void displayWaterConservationTips(void) {
    printf("\n======================================================================\n");
    printf("             RECOMMENDED WATER CONSERVATION MEASURES                  \n");
    printf("======================================================================\n");
    printf(" 1. FAUCET AUDIT: A single dripping faucet can waste over 15 Ltrs/day.\n");
    printf("    Inspect and replace worn rubber washers or ceramic cartridges.\n");
    printf(" 2. TOILET FLUSH LEAK TEST: Drop food coloring into the cistern tank.\n");
    printf("    If color seeps into the bowl without flushing, the flapper is leaking.\n");
    printf(" 3. INSTALL AERATORS: Standard aerators reduce flow by 30-50%% without\n");
    printf("    compromising cleaning pressure.\n");
    printf(" 4. SMART IRRIGATION: Water domestic gardens during early morning or\n");
    printf("    late evening to minimize evaporative loss.\n");
    printf(" 5. RAINWATER HARVESTING: Capture rooftop runoff during monsoon periods.\n");
    printf("======================================================================\n");
}

void checkLeakageAndExcessAlerts(void) {
    printf("\n==================================================\n");
    printf(" MODULE 6: WATER LEAKAGE & EXCESS USAGE ALERTS\n");
    printf("==================================================\n");
    printf("[SIMULATION NOTICE] Alerts are generated via heuristic delta analysis\n");
    printf("comparing meter volume against configurable per-household thresholds.\n");
    printf("--------------------------------------------------\n");

    TariffConfig tariff = getTariffConfig();
    double threshold = tariff.leakageThresholdKL; // 30.0 KL

    FILE *fp = fopen(FILE_RECORDS, "r");
    if (fp == NULL) {
        printf("[!] No water consumption records found to inspect.\n");
        return;
    }

    char line[512];
    int alertCount = 0;

    printf("\nScanning all consumer meter records against threshold (%.2f KL)...\n", threshold);
    printf("+------------+-----------+------+------------+---------------+---------------------------------+\n");
    printf("| ConsumerID | Month     | Year | Usage (KL) | Excess (KL)   | Alert Diagnosis                 |\n");
    printf("+------------+-----------+------+------------+---------------+---------------------------------+\n");

    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512];
        strncpy(temp, line, sizeof(temp));

        char *recId = strtok(temp, "|");
        char *cId = strtok(NULL, "|");
        char *m = strtok(NULL, "|");
        char *y = strtok(NULL, "|");
        char *prev = strtok(NULL, "|");
        char *curr = strtok(NULL, "|");
        char *klStr = strtok(NULL, "|");
        (void)recId; (void)prev; (void)curr;

        if (cId && klStr) {
            double usage = atof(klStr);
            if (usage > threshold) {
                double excess = usage - threshold;
                char diagnosis[64];
                if (usage > threshold * 1.5) {
                    strcpy(diagnosis, "CRITICAL: Probable continuous pipe leak");
                } else {
                    strcpy(diagnosis, "WARNING: Abnormal high consumption");
                }

                printf("| %-10s | %-9s | %-4s | %10.2f | %13.2f | %-31s |\n",
                       cId, m ? m : "-", y ? y : "-", usage, excess, diagnosis);
                alertCount++;
            }
        }
    }
    fclose(fp);
    printf("+------------+-----------+------+------------+---------------+---------------------------------+\n");

    if (alertCount == 0) {
        printf("[STATUS: NORMAL] All monitored households are operating within standard consumption limits.\n");
    } else {
        printf("[!] Found %d anomalous consumption instance(s) requiring attention!\n", alertCount);
        displayWaterConservationTips();
    }
}
