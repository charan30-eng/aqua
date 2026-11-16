/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: file_manager.h
 * Description: Header for file handling, record persistence, and safe I/O
 * Language: C (C11 Standard)
 * ============================================================================
 */

#ifndef FILE_MANAGER_H
#define FILE_MANAGER_H

#include <stdio.h>

#define FILE_CONSUMERS    "data/consumers.txt"
#define FILE_RECORDS      "data/water_records.txt"
#define FILE_BILLS        "data/bills.txt"
#define FILE_PAYMENTS     "data/payments.txt"
#define FILE_TARIFF       "data/tariff_config.txt"

// Delimiter used for robust file storage (pipe delimiter handles spaces in addresses)
#define RECORD_DELIMITER  "|"

// Prototypes
void initializeDataDirectories(void);
int appendLineToFile(const char *filename, const char *line);
void trimNewline(char *str);
void clearInputBuffer(void);
int getValidatedString(const char *prompt, char *buffer, int maxLen, int allowEmpty);
int getValidatedPositiveInt(const char *prompt, int *outValue);
int getValidatedPositiveDouble(const char *prompt, double *outValue);

#endif // FILE_MANAGER_H
