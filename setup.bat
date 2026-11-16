@echo off
setlocal enabledelayedexpansion
echo ============================================================
echo  AquaBill Windows Setup (MinGW GCC + SQLite3 + Mongoose)
echo ============================================================

where gcc >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] GCC / MinGW not found in PATH.
    echo Install MSYS2 / MinGW-w64 and ensure gcc.exe is in PATH.
    exit /b 1
)

if not exist backend\include mkdir backend\include
if not exist backend\vendor mkdir backend\vendor
if not exist frontend\vendor mkdir frontend\vendor
if not exist database mkdir database

echo [1/3] Checking Mongoose and cJSON sources...
if not exist backend\vendor\mongoose.c (
    curl -fsSL https://raw.githubusercontent.com/cesanta/mongoose/7.16/mongoose.h -o backend\include\mongoose.h
    curl -fsSL https://raw.githubusercontent.com/cesanta/mongoose/7.16/mongoose.c -o backend\vendor\mongoose.c
)
if not exist backend\vendor\cJSON.c (
    curl -fsSL https://raw.githubusercontent.com/DaveGamble/cJSON/v1.7.18/cJSON.h -o backend\include\cJSON.h
    curl -fsSL https://raw.githubusercontent.com/DaveGamble/cJSON/v1.7.18/cJSON.c -o backend\vendor\cJSON.c
)

echo [2/3] Checking SQLite3 amalgamation for MinGW...
if not exist backend\vendor\sqlite3.c (
    echo Please place sqlite3.c and sqlite3.h (SQLite3 amalgamation) into backend\vendor and backend\include,
    echo OR install mingw-w64-x86_64-sqlite3 via MSYS2 pacman.
)

echo [3/3] Setup check complete. Next run: build.bat
endlocal
