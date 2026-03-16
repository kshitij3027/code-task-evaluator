from typing import Optional

from pydantic import BaseModel, Field

from models.task import Difficulty


class TestCaseSchema(BaseModel):
    input: str
    expected_output: str


class TaskCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    reference_solution: str = Field(min_length=1)
    test_cases: list[TestCaseSchema] = Field(min_length=1)
    difficulty: Difficulty


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = Field(default=None, min_length=1)
    reference_solution: Optional[str] = Field(default=None, min_length=1)
    test_cases: Optional[list[TestCaseSchema]] = Field(default=None, min_length=1)
    difficulty: Optional[Difficulty] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    test_cases: list[TestCaseSchema]
    difficulty: Difficulty
    created_at: str


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
