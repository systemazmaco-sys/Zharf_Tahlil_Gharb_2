"""تبدیل تاریخ شمسی/میلادی و محاسبه مدت کارکرد دستگاه."""

from __future__ import annotations

import re
from datetime import date, datetime

import jdatetime

PERSIAN_GREGORIAN_MONTHS = [
    "ژانویه",
    "فوریه",
    "مارس",
    "آپریل",
    "می",
    "جون",
    "جولای",
    "آگوست",
    "سپتامبر",
    "اکتبر",
    "نوامبر",
    "دسامبر",
]

_JALALI_RE = re.compile(r"^\s*(\d{2,4})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{1,4})\s*$")
_PERSIAN_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


def normalize_digits(text: str) -> str:
    return text.translate(_PERSIAN_DIGITS)


def parse_jalali(text: str) -> jdatetime.date:
    """تاریخ شمسی را با فرمت 1404/08/03 یا 03/08/1404 می‌پذیرد."""
    match = _JALALI_RE.match(normalize_digits(text))
    if not match:
        raise ValueError(f"تاریخ شمسی نامعتبر است: {text!r}")
    first, month, last = (int(part) for part in match.groups())
    if first > 1000:
        year, day = first, last
    else:
        year, day = last, first
    return jdatetime.date(year, month, day)


def format_jalali(value: jdatetime.date) -> str:
    return f"{value.day:02d}/{value.month:02d}/{value.year}"


def to_gregorian(value: jdatetime.date) -> date:
    return value.togregorian()


def to_jalali(value: date) -> jdatetime.date:
    return jdatetime.date.fromgregorian(date=value)


def format_gregorian_fa(value: date) -> str:
    """۱۱ سپتامبر ۲۰۲۵ → '11 سپتامبر 2025' (همان قالب گزارش نمونه)."""
    return f"{value.day:02d} {PERSIAN_GREGORIAN_MONTHS[value.month - 1]} {value.year}"


def format_start_date(value: date) -> str:
    """قالب کامل تاریخ استارت: '11 سپتامبر 2025  ( 20/06/1404 )'."""
    return f"{format_gregorian_fa(value)}  ( {format_jalali(to_jalali(value))} )"


def working_days(start: date, discovery: date) -> int:
    """مدت کارکرد به روز، شمارش شامل روز استارت و روز کشف (مطابق گزارش نمونه)."""
    return (discovery - start).days + 1


def parse_log_timestamp(text: str) -> datetime:
    """'Sun Feb 18 02:58:14 2024' را به datetime تبدیل می‌کند."""
    return datetime.strptime(text.strip(), "%a %b %d %H:%M:%S %Y")
