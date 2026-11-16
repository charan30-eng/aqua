/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: consumer.h
 * Description: Header file defining consumer structures and function prototypes
 * Language: C (C11 Standard)
 * ============================================================================
 */

#ifndef CONSUMER_H
#define CONSUMER_H

#define MAX_ID_LEN 16
#define MAX_NAME_LEN 64
#define MAX_ADDR_LEN 128
#define MAX_PHONE_LEN 16

/**
 * Consumer Structure
 * Represents a registered household consumer in the smart water system.
 */
typedef struct {
    char consumerID[MAX_ID_LEN];      // Unique identifier (e.g. CON101)
    char name[MAX_NAME_LEN];          // Full name of the consumer
    char address[MAX_ADDR_LEN];       // Household physical address
    char phoneNumber[MAX_PHONE_LEN];  // Contact phone number
    char registrationDate[16];        // Date of registration (YYYY-MM-DD)
} Consumer;

// Function Prototypes
void registerConsumer(void);
void viewConsumerDetails(void);
void searchConsumerById(const char *searchID);
void displayAllConsumers(void);
int generateNextConsumerId(char *destIdBuffer);
int isConsumerExists(const char *consumerID);
int getConsumerById(const char *consumerID, Consumer *outConsumer);

#endif // CONSUMER_H
