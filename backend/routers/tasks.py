from fastapi import APIRouter, Depends, HTTPException, Response

import aiosqlite

from db import get_db_connection
from models.task import Difficulty
from schemas.task import TaskCreate, TaskListResponse, TaskResponse, TaskUpdate
from schemas.submission import SubmissionResponse
from services.task_service import (
    create_task,
    delete_task,
    get_task_by_id,
    get_tasks,
    update_task,
    verify_task,
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task_endpoint(
    task_data: TaskCreate, db: aiosqlite.Connection = Depends(get_db_connection)
):
    result = await create_task(db, task_data)
    return result


@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    difficulty: Difficulty | None = None,
    db: aiosqlite.Connection = Depends(get_db_connection),
):
    tasks = await get_tasks(db, difficulty.value if difficulty else None)
    return TaskListResponse(tasks=tasks)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str, db: aiosqlite.Connection = Depends(get_db_connection)
):
    task = await get_task_by_id(db, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task_endpoint(
    task_id: str,
    task_data: TaskUpdate,
    db: aiosqlite.Connection = Depends(get_db_connection),
):
    result = await update_task(db, task_id, task_data)
    if result is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return result


@router.delete("/{task_id}", status_code=204)
async def delete_task_endpoint(
    task_id: str, db: aiosqlite.Connection = Depends(get_db_connection)
):
    deleted = await delete_task(db, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return Response(status_code=204)


@router.post("/{task_id}/verify", response_model=SubmissionResponse)
async def verify_task_endpoint(
    task_id: str, db: aiosqlite.Connection = Depends(get_db_connection)
):
    result = await verify_task(db, task_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return result
