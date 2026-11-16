/**
 * ============================================================================
 * Project: Smart Water Consumption Monitoring and Billing Simulator
 * File: analytics.h
 * Description: Header file for consumption statistics, ASCII graphs, and leakage alerts
 * Language: C (C11 Standard)
 * ============================================================================
 */

#ifndef ANALYTICS_H
#define ANALYTICS_H

// Prototypes for Analytics (Module 5)
void viewConsumptionAnalytics(void);
void renderAsciiBarChart(const char *labels[], const double values[], int count, double maxVal);

// Prototypes for Leakage & Excess Usage Alerts (Module 6)
void checkLeakageAndExcessAlerts(void);
void displayWaterConservationTips(void);

#endif // ANALYTICS_H
