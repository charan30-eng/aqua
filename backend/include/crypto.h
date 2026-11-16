#ifndef AQUABILL_CRYPTO_H
#define AQUABILL_CRYPTO_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#define PBKDF2_ITERATIONS 10000
#define SALT_BYTES 16
#define HASH_BYTES 32
/* Format: pbkdf2_sha256$<iter>$<32-hex-salt>$<64-hex-hash> */
#define PASSWORD_HASH_BUFSZ 128

bool crypto_hash_password(const char *password, char *out_hash, size_t out_sz);
bool crypto_verify_password(const char *password, const char *stored_hash);
bool crypto_generate_token(char *out_token, size_t out_sz);
void crypto_sha256_hex(const char *input, size_t len, char *out_hex, size_t out_sz);

#endif
