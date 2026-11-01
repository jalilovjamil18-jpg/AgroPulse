@echo off
cd /d "%~dp0frontend"
echo AGROPULSE FRONTEND http://127.0.0.1:3000
set "NODE_OPTIONS=--max-old-space-size=1024"
call npm run dev
pause
