#include "billing.h"
#include <ctype.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef _WIN32
#define strtok_r strtok_s
#endif

int billing_parse_slabs(const char *slab_config, tariff_slab_t *slabs, int max_slabs) {
    if (!slab_config || !slabs || max_slabs <= 0) return 0;
    char buf[256];
    strncpy(buf, slab_config, sizeof(buf) - 1);
    buf[sizeof(buf) - 1] = '\0';

    int count = 0;
    char *saveptr = NULL;
    char *token = strtok_r(buf, ",", &saveptr);
    while (token && count < max_slabs) {
        while (*token && isspace((unsigned char)*token)) token++;
        long long min_kl = 0, max_kl = -1, rate = 0;

        char *plus = strchr(token, '+');
        if (plus) {
            if (sscanf(token, "%lld+:%lld", &min_kl, &rate) == 2 && min_kl >= 0 && rate >= 0) {
                slabs[count].min_kl = (int64_t)min_kl;
                slabs[count].max_kl = -1;
                slabs[count].rate_paise = (int64_t)rate;
                count++;
            } else {
                return -1;
            }
        } else {
            if (sscanf(token, "%lld-%lld:%lld", &min_kl, &max_kl, &rate) == 3 &&
                min_kl >= 0 && max_kl >= min_kl && rate >= 0) {
                slabs[count].min_kl = (int64_t)min_kl;
                slabs[count].max_kl = (int64_t)max_kl;
                slabs[count].rate_paise = (int64_t)rate;
                count++;
            } else {
                return -1;
            }
        }
        token = strtok_r(NULL, ",", &saveptr);
    }
    return count;
}

bill_calc_status_t billing_calculate(
    int64_t previous_reading_kl,
    int64_t current_reading_kl,
    const tariff_rule_t *tariff,
    bill_calc_result_t *out_result
) {
    if (!tariff || !out_result) return BILL_CALC_ERR_INVALID_TARIFF;
    if (previous_reading_kl < 0 || current_reading_kl < previous_reading_kl) {
        return BILL_CALC_ERR_INVALID_READING;
    }
    if (tariff->rate_per_kl_paise < 0 || tariff->fixed_charge_paise < 0 ||
        tariff->tax_bps < 0 || tariff->tax_bps > 10000) {
        return BILL_CALC_ERR_INVALID_TARIFF;
    }

    int64_t consumption = current_reading_kl - previous_reading_kl;
    int64_t water_charge = 0;

    if (tariff->mode == TARIFF_MODE_FLAT) {
        if (consumption > 0 && tariff->rate_per_kl_paise > INT64_MAX / consumption) {
            return BILL_CALC_ERR_OVERFLOW;
        }
        water_charge = consumption * tariff->rate_per_kl_paise;
    } else if (tariff->mode == TARIFF_MODE_SLAB) {
        tariff_slab_t slabs[16];
        int n_slabs = billing_parse_slabs(tariff->slab_config, slabs, 16);
        if (n_slabs <= 0) {
            return BILL_CALC_ERR_INVALID_TARIFF;
        }
        int64_t remaining = consumption;
        int64_t covered_up_to = 0;
        for (int i = 0; i < n_slabs && remaining > 0; i++) {
            int64_t units_in_slab = 0;
            if (slabs[i].max_kl < 0) {
                units_in_slab = remaining;
            } else {
                int64_t band_top = slabs[i].max_kl;
                int64_t band_width = band_top - covered_up_to;
                if (band_width < 0) band_width = 0;
                units_in_slab = remaining < band_width ? remaining : band_width;
                covered_up_to = band_top;
            }
            if (units_in_slab > 0) {
                water_charge += units_in_slab * slabs[i].rate_paise;
                remaining -= units_in_slab;
            }
        }
        if (remaining > 0) {
            /* Fallback rate if slabs did not have unbounded top tier */
            water_charge += remaining * tariff->rate_per_kl_paise;
        }
    } else {
        return BILL_CALC_ERR_INVALID_TARIFF;
    }

    int64_t service_charge = tariff->fixed_charge_paise;
    int64_t subtotal = water_charge + service_charge;
    /* Rounded half-up integer tax from basis points (10000 bps = 100%) */
    int64_t tax_amount = (subtotal * tariff->tax_bps + 5000) / 10000;
    int64_t total_amount = subtotal + tax_amount;

    out_result->consumption_kl = consumption;
    out_result->water_charge_paise = water_charge;
    out_result->service_charge_paise = service_charge;
    out_result->tax_amount_paise = tax_amount;
    out_result->total_amount_paise = total_amount;
    return BILL_CALC_OK;
}
