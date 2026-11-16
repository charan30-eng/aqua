CC = gcc
CFLAGS = -std=c11 -O2 -Wall -Wextra -Ibackend/include -D_DEFAULT_SOURCE
LDFLAGS = -lsqlite3 -lm

BACKEND_SRCS = \
	backend/main.c \
	backend/server.c \
	backend/database.c \
	backend/auth.c \
	backend/customer.c \
	backend/meter.c \
	backend/reading.c \
	backend/billing.c \
	backend/billing_api.c \
	backend/payment.c \
	backend/reports.c \
	backend/utils.c \
	backend/crypto.c \
	backend/vendor/mongoose.c \
	backend/vendor/cJSON.c

TEST_SRCS = \
	tests/test_aquabill.c \
	backend/database.c \
	backend/auth.c \
	backend/customer.c \
	backend/meter.c \
	backend/reading.c \
	backend/billing.c \
	backend/billing_api.c \
	backend/payment.c \
	backend/reports.c \
	backend/utils.c \
	backend/crypto.c \
	backend/vendor/mongoose.c \
	backend/vendor/cJSON.c

all: backend/aquabill_server

backend/aquabill_server: $(BACKEND_SRCS)
	$(CC) $(CFLAGS) -o $@ $(BACKEND_SRCS) $(LDFLAGS)

test_bin: $(TEST_SRCS)
	$(CC) $(CFLAGS) -o tests/test_aquabill $(TEST_SRCS) $(LDFLAGS)

clean:
	rm -f backend/aquabill_server tests/test_aquabill
