"""خط فرمان ابزار: اسکن عکس‌ها → بازبینی → ساخت گزارش."""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

from .dates import format_jalali, parse_jalali
from .docx_report import build_docx, convert_to_pdf
from .pipeline import (
    ReportHeader,
    build_devices,
    default_report_date,
    load_payload,
    save_payload,
    summary_rows,
)


def _add_header_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--province", default="", help="نام استان در سربرگ گزارش")
    parser.add_argument("--case-unit", default="", help="پرونده - واحد")
    parser.add_argument("--address", default="", help="آدرس محل کشف")
    parser.add_argument("--report-number", default="", help="شماره گزارش")
    parser.add_argument("--report-date", default="", help="تاریخ گزارش (شمسی)")
    parser.add_argument("--approver", default="", help="تائید مسئول مربوطه")
    parser.add_argument("--notes", default="", help="توضیحات کارشناسی")


def _header_from_args(args, device_count: int, existing: ReportHeader | None = None) -> ReportHeader:
    header = existing or ReportHeader()
    if args.discovery:
        header.discovery_date = format_jalali(parse_jalali(args.discovery))
    header.province = args.province or header.province
    header.case_unit = args.case_unit or header.case_unit
    header.address = args.address or header.address
    header.report_number = args.report_number or header.report_number
    header.report_date = args.report_date or header.report_date or default_report_date()
    header.approver = args.approver or header.approver
    header.expert_notes = args.notes or header.expert_notes
    header.device_count = header.device_count or f"{device_count} دستگاه"
    return header


def command_scan(args) -> int:
    folder = Path(args.images).expanduser().resolve()
    devices = build_devices(folder, read_marker=args.read_marker)
    if not devices:
        print("هیچ عکسی پیدا نشد.", file=sys.stderr)
        return 1
    header = _header_from_args(args, len(devices))
    data_path = Path(args.data).expanduser()
    save_payload(data_path, header, devices)
    _print_summary(header, devices)
    print(f"\nفایل داده ذخیره شد: {data_path}")
    print("در صورت نیاز مقادیر را در همین فایل اصلاح کنید و سپس دستور build را اجرا کنید.")
    return 0


def command_build(args) -> int:
    data_path = Path(args.data).expanduser()
    header, devices = load_payload(data_path)
    if args.discovery:
        header.discovery_date = format_jalali(parse_jalali(args.discovery))
    if not header.discovery_date:
        print("تاریخ کشف تعیین نشده است (--discovery).", file=sys.stderr)
        return 1
    output = Path(args.output).expanduser()
    build_docx(header, devices, Path(args.template).expanduser(), output)
    print(f"گزارش وورد ساخته شد: {output}")
    if args.pdf:
        pdf_path = convert_to_pdf(output)
        print(f"گزارش PDF ساخته شد: {pdf_path}")
    if args.csv:
        csv_path = Path(args.csv).expanduser()
        rows = summary_rows(header, devices)
        with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
        print(f"جدول خلاصه ساخته شد: {csv_path}")
    return 0


def command_run(args) -> int:
    result = command_scan(args)
    if result:
        return result
    return command_build(args)


def _print_summary(header, devices) -> None:
    for row in summary_rows(header, devices):
        print(
            f"[{row['دستگاه']}] {row['مدل'] or '؟'} | {row['سریال'] or '؟'} | "
            f"استارت {row['تاریخ استارت (میلادی)'] or '؟'} | {row['مدت کارکرد (روز)']} روز"
            + (f" | ⚠ {row['هشدارها']}" if row["هشدارها"] else "")
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="minerreport",
        description="استخراج اطلاعات ماینر از عکس‌ها و ساخت گزارش کارشناسی",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan = subparsers.add_parser("scan", help="اسکن پوشه عکس‌ها و ساخت فایل داده")
    scan.add_argument("--images", required=True, help="پوشه عکس‌ها")
    scan.add_argument("--data", default="devices.json", help="مسیر فایل داده خروجی")
    scan.add_argument("--discovery", default="", help="تاریخ کشف شمسی، مثل 1404/08/03")
    scan.add_argument(
        "--read-marker",
        action="store_true",
        help="تلاش برای خواندن شماره دستی قرمز روی عکس (دست‌خط اغلب اشتباه خوانده می‌شود)",
    )
    _add_header_arguments(scan)
    scan.set_defaults(func=command_scan)

    build = subparsers.add_parser("build", help="ساخت گزارش از فایل داده")
    build.add_argument("--data", default="devices.json")
    build.add_argument("--template", default="template.docx", help="قالب وورد سربرگ‌دار")
    build.add_argument("--output", default="report.docx")
    build.add_argument("--discovery", default="")
    build.add_argument("--pdf", action="store_true")
    build.add_argument("--csv", default="")
    build.set_defaults(func=command_build)

    run = subparsers.add_parser("run", help="اسکن و ساخت گزارش در یک مرحله")
    run.add_argument("--images", required=True)
    run.add_argument("--data", default="devices.json")
    run.add_argument("--template", default="template.docx")
    run.add_argument("--output", default="report.docx")
    run.add_argument("--discovery", required=True)
    run.add_argument("--pdf", action="store_true")
    run.add_argument("--csv", default="")
    run.add_argument("--read-marker", action="store_true")
    _add_header_arguments(run)
    run.set_defaults(func=command_run)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
