"""رابط وب محلی: آپلود عکس‌ها، بازبینی داده‌های استخراج‌شده و دریافت گزارش."""

from __future__ import annotations

import shutil
import tempfile
import uuid
from dataclasses import asdict
from pathlib import Path

from flask import Flask, jsonify, request, send_file

from .dates import format_jalali, parse_jalali
from .docx_report import build_docx, convert_to_pdf
from .pipeline import (
    Device,
    ReportHeader,
    build_devices,
    default_report_date,
    summary_rows,
)

WORKSPACE = Path(tempfile.gettempdir()) / "minerreport-web"
DEVICE_FIELDS = set(Device.__dataclass_fields__)
TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "template.docx"

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 512 * 1024 * 1024


@app.get("/")
def index() -> str:
    return (Path(__file__).resolve().parent / "static" / "index.html").read_text(
        encoding="utf-8"
    )


@app.post("/api/scan")
def scan():
    files = request.files.getlist("images")
    if not files:
        return jsonify({"error": "عکسی ارسال نشد"}), 400
    session = uuid.uuid4().hex
    folder = WORKSPACE / session / "images"
    folder.mkdir(parents=True, exist_ok=True)
    for item in files:
        name = Path(item.filename or "image.jpg").name
        item.save(folder / name)
    devices = build_devices(folder, read_marker=False)
    return jsonify(
        {
            "session": session,
            "devices": [asdict(device) for device in devices],
            "report_date": default_report_date(),
        }
    )


def _devices_from_payload(payload: dict) -> list[Device]:
    """کلیدهای افزودهٔ رابط وب (مانند days) نادیده گرفته می‌شوند."""
    return [
        Device(**{key: value for key, value in item.items() if key in DEVICE_FIELDS})
        for item in payload.get("devices", [])
    ]


@app.post("/api/report")
def report():
    payload = request.get_json(force=True)
    header = ReportHeader(**payload.get("header", {}))
    header.discovery_date = format_jalali(parse_jalali(header.discovery_date))
    header.report_date = header.report_date or default_report_date()
    devices = _devices_from_payload(payload)
    if not devices:
        return jsonify({"error": "هیچ دستگاهی ارسال نشد"}), 400
    header.device_count = header.device_count or f"{len(devices)} دستگاه"

    template = Path(payload.get("template") or TEMPLATE_PATH)
    if not template.exists():
        return jsonify({"error": f"قالب وورد پیدا نشد: {template}"}), 400

    session = payload.get("session") or uuid.uuid4().hex
    out_dir = WORKSPACE / session / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    docx_path = build_docx(header, devices, template, out_dir / "report.docx")
    if payload.get("format") == "pdf":
        pdf_path = convert_to_pdf(docx_path)
        return send_file(pdf_path, as_attachment=True, download_name="report.pdf")
    return send_file(docx_path, as_attachment=True, download_name="report.docx")


@app.post("/api/summary")
def summary():
    payload = request.get_json(force=True)
    header = ReportHeader(**payload.get("header", {}))
    devices = _devices_from_payload(payload)
    return jsonify(summary_rows(header, devices))


@app.post("/api/cleanup")
def cleanup():
    session = (request.get_json(force=True) or {}).get("session")
    if session:
        shutil.rmtree(WORKSPACE / session, ignore_errors=True)
    return jsonify({"ok": True})


def main() -> None:
    app.run(host="127.0.0.1", port=8765, debug=False)


if __name__ == "__main__":
    main()
