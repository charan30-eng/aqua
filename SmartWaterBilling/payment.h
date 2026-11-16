/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: payment.h
 * Description: Header file for bill payment processing and payment transaction history
 * Language: C (C11 Standard)
 * ============================================================================
 */

#ifndef PAYMENT_H
#define PAYMENT_H

#define MAX_MODE_LEN 16

/**
 * Payment Structure
 */
typedef struct {
    char paymentID[16];         // e.g. PAY2024-001
    char billID[16];            // Foreign key to Bill
    char consumerID[16];        // Foreign key to Consumer
    double amountPaid;
    char paymentMode[MAX_MODE_LEN]; // "Cash", "UPI", "Bank Card", "NetBanking"
    char paymentDate[16];
    char receiptNumber[24];
} Payment;

// Prototypes
void managePayments(void);
void displayUnpaidBills(void);
void processBillPayment(void);
void displayPaymentHistory(void);
int savePaymentRecord(const Payment *p);

#endif // PAYMENT_H
