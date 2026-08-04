#!/usr/bin/env bash
# اجرای رابط وب محلی روی لینوکس/مک
set -euo pipefail
cd "$(dirname "$0")"
python3 -m pip install -r requirements.txt
python3 -m minerreport.webapp
