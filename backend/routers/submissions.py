from fastapi import APIRouter, Depends, HTTPException

import aiosqlite

from db import get_db_connection
from schemas.submission import (
    SubmissionCreate,
    SubmissionListResponse,
    SubmissionResponse,
)
from services.submission_service import create_submission, get_submissions_for_task

router = APIRouter(prefix="/api/tasks", tags=["submissions"])


@router.post("/{task_id}/submissions", response_model=SubmissionResponse, status_code=201)
async def create_submission_endpoint(
    task_id: str,
    submission_data: SubmissionCreate,
    db: aiosqlite.Connection = Depends(get_db_connection),
):
    result = await create_submission(db, task_id, submission_data.code)
    if result is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return result


@router.get("/{task_id}/submissions", response_model=SubmissionListResponse)
async def list_submissions_endpoint(
    task_id: str,
    db: aiosqlite.Connection = Depends(get_db_connection),
):
    submissions = await get_submissions_for_task(db, task_id)
    if submissions is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return SubmissionListResponse(submissions=submissions)
