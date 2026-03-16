import pytest

from services.executor import execute_code


SIMPLE_TEST_CASES = [
    {"input": "1 2", "expected_output": "3"},
    {"input": "0 0", "expected_output": "0"},
]


class TestPassStatus:
    def test_correct_code_passes_all(self):
        code = "a, b = map(int, input().split())\nprint(a + b)"
        results, summary = execute_code(code, SIMPLE_TEST_CASES)
        assert all(r["status"] == "PASS" for r in results)
        assert all(r["passed"] is True for r in results)
        assert summary == {"passed": 2, "failed": 0, "total": 2}

    def test_trailing_whitespace_ignored(self):
        """Output with trailing newline should still match."""
        code = "a, b = map(int, input().split())\nprint(a + b)\nprint(end='')"
        results, _ = execute_code(code, [{"input": "1 2", "expected_output": "3"}])
        assert results[0]["status"] == "PASS"


class TestWrongAnswer:
    def test_wrong_output(self):
        code = "a, b = map(int, input().split())\nprint(a + b + 1)"
        results, summary = execute_code(code, SIMPLE_TEST_CASES)
        assert all(r["status"] == "WRONG_ANSWER" for r in results)
        assert all(r["passed"] is False for r in results)
        assert results[0]["actual_output"] == "4"
        assert results[0]["expected_output"] == "3"
        assert summary["failed"] == 2


class TestRuntimeError:
    def test_exception_captured(self):
        code = 'int("abc")'
        results, summary = execute_code(code, SIMPLE_TEST_CASES)
        assert all(r["status"] == "RUNTIME_ERROR" for r in results)
        assert all(r["error_message"] is not None for r in results)
        assert "ValueError" in results[0]["error_message"]
        assert summary["failed"] == 2

    def test_division_by_zero(self):
        code = "print(1/0)"
        results, _ = execute_code(code, [{"input": "", "expected_output": ""}])
        assert results[0]["status"] == "RUNTIME_ERROR"
        assert "ZeroDivisionError" in results[0]["error_message"]


class TestTimeout:
    def test_infinite_loop_times_out(self):
        code = "while True: pass"
        results, summary = execute_code(code, [{"input": "", "expected_output": ""}])
        assert results[0]["status"] == "TIMEOUT"
        assert results[0]["passed"] is False
        assert summary["failed"] == 1


class TestSyntaxError:
    def test_broken_syntax(self):
        code = "def foo("
        results, summary = execute_code(code, SIMPLE_TEST_CASES)
        assert all(r["status"] == "SYNTAX_ERROR" for r in results)
        assert all(r["error_message"] is not None for r in results)
        assert "SyntaxError" in results[0]["error_message"]
        assert all(r["execution_time_ms"] == 0 for r in results)
        assert summary == {"passed": 0, "failed": 2, "total": 2}


class TestImportBlocking:
    @pytest.mark.parametrize("module", ["os", "subprocess", "pathlib", "shutil", "ctypes", "socket"])
    def test_blocked_imports(self, module):
        code = f"import {module}\nprint('should not reach')"
        results, _ = execute_code(code, [{"input": "", "expected_output": ""}])
        assert results[0]["status"] == "RUNTIME_ERROR"
        assert "not allowed" in results[0]["error_message"]

    def test_dunder_import_blocked(self):
        code = '__import__("os")'
        results, _ = execute_code(code, [{"input": "", "expected_output": ""}])
        assert results[0]["status"] == "RUNTIME_ERROR"
        assert "not allowed" in results[0]["error_message"]

    def test_safe_imports_allowed(self):
        code = "import json\nprint(json.dumps({'a': 1}))"
        results, _ = execute_code(code, [{"input": "", "expected_output": '{"a": 1}'}])
        assert results[0]["status"] == "PASS"


class TestExecutionMetadata:
    def test_execution_time_nonnegative(self):
        code = "print(input())"
        results, _ = execute_code(code, [{"input": "hello", "expected_output": "hello"}])
        assert results[0]["execution_time_ms"] >= 0

    def test_test_case_index_sequential(self):
        code = "a, b = map(int, input().split())\nprint(a + b)"
        results, _ = execute_code(code, SIMPLE_TEST_CASES)
        assert [r["test_case_index"] for r in results] == [0, 1]


class TestMixedResults:
    def test_one_pass_one_fail(self):
        """First test case passes, second fails."""
        code = "print(3)"
        test_cases = [
            {"input": "", "expected_output": "3"},
            {"input": "", "expected_output": "5"},
        ]
        results, summary = execute_code(code, test_cases)
        assert results[0]["status"] == "PASS"
        assert results[1]["status"] == "WRONG_ANSWER"
        assert summary == {"passed": 1, "failed": 1, "total": 2}
