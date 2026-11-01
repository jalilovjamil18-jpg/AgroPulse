@echo off
cd /d "%~dp0backend"
if not exist .venv\Scripts\python.exe (echo Avval setup_windows.bat ni ishga tushiring. & pause & exit /b 1)
echo AGROPULSE DJANGO API http://127.0.0.1:8000/api/v1/health/
call .venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
pause
