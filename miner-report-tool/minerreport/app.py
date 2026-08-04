"""اجرای برنامه به‌صورت یک پنجره دسکتاپ (همان رابط وب، بدون نوار مرورگر)."""

from __future__ import annotations

import shutil
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

from .webapp import app
from .workspace import ensure_workspace

HOST = "127.0.0.1"
PORT = 8765
TITLE = "گزارش تخلیه اطلاعاتی ماینر"
WINDOW_SIZE = (1200, 850)

_CHROME_CANDIDATES = (
    "chrome",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "msedge",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
)


def _serve(port: int) -> None:
    app.run(host=HOST, port=port, debug=False, use_reloader=False, threaded=True)


def free_port(start: int = PORT, tries: int = 20) -> int:
    """نخستین پورت آزاد (اگر نسخه‌ای از برنامه در حال اجرا باشد)."""
    for offset in range(tries):
        with socket.socket() as probe:
            if probe.connect_ex((HOST, start + offset)) != 0:
                return start + offset
    raise RuntimeError("پورت آزادی پیدا نشد")


def wait_for_server(port: int, timeout: float = 20.0) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        with socket.socket() as probe:
            probe.settimeout(0.5)
            if probe.connect_ex((HOST, port)) == 0:
                return True
        time.sleep(0.2)
    return False


def find_chrome() -> str | None:
    """مسیر کروم/کرومیوم/اج برای باز کردن پنجره بدون نوار مرورگر."""
    for candidate in _CHROME_CANDIDATES:
        if candidate.lower().endswith(".exe"):
            if Path(candidate).exists():
                return candidate
        else:
            found = shutil.which(candidate)
            if found:
                return found
    return None


def open_window(url: str) -> None:
    """اولویت: پنجره اپلیکیشنی کروم/اج → pywebview → مرورگر پیش‌فرض.

    تا زمانی که پنجره باز است بازنمی‌گردد؛ بستن پنجره = پایان برنامه.
    """
    chrome = find_chrome()
    if chrome:
        profile = Path.home() / ".minerreport-window"
        subprocess.run(
            [
                chrome,
                f"--app={url}",
                f"--window-size={WINDOW_SIZE[0]},{WINDOW_SIZE[1]}",
                f"--user-data-dir={profile}",
                "--no-first-run",
                "--no-default-browser-check",
            ],
            check=False,
        )
        return
    try:
        import webview  # نصب اختیاری: pip install pywebview
    except ImportError:
        webbrowser.open(url)
        print("پنجره اختصاصی پیدا نشد؛ برنامه در مرورگر پیش‌فرض باز شد.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        return
    webview.create_window(TITLE, url, width=WINDOW_SIZE[0], height=WINDOW_SIZE[1])
    webview.start()


def main() -> int:
    base = ensure_workspace()
    print(f"پوشه کار برنامه: {base}")
    port = free_port()
    threading.Thread(target=_serve, args=(port,), daemon=True).start()
    if not wait_for_server(port):
        print("سرور محلی بالا نیامد.", file=sys.stderr)
        return 1
    url = f"http://{HOST}:{port}/"
    print(f"برنامه در حال اجراست: {url}")
    open_window(url)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
