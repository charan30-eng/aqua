/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: monitoring.h
 * Description: Header file for water meter reading input and consumption tracking
 * Language: C (C11 Standard)
 * ============================================================================
 */

#ifndef MONITORING_H
#define MONITORING_H

#define MAX_MONTH_LEN 16

/**
 * WaterRecord Structure
 * Stores meter readings and calculated consumption for a consumer per billing cycle.
 */
typedef struct {
    char recordID[16];          // e.g. REC2024-001
    char consumerID[16];        // Foreign key to Consumer
    char month[MAX_MONTH_LEN];  // e.g. June
    int year;                   // e.g. 2024
    double previousReading;     // In Kilolitres (KL)
    double currentReading;      // In Kilolitres (KL)
    double consumptionKL;       // Current - Previous (KL)
    double consumptionLitres;   // consumptionKL * 1000
    char recordDate[16];        // Timestamp
} WaterRecord;

// Prototypes
void monitorWaterConsumption(void);
int recordMeterReading(const char *consumerID, const char *month, int year, 
                       double prevReading, double currReading, WaterRecord *outRecord);
int getLatestReadingForConsumer(const char *consumerID, double *outPrevReading);
void displayRecordsForConsumer(const char *consumerID);
void displayAllWaterRecords(void);

#endif // MONITORING_H
