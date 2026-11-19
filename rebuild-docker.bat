@echo off
REM Rebuilds and restarts the Job Labs prototype Docker container (http://localhost:8081)
cd /d "%~dp0"
echo Rebuilding Job Labs prototype container...
docker compose up -d --build
echo.
if %errorlevel%==0 (echo Done - open http://localhost:8081) else (echo Build FAILED - see the messages above)
echo.
pause
