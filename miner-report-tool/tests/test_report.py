"""تست‌های واحد ابزار گزارش (اجرا: python -m unittest discover -s tests)."""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from minerreport.dates import (
    format_start_date,
    parse_jalali,
    parse_log_timestamp,
    to_gregorian,
    working_days,
)
from minerreport.extract import _LOG_USER_RE, clean_model
from minerreport.pipeline import Device, ReportHeader, device_block


class DateTests(unittest.TestCase):
    def test_parse_jalali_both_orders(self):
        self.assertEqual(parse_jalali("1404/08/03"), parse_jalali("03/08/1404"))

    def test_jalali_to_gregorian(self):
        self.assertEqual(to_gregorian(parse_jalali("20/06/1404")), date(2025, 9, 11))

    def test_working_days_matches_sample_report(self):
        discovery = to_gregorian(parse_jalali("03/08/1404"))
        self.assertEqual(working_days(date(2025, 9, 11), discovery), 45)
        self.assertEqual(working_days(date(2025, 10, 6), discovery), 20)

    def test_start_date_format(self):
        self.assertEqual(
            format_start_date(date(2025, 9, 11)), "11 سپتامبر 2025  ( 20/06/1404 )"
        )


class ExtractTests(unittest.TestCase):
    def test_clean_model_drops_hardware_version(self):
        self.assertEqual(clean_model("M30S-+_VH6.5"), "M30S+")
        self.assertEqual(clean_model("M30S+_VH60"), "M30S+")

    def test_log_line_parsing(self):
        line = (
            "Sun Feb 18 02:58:14 2024|E013|Pools Change|btminer|"
            "change pool[1] user from 'minmar1374.01' to 'minmar1374.02'"
        )
        match = _LOG_USER_RE.search(line)
        self.assertIsNotNone(match)
        self.assertEqual(match.group("new"), "minmar1374.02")
        self.assertEqual(
            parse_log_timestamp(match.group("ts")).date(), date(2024, 2, 18)
        )


class DeviceBlockTests(unittest.TestCase):
    def test_block_matches_sample_layout(self):
        device = Device(
            index=1,
            model="M30S+",
            hashrate="102T",
            serial="ZDM1EP653423092410268123323A19471",
            start_date="2025-09-11",
        )
        block = device_block(device, "03/08/1404").split("\n")
        self.assertEqual(block[0], "دستگاه شماره 1")
        self.assertEqual(block[1], "مدل دستگاه: Whatsminer _ M30S+_102T")
        self.assertEqual(block[-1], "مدت کارکرد: 45 روز")

    def test_missing_start_date_is_reported(self):
        block = device_block(Device(index=2), "03/08/1404")
        self.assertIn("مدت کارکرد: - روز", block)
        self.assertIn("تاریخ استارت: -", block)

    def test_header_defaults(self):
        self.assertEqual(ReportHeader().device_count, "")


if __name__ == "__main__":
    unittest.main()
