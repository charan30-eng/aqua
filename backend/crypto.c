#include "crypto.h"
#include "mongoose.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void bytes_to_hex(const uint8_t *bytes, size_t len, char *out_hex, size_t out_sz) {
    static const char hex[] = "0123456789abcdef";
    if (!out_hex || out_sz == 0) return;
    size_t max_bytes = (out_sz - 1) / 2;
    size_t n = len < max_bytes ? len : max_bytes;
    for (size_t i = 0; i < n; i++) {
        out_hex[i * 2]     = hex[(bytes[i] >> 4) & 0xF];
        out_hex[i * 2 + 1] = hex[bytes[i] & 0xF];
    }
    out_hex[n * 2] = '\0';
}

static bool hex_to_bytes(const char *hex, uint8_t *out_bytes, size_t expected_len) {
    if (!hex || strlen(hex) != expected_len * 2) return false;
    for (size_t i = 0; i < expected_len; i++) {
        unsigned int v = 0;
        if (sscanf(hex + i * 2, "%2x", &v) != 1) return false;
        out_bytes[i] = (uint8_t)v;
    }
    return true;
}

static void pbkdf2_hmac_sha256(const char *password, size_t pass_len,
                               const uint8_t *salt, size_t salt_len,
                               int iterations, uint8_t out_dk[HASH_BYTES]) {
    uint8_t u[32];
    uint8_t t[32];
    uint8_t msg[128];
    uint8_t pass_buf[256];

    if (pass_len > sizeof(pass_buf)) pass_len = sizeof(pass_buf);
    if (salt_len + 4 > sizeof(msg)) salt_len = sizeof(msg) - 4;

    memcpy(pass_buf, password, pass_len);
    memcpy(msg, salt, salt_len);
    /* Block index = 1 (big-endian 32-bit) */
    msg[salt_len]     = 0;
    msg[salt_len + 1] = 0;
    msg[salt_len + 2] = 0;
    msg[salt_len + 3] = 1;

    mg_hmac_sha256(u, pass_buf, pass_len, msg, salt_len + 4);
    memcpy(t, u, 32);

    for (int iter = 1; iter < iterations; iter++) {
        uint8_t next_u[32];
        mg_hmac_sha256(next_u, pass_buf, pass_len, u, 32);
        memcpy(u, next_u, 32);
        for (int b = 0; b < 32; b++) {
            t[b] ^= u[b];
        }
    }
    memcpy(out_dk, t, HASH_BYTES);
}

static bool constant_time_equal(const uint8_t *a, const uint8_t *b, size_t len) {
    uint8_t diff = 0;
    for (size_t i = 0; i < len; i++) {
        diff |= (uint8_t)(a[i] ^ b[i]);
    }
    return diff == 0;
}

bool crypto_hash_password(const char *password, char *out_hash, size_t out_sz) {
    if (!password || !out_hash || out_sz < PASSWORD_HASH_BUFSZ) return false;
    uint8_t salt[SALT_BYTES];
    uint8_t dk[HASH_BYTES];
    char salt_hex[SALT_BYTES * 2 + 1];
    char dk_hex[HASH_BYTES * 2 + 1];

    if (!mg_random(salt, sizeof(salt))) {
        return false;
    }

    pbkdf2_hmac_sha256(password, strlen(password), salt, sizeof(salt), PBKDF2_ITERATIONS, dk);
    bytes_to_hex(salt, sizeof(salt), salt_hex, sizeof(salt_hex));
    bytes_to_hex(dk, sizeof(dk), dk_hex, sizeof(dk_hex));

    int written = snprintf(out_hash, out_sz, "pbkdf2_sha256$%d$%s$%s",
                           PBKDF2_ITERATIONS, salt_hex, dk_hex);
    return written > 0 && (size_t)written < out_sz;
}

bool crypto_verify_password(const char *password, const char *stored_hash) {
    if (!password || !stored_hash) return false;
    int iterations = 0;
    char salt_hex[65] = {0};
    char dk_hex[65] = {0};

    if (sscanf(stored_hash, "pbkdf2_sha256$%d$%64[^$]$%64s", &iterations, salt_hex, dk_hex) != 3) {
        return false;
    }
    if (iterations < 1000 || iterations > 200000) return false;

    uint8_t salt[SALT_BYTES];
    uint8_t expected_dk[HASH_BYTES];
    uint8_t actual_dk[HASH_BYTES];

    if (!hex_to_bytes(salt_hex, salt, SALT_BYTES)) return false;
    if (!hex_to_bytes(dk_hex, expected_dk, HASH_BYTES)) return false;

    pbkdf2_hmac_sha256(password, strlen(password), salt, SALT_BYTES, iterations, actual_dk);
    return constant_time_equal(actual_dk, expected_dk, HASH_BYTES);
}

bool crypto_generate_token(char *out_token, size_t out_sz) {
    if (!out_token || out_sz < 65) return false;
    uint8_t buf[32];
    if (!mg_random(buf, sizeof(buf))) return false;
    bytes_to_hex(buf, sizeof(buf), out_token, out_sz);
    return true;
}

void crypto_sha256_hex(const char *input, size_t len, char *out_hex, size_t out_sz) {
    mg_sha256_ctx ctx;
    uint8_t digest[32];
    mg_sha256_init(&ctx);
    mg_sha256_update(&ctx, (const unsigned char *)input, len);
    mg_sha256_final(digest, &ctx);
    bytes_to_hex(digest, sizeof(digest), out_hex, out_sz);
}
