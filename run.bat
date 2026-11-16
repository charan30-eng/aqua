@echo off
setlocal
if not exist backend\aquabill_server.exe (
    call build.bat
    if %errorlevel% neq 0 exit /b 1
)
echo Starting AquaBill C Server on http://localhost:8080 ...
backend\aquabill_server.exe --port 8080 --db database/aquabill.db --web-root frontend
endlocal
