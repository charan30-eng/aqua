# ==============================================================================
# Makefile: Smart Water Consumption Monitoring and Billing Simulator
# Target: smart_water_billing (Executable)
# Compiler: GCC (C11 Standard)
# Compatible: Windows (MinGW / MSYS2 / WSL) and Linux / macOS
# ==============================================================================

CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -pedantic -O2
SRCS = main.c consumer.c monitoring.c billing.c analytics.c payment.c file_manager.c
OBJS = $(SRCS:.c=.o)
TARGET = smart_water_billing

ifeq ($(OS),Windows_NT)
    TARGET_BIN = $(TARGET).exe
    RM = del /Q /F
else
    TARGET_BIN = $(TARGET)
    RM = rm -f
endif

all: $(TARGET_BIN)

$(TARGET_BIN): $(OBJS)
	$(CC) $(CFLAGS) -o $(TARGET_BIN) $(OBJS)
	@echo Build completed successfully: $(TARGET_BIN)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	$(RM) $(OBJS) $(TARGET_BIN)
	@echo Cleaned build artifacts.

run: $(TARGET_BIN)
	./$(TARGET_BIN)

.PHONY: all clean run
