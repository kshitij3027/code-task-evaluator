from pydantic import BaseModel, Field

from models.submission import ResultStatus


class SubmissionCreate(BaseModel):
    code: str = Field(min_length=1)


class TestCaseResult(BaseModel):
    test_case_index: int
    passed: bool
    expected_output: str
    actual_output: str
    execution_time_ms: int
    status: ResultStatus
    error_message: str | None = None


class SubmissionSummary(BaseModel):
    passed: int
    failed: int
    total: int


class SubmissionResponse(BaseModel):
    id: str
    task_id: str
    results: list[TestCaseResult]
    summary: SubmissionSummary
    created_at: str


class SubmissionListResponse(BaseModel):
    submissions: list[SubmissionResponse]
