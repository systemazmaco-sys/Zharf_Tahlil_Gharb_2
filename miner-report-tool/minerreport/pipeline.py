"""گروه‌بندی عکس‌ها به تفکیک دستگاه و ساخت فایل داده‌ی گزارش (devices.json)."""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass, field
from datetime import date
from pathlib import Path

from .dates import (
    format_jalali,
    format_start_date,
    parse_jalali,
    to_gregorian,
    working_days,
)
from .extract import ImageInfo, analyze_image, list_images

DEFAULT_AMPS = "17 A"

# نام فایل مثل 3-label.jpg یا 03_log.png (نه تاریخ‌هایی مثل 2024-04-23)
_FILENAME_INDEX_RE = re.compile(r"^(\d{1,3})(?:[\s_.\-)]+\D|$)")


@dataclass
class Device:
    index: int
    model: str = ""
    hashrate: str = ""
    serial: str = ""
    start_date: str = ""  # میلادی، ISO: 2025-09-11
    amps: str = DEFAULT_AMPS
    last_user: str = ""
    serial_source: str = ""
    label_image: str = ""
    log_image: str = ""
    warnings: list[str] = field(default_factory=list)

    @property
    def model_line(self) -> str:
        parts = [p for p in (self.model, self.hashrate) if p]
        return "Whatsminer _ " + "_".join(parts) if parts else ""

    def start_date_obj(self) -> date | None:
        return date.fromisoformat(self.start_date) if self.start_date else None

    def duration_days(self, discovery: date) -> int | None:
        start = self.start_date_obj()
        return working_days(start, discovery) if start else None


@dataclass
class ReportHeader:
    province: str = ""
    case_unit: str = ""
    address: str = ""
    device_count: str = ""
    report_number: str = ""
    discovery_date: str = ""  # شمسی: 03/08/1404
    report_date: str = ""  # شمسی
    approver: str = ""
    expert_notes: str = ""


def _device_key(info: ImageInfo, root: Path) -> int | None:
    """شماره‌ی دستگاه از نام پوشه (device_03 / 3) یا نام فایل (3-label.jpg)."""
    relative = info.path.relative_to(root)
    if len(relative.parts) > 1:
        digits = "".join(ch for ch in relative.parts[0] if ch.isdigit())
        if digits:
            return int(digits)
    match = _FILENAME_INDEX_RE.match(relative.stem)
    return int(match.group(1)) if match else None


def group_images(infos: list[ImageInfo], root: Path) -> dict[int, dict[str, ImageInfo]]:
    """هر دستگاه = یک عکس لیبل + یک اسکرین‌شات لاگ."""
    groups: dict[int, dict[str, ImageInfo]] = {}

    def place(key: int, info: ImageInfo) -> None:
        groups.setdefault(key, {})[info.kind] = info

    pending: list[ImageInfo] = []
    for info in infos:
        key = _device_key(info, root)
        if key is None:
            key = info.marker
        if key is not None:
            place(key, info)
        else:
            pending.append(info)

    # عکس‌های بدون شماره: به ترتیب زمان عکس‌برداری جفت می‌شوند
    next_key = max(groups, default=0) + 1
    current: dict[str, ImageInfo] = {}
    for info in pending:
        if info.kind in current:
            groups[next_key] = current
            next_key += 1
            current = {}
        current[info.kind] = info
    if current:
        groups[next_key] = current
    return dict(sorted(groups.items()))


def build_devices(folder: Path, read_marker: bool = False) -> list[Device]:
    infos = [analyze_image(path, read_marker=read_marker) for path in list_images(folder)]
    devices: list[Device] = []
    for index, group in group_images(infos, folder).items():
        device = Device(index=index)
        label = group.get("label")
        log = group.get("log")
        if label:
            device.model = label.model or ""
            device.hashrate = label.hashrate or ""
            device.serial = label.serial or ""
            device.serial_source = label.serial_source or ""
            device.label_image = str(label.path)
            if device.serial_source == "ocr":
                device.warnings.append("سریال از OCR خوانده شده و نیاز به بازبینی دارد")
            if not device.serial:
                device.warnings.append("سریال خوانده نشد")
        else:
            device.warnings.append("عکس لیبل پیدا نشد")
        if log:
            device.log_image = str(log.path)
            device.last_user = log.last_user or ""
            if log.last_user_at:
                device.start_date = log.last_user_at.date().isoformat()
            else:
                device.warnings.append("تاریخ آخرین یوزر در لاگ خوانده نشد")
        else:
            device.warnings.append("اسکرین‌شات لاگ پیدا نشد")
        devices.append(device)
    return devices


def to_payload(header: ReportHeader, devices: list[Device]) -> dict:
    return {"header": asdict(header), "devices": [asdict(d) for d in devices]}


def from_payload(payload: dict) -> tuple[ReportHeader, list[Device]]:
    header = ReportHeader(**payload.get("header", {}))
    devices = [Device(**item) for item in payload.get("devices", [])]
    return header, devices


def save_payload(path: Path, header: ReportHeader, devices: list[Device]) -> None:
    path.write_text(
        json.dumps(to_payload(header, devices), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_payload(path: Path) -> tuple[ReportHeader, list[Device]]:
    return from_payload(json.loads(path.read_text(encoding="utf-8")))


def device_block(device: Device, discovery_jalali: str) -> str:
    """متن کادر یک دستگاه، دقیقاً با ساختار گزارش نمونه."""
    discovery = to_gregorian(parse_jalali(discovery_jalali))
    start = device.start_date_obj()
    start_text = format_start_date(start) if start else "-"
    days = device.duration_days(discovery)
    lines = [
        f"دستگاه شماره {device.index}",
        f"مدل دستگاه: {device.model_line or '-'}",
        f"شماره سریال: {device.serial or '-'}",
        f"تاریخ استارت: {start_text}",
        f"آمپر مصرفی: {device.amps or '-'}",
        f"مدت کارکرد: {days if days is not None else '-'} روز",
    ]
    return "\n".join(lines)


def summary_rows(header: ReportHeader, devices: list[Device]) -> list[dict]:
    """خروجی جدولی برای بازبینی/اکسل."""
    discovery = to_gregorian(parse_jalali(header.discovery_date))
    rows = []
    for device in devices:
        start = device.start_date_obj()
        rows.append(
            {
                "دستگاه": device.index,
                "مدل": device.model_line,
                "سریال": device.serial,
                "تاریخ استارت (میلادی)": start.isoformat() if start else "",
                "تاریخ استارت (شمسی)": format_start_date(start) if start else "",
                "آمپر": device.amps,
                "مدت کارکرد (روز)": device.duration_days(discovery),
                "آخرین یوزر": device.last_user,
                "هشدارها": "؛ ".join(device.warnings),
            }
        )
    return rows


def default_report_date() -> str:
    import jdatetime

    return format_jalali(jdatetime.date.today())
