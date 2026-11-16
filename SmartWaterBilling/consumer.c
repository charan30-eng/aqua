/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: consumer.c
 * Description: Module 1 - Consumer registration, search, and record viewing
 * Language: C (C11 Standard)
 * ============================================================================
 */

#include "consumer.h"
#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

int isConsumerExists(const char *consumerID) {
    FILE *fp = fopen(FILE_CONSUMERS, "r");
    if (fp == NULL) return 0;

    char line[256];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char *id = strtok(line, "|");
        if (id != NULL && strcmp(id, consumerID) == 0) {
            fclose(fp);
            return 1;
        }
    }
    fclose(fp);
    return 0;
}

int getConsumerById(const char *consumerID, Consumer *outConsumer) {
    FILE *fp = fopen(FILE_CONSUMERS, "r");
    if (fp == NULL) return 0;

    char line[512];
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char temp[512];
        strncpy(temp, line, sizeof(temp));
        temp[sizeof(temp) - 1] = '\0';

        char *token = strtok(temp, "|");
        if (token != NULL && strcmp(token, consumerID) == 0) {
            strncpy(outConsumer->consumerID, token, MAX_ID_LEN);

            token = strtok(NULL, "|");
            if (token) strncpy(outConsumer->name, token, MAX_NAME_LEN);

            token = strtok(NULL, "|");
            if (token) strncpy(outConsumer->address, token, MAX_ADDR_LEN);

            token = strtok(NULL, "|");
            if (token) strncpy(outConsumer->phoneNumber, token, MAX_PHONE_LEN);

            token = strtok(NULL, "|");
            if (token) strncpy(outConsumer->registrationDate, token, sizeof(outConsumer->registrationDate));
            else strcpy(outConsumer->registrationDate, "2024-06-01");

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
    if (fp != NULL) {
        char line[256];
        while (fgets(line, sizeof(line), fp)) {
            char *id = strtok(line, "|");
            if (id != NULL && strncmp(id, "CON", 3) == 0) {
                int num = atoi(id + 3);
                if (num > maxNum) {
                    maxNum = num;
                }
            }
        }
        fclose(fp);
    }
    sprintf(destIdBuffer, "CON%d", maxNum + 1);
    return maxNum + 1;
}

void registerConsumer(void) {
    printf("\n==================================================\n");
    printf("         MODULE 1: REGISTER NEW CONSUMER\n");
    printf("==================================================\n");

    Consumer c;
    generateNextConsumerId(c.consumerID);
    printf("Generated Consumer ID : %s\n", c.consumerID);

    getValidatedString("Enter Household / Consumer Name: ", c.name, sizeof(c.name), 0);
    getValidatedString("Enter Household Address        : ", c.address, sizeof(c.address), 0);
    
    while (1) {
        getValidatedString("Enter 10-Digit Contact Phone   : ", c.phoneNumber, sizeof(c.phoneNumber), 0);
        // Basic phone number validation
        int valid = 1;
        size_t len = strlen(c.phoneNumber);
        if (len < 7 || len > 15) {
            valid = 0;
        }
        for (size_t i = 0; i < len; i++) {
            if (c.phoneNumber[i] != '+' && c.phoneNumber[i] != '-' && 
                (c.phoneNumber[i] < '0' || c.phoneNumber[i] > '9')) {
                valid = 0;
                break;
            }
        }
        if (!valid) {
            printf("[!] Invalid phone format. Please enter numeric digits.\n");
            continue;
        }
        break;
    }

    // Capture current date
    time_t t = time(NULL);
    struct tm tm = *localtime(&t);
    sprintf(c.registrationDate, "%04d-%02d-%02d", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday);

    // Save record
    char recordLine[512];
    snprintf(recordLine, sizeof(recordLine), "%s|%s|%s|%s|%s",
             c.consumerID, c.name, c.address, c.phoneNumber, c.registrationDate);

    if (appendLineToFile(FILE_CONSUMERS, recordLine)) {
        printf("\n[SUCCESS] Consumer registered successfully!\n");
        printf("--------------------------------------------------\n");
        printf("Consumer ID : %s\n", c.consumerID);
        printf("Name        : %s\n", c.name);
        printf("Address     : %s\n", c.address);
        printf("Phone       : %s\n", c.phoneNumber);
        printf("Reg. Date   : %s\n", c.registrationDate);
        printf("--------------------------------------------------\n");
    } else {
        printf("[!] Failed to persist consumer record.\n");
    }
}

void viewConsumerDetails(void) {
    printf("\n==================================================\n");
    printf("         MODULE 1: VIEW CONSUMER DETAILS\n");
    printf("==================================================\n");
    printf("1. View All Registered Consumers\n");
    printf("2. Search Consumer By ID\n");
    printf("--------------------------------------------------\n");

    int choice;
    if (!getValidatedPositiveInt("Enter option (1-2): ", &choice)) return;

    if (choice == 1) {
        displayAllConsumers();
    } else if (choice == 2) {
        char searchID[MAX_ID_LEN];
        getValidatedString("Enter Consumer ID (e.g., CON101): ", searchID, sizeof(searchID), 0);
        searchConsumerById(searchID);
    } else {
        printf("[!] Invalid option selected.\n");
    }
}

void searchConsumerById(const char *searchID) {
    Consumer c;
    if (getConsumerById(searchID, &c)) {
        printf("\n+-------------------------------------------------------------+\n");
        printf("|                    CONSUMER INFORMATION                     |\n");
        printf("+-------------------------------------------------------------+\n");
        printf("  Consumer ID  : %-43s |\n", c.consumerID);
        printf("  Full Name    : %-43s |\n", c.name);
        printf("  Address      : %-43s |\n", c.address);
        printf("  Phone Number : %-43s |\n", c.phoneNumber);
        printf("  Date Joined  : %-43s |\n", c.registrationDate);
        printf("+-------------------------------------------------------------+\n");
    } else {
        printf("\n[!] Consumer '%s' not found in database.\n", searchID);
    }
}

void displayAllConsumers(void) {
    FILE *fp = fopen(FILE_CONSUMERS, "r");
    if (fp == NULL) {
        printf("[!] No consumer records found. Please register first.\n");
        return;
    }

    printf("\n+----------+----------------------+-----------------------------+-----------------+\n");
    printf("| ID       | Full Name            | Address                     | Phone           |\n");
    printf("+----------+----------------------+-----------------------------+-----------------+\n");

    char line[512];
    int count = 0;
    while (fgets(line, sizeof(line), fp)) {
        trimNewline(line);
        char *id = strtok(line, "|");
        char *name = strtok(NULL, "|");
        char *addr = strtok(NULL, "|");
        char *phone = strtok(NULL, "|");

        if (id && name && addr && phone) {
            printf("| %-8s | %-20.20s | %-27.27s | %-15s |\n", id, name, addr, phone);
            count++;
        }
    }
    printf("+----------+----------------------+-----------------------------+-----------------+\n");
    printf("Total registered consumers: %d\n", count);
    fclose(fp);
}
