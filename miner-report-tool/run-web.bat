@echo off
REM اجرای رابط وب محلی روی ویندوز: نصب پیش‌نیازها و باز کردن مرورگر
cd /d "%~dp0"
python -m pip install -r requirements.txt
start "" http://127.0.0.1:8765
python -m minerreport.webapp
pause
