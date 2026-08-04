"""پوشه کار برنامه: برای هر پرونده یک پوشه که عکس‌های لیبل و لاگ داخل آن است."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from .extract import list_images

HOME_ENV = "MINERREPORT_HOME"
DEFAULT_HOME_NAME = "MinerReports"
CASES_DIR_NAME = "پرونده‌ها"
GUIDE_NAME = "راهنما.txt"

GUIDE_TEXT = """\
پوشه کار برنامه گزارش تخلیه اطلاعاتی ماینر

۱) برای هر پرونده یک پوشه در «{cases}» بسازید؛ نام پوشه همان نام پرونده است.
۲) عکس لیبل و اسکرین‌شات لاگ هر دستگاه را داخل پوشه پرونده بگذارید و نام فایل را با
   شماره دستگاه شروع کنید، مثل:
       1-label.jpg   1-log.jpg
       2-label.jpg   2-log.jpg
۳) برنامه را اجرا کنید، پرونده را انتخاب کنید، تاریخ کشف را وارد کنید و گزارش را بسازید.
   فایل وورد/PDF در همان پوشه پرونده ذخیره می‌شود.
"""


def workspace_root() -> Path:
    """مسیر پوشه کار؛ با متغیر محیطی MINERREPORT_HOME قابل تغییر است."""
    custom = os.environ.get(HOME_ENV)
    root = Path(custom).expanduser() if custom else Path.home() / DEFAULT_HOME_NAME
    return root.resolve()


def cases_root(root: Path | None = None) -> Path:
    return (root or workspace_root()) / CASES_DIR_NAME


def ensure_workspace(root: Path | None = None) -> Path:
    """ساخت پوشه کار و فایل راهنما در نخستین اجرا."""
    base = root or workspace_root()
    cases = cases_root(base)
    cases.mkdir(parents=True, exist_ok=True)
    guide = base / GUIDE_NAME
    if not guide.exists():
        guide.write_text(GUIDE_TEXT.format(cases=cases), encoding="utf-8")
    return base


def list_cases(root: Path | None = None) -> list[dict]:
    """پرونده‌های موجود همراه با تعداد عکس هر پرونده."""
    cases = cases_root(root)
    if not cases.is_dir():
        return []
    result = []
    for folder in sorted(cases.iterdir(), key=lambda item: item.name):
        if folder.is_dir() and not folder.name.startswith("."):
            result.append({"name": folder.name, "images": len(list_images(folder))})
    return result


def case_dir(name: str, root: Path | None = None) -> Path:
    """پوشه یک پرونده؛ نام پرونده نباید مسیر باشد."""
    clean = name.strip()
    if not clean or clean in {".", ".."} or Path(clean).name != clean:
        raise ValueError(f"نام پرونده نامعتبر است: {name!r}")
    return cases_root(root) / clean


def report_path(case: Path, suffix: str = ".docx") -> Path:
    """مسیر خروجی داخل پوشه پرونده: «گزارش - نام پرونده.docx»."""
    return case / f"گزارش - {case.name}{suffix}"


def open_in_file_manager(path: Path) -> None:
    """باز کردن پوشه در فایل‌منیجر سیستم."""
    if sys.platform.startswith("win"):
        os.startfile(path)  # ویندوز
    elif sys.platform == "darwin":
        subprocess.Popen(["open", str(path)])
    else:
        subprocess.Popen(["xdg-open", str(path)])
