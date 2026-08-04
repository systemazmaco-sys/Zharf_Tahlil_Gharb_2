import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from minerreport.workspace import (
    GUIDE_NAME,
    case_dir,
    cases_root,
    ensure_workspace,
    list_cases,
    report_path,
)


class WorkspaceTests(unittest.TestCase):
    def setUp(self):
        self._temp = tempfile.TemporaryDirectory()
        self.root = Path(self._temp.name) / "MinerReports"

    def tearDown(self):
        self._temp.cleanup()

    def test_ensure_workspace_creates_cases_folder_and_guide(self):
        ensure_workspace(self.root)
        self.assertTrue(cases_root(self.root).is_dir())
        self.assertTrue((self.root / GUIDE_NAME).exists())

    def test_list_cases_counts_images(self):
        ensure_workspace(self.root)
        case = cases_root(self.root) / "پرونده ۱۱ دستگاهی"
        case.mkdir()
        (case / "1-label.jpg").write_bytes(b"")
        (case / "1-log.png").write_bytes(b"")
        (case / "notes.txt").write_text("", encoding="utf-8")
        self.assertEqual(list_cases(self.root), [{"name": case.name, "images": 2}])

    def test_list_cases_on_missing_workspace(self):
        self.assertEqual(list_cases(self.root), [])

    def test_case_dir_rejects_paths(self):
        for bad in ("", "  ", "..", "a/b", "../secrets"):
            with self.assertRaises(ValueError):
                case_dir(bad, self.root)

    def test_case_dir_and_report_path(self):
        case = case_dir("رستمی-خانی", self.root)
        self.assertEqual(case.parent, cases_root(self.root))
        self.assertEqual(report_path(case).name, "گزارش - رستمی-خانی.docx")
        self.assertEqual(report_path(case, ".pdf").name, "گزارش - رستمی-خانی.pdf")


if __name__ == "__main__":
    unittest.main()
