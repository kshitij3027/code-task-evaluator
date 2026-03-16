import subprocess
import time

from config import settings

BLOCKED_MODULES = frozenset({
    "os", "subprocess", "pathlib", "shutil",
    "ctypes", "socket",
})

IMPORT_BLOCKER = (
    "import builtins as _builtins\n"
    "_original_import = _builtins.__import__\n"
    f"_BLOCKED = {repr(BLOCKED_MODULES)}\n"
    "def _safe_import(name, *args, _blocked=_BLOCKED, _orig=_original_import, **kwargs):\n"
    "    if name in _blocked:\n"
    "        raise ImportError(f\"Import of '{name}' is not allowed\")\n"
    "    return _orig(name, *args, **kwargs)\n"
    "_builtins.__import__ = _safe_import\n"
    "del _builtins, _original_import, _safe_import, _BLOCKED\n"
)


def _run_single_test(wrapped_code: str, test_input: str) -> dict:
    """Execute wrapped code with given input via subprocess."""
    start = time.perf_counter()
    try:
        result = subprocess.run(
            ["python3", "-c", wrapped_code],
            input=test_input,
            capture_output=True,
            text=True,
            timeout=settings.EXEC_TIMEOUT_SECONDS,
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        if result.returncode != 0:
            return {
                "status": "RUNTIME_ERROR",
                "actual_output": "",
                "error_message": result.stderr[:settings.MAX_OUTPUT_BYTES],
                "execution_time_ms": elapsed_ms,
            }

        return {
            "status": "COMPLETED",
            "actual_output": result.stdout[:settings.MAX_OUTPUT_BYTES],
            "error_message": None,
            "execution_time_ms": elapsed_ms,
        }

    except subprocess.TimeoutExpired:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return {
            "status": "TIMEOUT",
            "actual_output": "",
            "error_message": None,
            "execution_time_ms": elapsed_ms,
        }


def execute_code(code: str, test_cases: list[dict]) -> tuple[list[dict], dict]:
    """
    Run code against each test case. Returns (results, summary).
    Synchronous — caller should use asyncio.to_thread() to avoid blocking.
    """
    # Step 1: Syntax check before spawning any subprocess
    try:
        compile(code, "<submission>", "exec")
    except SyntaxError as e:
        error_msg = f"{e.__class__.__name__}: {e}"
        results = [
            {
                "test_case_index": i,
                "passed": False,
                "expected_output": tc["expected_output"],
                "actual_output": "",
                "execution_time_ms": 0,
                "status": "SYNTAX_ERROR",
                "error_message": error_msg,
            }
            for i, tc in enumerate(test_cases)
        ]
        return results, {"passed": 0, "failed": len(test_cases), "total": len(test_cases)}

    # Step 2: Wrap code with import blocker
    wrapped_code = IMPORT_BLOCKER + "\n" + code

    # Step 3: Run each test case independently
    results = []
    passed_count = 0
    for i, tc in enumerate(test_cases):
        run_result = _run_single_test(wrapped_code, tc["input"])
        expected = tc["expected_output"].rstrip()
        actual = run_result["actual_output"].rstrip()

        if run_result["status"] == "TIMEOUT":
            status = "TIMEOUT"
        elif run_result["status"] == "RUNTIME_ERROR":
            status = "RUNTIME_ERROR"
        elif actual == expected:
            status = "PASS"
            passed_count += 1
        else:
            status = "WRONG_ANSWER"

        results.append({
            "test_case_index": i,
            "passed": status == "PASS",
            "expected_output": tc["expected_output"],
            "actual_output": actual,
            "execution_time_ms": run_result["execution_time_ms"],
            "status": status,
            "error_message": run_result["error_message"],
        })

    failed_count = len(test_cases) - passed_count
    return results, {"passed": passed_count, "failed": failed_count, "total": len(test_cases)}
