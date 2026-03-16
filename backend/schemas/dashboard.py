from pydantic import BaseModel


class FailureModeBreakdown(BaseModel):
    PASS: int = 0
    WRONG_ANSWER: int = 0
    RUNTIME_ERROR: int = 0
    TIMEOUT: int = 0
    SYNTAX_ERROR: int = 0


class TaskDashboardItem(BaseModel):
    task_id: str
    title: str
    difficulty: str
    total_submissions: int
    pass_rate: float
    failure_mode_breakdown: FailureModeBreakdown


class DashboardResponse(BaseModel):
    tasks: list[TaskDashboardItem]


class OverallStatsResponse(BaseModel):
    total_tasks: int
    total_submissions: int
    overall_pass_rate: float
