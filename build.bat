@echo off
setlocal
echo Building AquaBill C Backend (Windows MinGW)...

set CFLAGS=-std=c11 -O2 -Wall -Wextra -Ibackend/include -D_WIN32_WINNT=0x0601
set SRCS=backend/main.c backend/server.c backend/database.c backend/auth.c backend/customer.c backend/meter.c backend/reading.c backend/billing.c backend/billing_api.c backend/payment.c backend/reports.c backend/utils.c backend/crypto.c backend/vendor/mongoose.c backend/vendor/cJSON.c

if exist backend\vendor\sqlite3.c (
    gcc %CFLAGS% -Ibackend/vendor -o backend/aquabill_server.exe %SRCS% backend/vendor/sqlite3.c -lws2_32 -lbcrypt
) else (
    gcc %CFLAGS% -o backend/aquabill_server.exe %SRCS% -lsqlite3 -lws2_32 -lbcrypt
)

if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    exit /b 1
)

echo [OK] Built backend\aquabill_server.exe successfully.
endlocal
