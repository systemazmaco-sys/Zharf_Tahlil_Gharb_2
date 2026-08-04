"""استخراج مدل/سریال از عکس لیبل و آخرین تاریخ ثبت یوزر از اسکرین‌شات لاگ ماینر."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
import pytesseract

from .dates import parse_log_timestamp

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}

_SERIAL_RE = re.compile(r"\b[A-Z0-9]{20,40}\b")
_PN_RE = re.compile(r"P\s*[/1I]\s*N\s*[:;]?\s*([A-Za-z0-9+._\-]+)", re.IGNORECASE)
_TYPE_RE = re.compile(r"TYPE\s*[:;]?\s*([A-Za-z0-9+._\s\-]{4,40})", re.IGNORECASE)
# در OCR لیبل‌های فلزی حرف T اغلب 7 خوانده می‌شود (102T ← 1027)
_HASHRATE_RE = re.compile(r"(\d{2,4})\s*[T7]\b", re.IGNORECASE)
_LOG_USER_RE = re.compile(
    r"(?P<ts>[A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})"
    r".*?user\s+from\s+'(?P<old>[^']*)'\s+to\s+'(?P<new>[^']*)'"
)


@dataclass
class ImageInfo:
    """نتیجه‌ی خام تحلیل یک عکس."""

    path: Path
    kind: str = "unknown"  # label | log | unknown
    marker: int | None = None
    model: str | None = None
    hashrate: str | None = None
    serial: str | None = None
    serial_source: str | None = None  # qr | ocr
    last_user: str | None = None
    last_user_at: datetime | None = None
    text: str = field(default="", repr=False)


def list_images(folder: Path) -> list[Path]:
    paths = [p for p in sorted(folder.rglob("*")) if p.suffix.lower() in IMAGE_SUFFIXES]
    return sorted(paths, key=lambda p: (_capture_time(p), p.name))


def _capture_time(path: Path) -> float:
    """زمان عکس‌برداری از EXIF، و در صورت نبود از زمان فایل."""
    try:
        from PIL import ExifTags, Image

        with Image.open(path) as img:
            exif = img.getexif()
        for tag, value in exif.items():
            if ExifTags.TAGS.get(tag) == "DateTimeOriginal":
                return datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S").timestamp()
    except Exception:
        pass
    return path.stat().st_mtime


def ocr(image: np.ndarray, psm: int = 6) -> str:
    return pytesseract.image_to_string(image, config=f"--psm {psm}")


def read_qr(image: np.ndarray) -> str | None:
    detector = cv2.QRCodeDetector()
    for scale in (1.0, 2.0, 0.5):
        candidate = image if scale == 1.0 else cv2.resize(image, None, fx=scale, fy=scale)
        try:
            ok, texts, _, _ = detector.detectAndDecodeMulti(candidate)
        except cv2.error:
            continue
        if ok:
            for text in texts:
                cleaned = text.strip()
                if cleaned:
                    return cleaned
    return None


def detect_marker(image: np.ndarray) -> int | None:
    """شماره‌ی دستی قرمزی که روی عکس نوشته شده را (در حد امکان) می‌خواند."""
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, (0, 110, 90), (10, 255, 255)) | cv2.inRange(
        hsv, (168, 110, 90), (180, 255, 255)
    )
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    largest = max(contours, key=cv2.contourArea)
    if cv2.contourArea(largest) < 0.0003 * image.shape[0] * image.shape[1]:
        return None
    x, y, w, h = cv2.boundingRect(largest)
    pad = int(0.15 * max(w, h))
    crop = mask[
        max(0, y - pad) : min(mask.shape[0], y + h + pad),
        max(0, x - pad) : min(mask.shape[1], x + w + pad),
    ]
    if crop.size == 0:
        return None
    crop = cv2.bitwise_not(cv2.resize(crop, None, fx=2, fy=2))
    for psm in (10, 7, 8):
        text = pytesseract.image_to_string(
            crop, config=f"--psm {psm} -c tessedit_char_whitelist=0123456789"
        )
        digits = re.sub(r"\D", "", text)
        if digits:
            return int(digits[:2])
    return None


def _label_variants(image: np.ndarray):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    yield gray
    yield cv2.createCLAHE(2.0, (8, 8)).apply(gray)
    yield cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    yield cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]


def clean_model(raw: str) -> str:
    """'M30S-+_VH6.5' ← OCR → 'M30S+' (نسخه سخت‌افزار در گزارش نمی‌آید)."""
    model = re.split(r"_?VH[\d.]*", raw, flags=re.IGNORECASE)[0]
    model = model.replace("-+", "+").replace("+-", "+")
    return model.strip(" .:_-")


def parse_label(
    image: np.ndarray,
    info: ImageInfo,
    first_pass: str = "",
    qr: str | None = None,
) -> None:
    """P/N، هش‌ریت و سریال را از عکس لیبل استخراج می‌کند (سریال را از QR ترجیح می‌دهد)."""
    if qr and _SERIAL_RE.fullmatch(qr.replace(" ", "")):
        info.serial = qr.replace(" ", "")
        info.serial_source = "qr"

    texts: list[str] = [first_pass] if first_pass else []
    for text in texts:
        _absorb_label_text(text, info)

    for variant in _label_variants(image):
        if info.model and info.hashrate and info.serial:
            break
        for psm in (6, 11):
            text = ocr(variant, psm)
            texts.append(text)
            _absorb_label_text(text, info)
    info.text = "\n".join(texts)


def _absorb_label_text(text: str, info: ImageInfo) -> None:
    if info.model is None:
        match = _PN_RE.search(text)
        if match:
            info.model = clean_model(match.group(1))
    if info.hashrate is None:
        type_match = _TYPE_RE.search(text)
        if type_match:
            rate = _HASHRATE_RE.search(type_match.group(1))
            if rate:
                info.hashrate = f"{rate.group(1)}T"
    if info.serial is None:
        candidates = _SERIAL_RE.findall(text.replace(" ", "").upper())
        if candidates:
            info.serial = max(candidates, key=len)
            info.serial_source = "ocr"


def parse_log(image: np.ndarray, info: ImageInfo, first_pass: str = "") -> None:
    """آخرین رکورد تغییر یوزر در Pools Change log را پیدا می‌کند."""
    text = first_pass or ocr(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY), 6)
    info.text = text
    best: tuple[datetime, str] | None = None
    for match in _LOG_USER_RE.finditer(text):
        try:
            stamp = parse_log_timestamp(match.group("ts"))
        except ValueError:
            continue
        if best is None or stamp >= best[0]:
            best = (stamp, match.group("new"))
    if best:
        info.last_user_at, info.last_user = best


def classify(text: str, has_qr: bool) -> str:
    lowered = text.lower()
    if "pools change" in lowered or "miner log" in lowered or "user from" in lowered:
        return "log"
    if "p/n" in lowered or "type:" in lowered or "qc" in lowered or has_qr:
        return "label"
    return "unknown"


def analyze_image(path: Path, read_marker: bool = False) -> ImageInfo:
    image = cv2.imread(str(path))
    if image is None:
        raise ValueError(f"عکس قابل خواندن نیست: {path}")
    info = ImageInfo(path=path)
    first_pass = ocr(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY), 6)
    qr = read_qr(image)
    info.kind = classify(first_pass, bool(qr))
    if info.kind == "label":
        parse_label(image, info, first_pass=first_pass, qr=qr)
    elif info.kind == "log":
        parse_log(image, info, first_pass=first_pass)
    else:
        info.text = first_pass
    if read_marker:
        info.marker = detect_marker(image)
    return info
