#ifndef AQUABILL_BILLING_H
#define AQUABILL_BILLING_H

#include <stdbool.h>
#include <stdint.h>

typedef enum {
    TARIFF_MODE_FLAT = 0,
    TARIFF_MODE_SLAB = 1
} tariff_mode_t;

typedef struct {
    int64_t min_kl;       /* inclusive */
    int64_t max_kl;       /* inclusive; -1 means unbounded */
    int64_t rate_paise;   /* rate per KL in integer paise */
} tariff_slab_t;

typedef struct {
    tariff_mode_t mode;
    int64_t rate_per_kl_paise;   /* used in flat mode */
    int64_t fixed_charge_paise;  /* fixed service charge in integer paise */
    int64_t tax_bps;             /* basis points: 500 = 5.00%, 0 = 0.00% */
    char slab_config[256];       /* e.g. "0-10:500,11-20:800,21-30:1200,31+:1500" */
} tariff_rule_t;

typedef struct {
    int64_t consumption_kl;
    int64_t water_charge_paise;
    int64_t service_charge_paise;
    int64_t tax_amount_paise;
    int64_t total_amount_paise;
} bill_calc_result_t;

typedef enum {
    BILL_CALC_OK = 0,
    BILL_CALC_ERR_INVALID_READING = -1,
    BILL_CALC_ERR_INVALID_TARIFF = -2,
    BILL_CALC_ERR_OVERFLOW = -3
} bill_calc_status_t;

/* Pure fixed-point integer billing engine (no floating point rounding drift). */
bill_calc_status_t billing_calculate(
    int64_t previous_reading_kl,
    int64_t current_reading_kl,
    const tariff_rule_t *tariff,
    bill_calc_result_t *out_result
);

/* Parses slab string like "0-10:500,11-20:800,21+:1200" (rates in paise). */
int billing_parse_slabs(const char *slab_config, tariff_slab_t *slabs, int max_slabs);

#endif
