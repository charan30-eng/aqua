/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: file_manager.c
 * Description: Implementation of safe file handling and console I/O helpers
 * Language: C (C11 Standard)
 * ============================================================================
 */

#include "file_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <sys/stat.h>

#ifdef _WIN32
    #include <direct.h>
    #define CREATE_DIR(d) _mkdir(d)
#else
    #define CREATE_DIR(d) mkdir(d, 0777)
#endif

void initializeDataDirectories(void) {
    CREATE_DIR("data");

    // Ensure initial files exist so opening them for reading won't fail
    const char *files[] = {FILE_CONSUMERS, FILE_RECORDS, FILE_BILLS, FILE_PAYMENTS};
    for (int i = 0; i < 4; i++) {
        FILE *fp = fopen(files[i], "a");
        if (fp != NULL) {
            fclose(fp);
        }
    }
}

void trimNewline(char *str) {
    if (str == NULL) return;
    size_t len = strlen(str);
    while (len > 0 && (str[len - 1] == '\n' || str[len - 1] == '\r')) {
        str[len - 1] = '\0';
        len--;
    }
}

void clearInputBuffer(void) {
    int c;
    while ((c = getchar()) != '\n' && c != EOF) {
        // discard
    }
}

int getValidatedString(const char *prompt, char *buffer, int maxLen, int allowEmpty) {
    while (1) {
        printf("%s", prompt);
        if (fgets(buffer, maxLen, stdin) == NULL) {
            return 0;
        }
        trimNewline(buffer);

        if (!allowEmpty && strlen(buffer) == 0) {
            printf("[!] Error: Input cannot be empty. Please try again.\n");
            continue;
        }

        // Check for delimiter character in string
        if (strchr(buffer, '|') != NULL) {
            printf("[!] Error: Character '|' is reserved. Please avoid using it.\n");
            continue;
        }

        return 1;
    }
}

int getValidatedPositiveInt(const char *prompt, int *outValue) {
    char temp[64];
    while (1) {
        printf("%s", prompt);
        if (fgets(temp, sizeof(temp), stdin) == NULL) {
            return 0;
        }
        trimNewline(temp);

        if (strlen(temp) == 0) {
            printf("[!] Error: Please enter a valid number.\n");
            continue;
        }

        char *endptr;
        long val = strtol(temp, &endptr, 10);
        if (*endptr != '\0' || val < 0) {
            printf("[!] Error: Please enter a non-negative whole integer.\n");
            continue;
        }

        *outValue = (int)val;
        return 1;
    }
}

int getValidatedPositiveDouble(const char *prompt, double *outValue) {
    char temp[64];
    while (1) {
        printf("%s", prompt);
        if (fgets(temp, sizeof(temp), stdin) == NULL) {
            return 0;
        }
        trimNewline(temp);

        if (strlen(temp) == 0) {
            printf("[!] Error: Please enter a valid numeric value.\n");
            continue;
        }

        char *endptr;
        double val = strtod(temp, &endptr);
        if (*endptr != '\0' || val < 0.0) {
            printf("[!] Error: Please enter a non-negative numeric reading.\n");
            continue;
        }

        *outValue = val;
        return 1;
    }
}

int appendLineToFile(const char *filename, const char *line) {
    FILE *fp = fopen(filename, "a");
    if (fp == NULL) {
        printf("[!] File System Error: Unable to open '%s' for writing.\n", filename);
        return 0;
    }
    fprintf(fp, "%s\n", line);
    fclose(fp);
    return 1;
}
