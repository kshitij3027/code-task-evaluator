import pytest
from pydantic import ValidationError

from models.submission import ResultStatus
from schemas.submission import (
    SubmissionCreate,
    SubmissionResponse,
    SubmissionSummary,
    TestCaseResult,
)


class TestSubmissionCreate:
    def test_valid_code(self):
        sc = SubmissionCreate(code="print('hello')")
        assert sc.code == "print('hello')"

    def test_rejects_empty_code(self):
        with pytest.raises(ValidationError) as exc_info:
            SubmissionCreate(code="")
        errors = exc_info.value.errors()
        assert any(e["type"] == "string_too_short" for e in errors)

    def test_rejects_missing_code(self):
        with pytest.raises(ValidationError):
            SubmissionCreate()


class TestTestCaseResult:
    @pytest.mark.parametrize("status", list(ResultStatus))
    def test_serializes_all_statuses(self, status):
        result = TestCaseResult(
            test_case_index=0,
            passed=status == ResultStatus.PASS,
            expected_output="3",
            actual_output="3" if status == ResultStatus.PASS else "",
            execution_time_ms=10,
            status=status,
            error_message="some error" if status in (ResultStatus.RUNTIME_ERROR, ResultStatus.SYNTAX_ERROR) else None,
        )
        data = result.model_dump()
        assert data["status"] == status.value
        assert isinstance(data["test_case_index"], int)

    def test_error_message_optional(self):
        result = TestCaseResult(
            test_case_index=0,
            passed=True,
            expected_output="3",
            actual_output="3",
            execution_time_ms=10,
            status=ResultStatus.PASS,
        )
        assert result.error_message is None


class TestSubmissionResponse:
    def test_round_trip(self):
        response = SubmissionResponse(
            id="sub-001",
            task_id="task-001",
            results=[
                TestCaseResult(
                    test_case_index=0,
                    passed=True,
                    expected_output="3",
                    actual_output="3",
                    execution_time_ms=12,
                    status=ResultStatus.PASS,
                ),
                TestCaseResult(
                    test_case_index=1,
                    passed=False,
                    expected_output="5",
                    actual_output="4",
                    execution_time_ms=8,
                    status=ResultStatus.WRONG_ANSWER,
                ),
            ],
            summary=SubmissionSummary(passed=1, failed=1, total=2),
            created_at="2026-01-01T00:00:00Z",
        )
        data = response.model_dump()
        restored = SubmissionResponse(**data)
        assert restored.id == "sub-001"
        assert len(restored.results) == 2
        assert restored.summary.passed == 1
        assert restored.results[0].status == ResultStatus.PASS
        assert restored.results[1].status == ResultStatus.WRONG_ANSWER
