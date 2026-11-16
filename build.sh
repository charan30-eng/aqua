#!/usr/bin/env bash
set -euo pipefail

CC="${CC:-gcc}"
CFLAGS="-std=c11 -O2 -Wall -Wextra -Ibackend/include -D_DEFAULT_SOURCE"

$CC $CFLAGS -o backend/aquabill_server \
  backend/main.c backend/server.c backend/database.c backend/auth.c \
  backend/customer.c backend/meter.c backend/reading.c backend/billing.c \
  backend/billing_api.c backend/payment.c backend/reports.c backend/utils.c \
  backend/crypto.c backend/vendor/mongoose.c backend/vendor/cJSON.c \
  -lsqlite3 -lm

echo "[OK] Built backend/aquabill_server"
