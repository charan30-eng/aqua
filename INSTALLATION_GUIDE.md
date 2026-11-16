# AquaBill Installation & Execution Guide

## 1. Prerequisites

### Linux (Debian / Ubuntu)
- `gcc` (C11 compatible)
- `libsqlite3-dev` and `sqlite3`
```bash
sudo apt-get update
sudo apt-get install -y gcc libsqlite3-dev sqlite3
```

### Windows (MinGW-w64 / MSYS2)
1. Install **MSYS2** (`https://www.msys2.org/`) and open the **MSYS2 UCRT64** or **MINGW64** terminal:
   ```bash
   pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-sqlite3
   ```
2. Ensure `C:\msys64\mingw64\bin` is in your Windows `PATH`.

---

## 2. Building the C Backend

### Linux / macOS
```bash
chmod +x build.sh
./build.sh
```
This compiles `backend/aquabill_server` with `-std=c11 -O2 -Wall -Wextra`.

### Windows
```bat
setup.bat
build.bat
```
This produces `backend\aquabill_server.exe`.

---

## 3. Running AquaBill Standalone (Pure C + SQLite3)

### Linux / macOS
```bash
./backend/aquabill_server --port 8080 --db database/aquabill.db --web-root frontend
```
Open `http://localhost:8080` in your browser.

### Windows
```bat
run.bat
```
Open `http://localhost:8080` in your browser.

On first startup, the C server automatically:
1. Initializes `database/aquabill.db` using `database/schema.sql` if tables do not yet exist.
2. Seeds 1 dev administrator, 12 sample customers, 12 meters, 4 billing periods of readings, 3 tariff schedules, bills, and payments **only if `users` is empty** (subsequent restarts preserve all data).

---

## 4. Running via AI Studio Preview Gateway (Port 3000)

```bash
npm run dev
```
This starts `server.ts` on port `3000`, spawns `./backend/aquabill_server` on port `8080`, serves `frontend/` static assets, and forwards all `/api/*` requests directly to the C Mongoose backend.

---

## 5. Running the C Unit & Database Test Suite

```bash
gcc -std=c11 -O2 -Wall -Wextra -Ibackend/include -D_DEFAULT_SOURCE -o tests/test_aquabill \
  tests/test_aquabill.c backend/database.c backend/auth.c backend/customer.c \
  backend/meter.c backend/reading.c backend/billing.c backend/billing_api.c \
  backend/payment.c backend/reports.c backend/utils.c backend/crypto.c \
  backend/vendor/mongoose.c backend/vendor/cJSON.c -lsqlite3 -lm
./tests/test_aquabill
```
