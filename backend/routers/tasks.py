from fastapi import APIRouter, Depends, HTTPException

import aiosqlite

from db import get_db_connection
from models.task import Difficulty
from schemas.task import TaskCreate, TaskListResponse, TaskResponse
from services.task_service import create_task, get_task_by_id, get_tasks

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
