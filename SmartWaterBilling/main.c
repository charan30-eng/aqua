/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: main.c
 * Description: Application entry point and interactive console menu dispatcher
 * Language: C (C11 Standard)
 * Compiler: GCC
 * ============================================================================
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
    printf("\n==============================================\n");
    printf("       SMART WATER MANAGEMENT SYSTEM          \n");
    printf("==============================================\n");
    printf(" 1. Register New Consumer\n");
    printf(" 2. View Consumer Details\n");
    printf(" 3. Monitor Water Consumption\n");
    printf(" 4. Calculate Water Bill (Tariff Simulator)\n");
    printf(" 5. Generate Monthly Bill\n");
    printf(" 6. View Consumption Analytics\n");
    printf(" 7. Check Leakage / Excess Usage Alerts\n");
    printf(" 8. Manage Payments\n");
    printf(" 9. View Billing History\n");
    printf(" 10. Exit\n");
    printf("==============================================\n");
}

int main(void) {
    // Initialize required files and folder structure
    initializeDataDirectories();

    printf("\n");
    printf("****************************************************************\n");
    printf("*   WELCOME TO SMART WATER MONITORING & BILLING SIMULATOR      *\n");
    printf("*   Developed in C11 for Academic Simulation & Municipal Tech  *\n");
    printf("****************************************************************\n");

    int choice = 0;
    while (1) {
        displayMainMenu();
        if (!getValidatedPositiveInt("Enter your choice (1-10): ", &choice)) {
            continue;
        }

        switch (choice) {
            case 1:
                registerConsumer();
                break;
            case 2:
                viewConsumerDetails();
                break;
            case 3:
                monitorWaterConsumption();
                break;
            case 4:
                calculateWaterBillInteractive();
                break;
            case 5:
                generateMonthlyBill();
                break;
            case 6:
                viewConsumptionAnalytics();
                break;
            case 7:
                checkLeakageAndExcessAlerts();
                break;
            case 8:
                managePayments();
                break;
            case 9:
                displayBillingHistory();
                break;
            case 10:
                printf("\n========================================================\n");
                printf(" Thank you for using Smart Water Management System!\n");
                printf(" Conserve Water, Conserve Life. Goodbye.\n");
                printf("========================================================\n\n");
                exit(0);
            default:
                printf("[!] Invalid choice (%d). Please enter a number between 1 and 10.\n", choice);
                break;
        }
    }

    return 0;
}
