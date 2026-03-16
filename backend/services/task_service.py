import json
import uuid
from datetime import datetime, timezone

import aiosqlite

from schemas.task import TaskCreate


async def create_task(db: aiosqlite.Connection, task_data: TaskCreate) -> dict:
    task_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    test_cases_json = json.dumps([tc.model_dump() for tc in task_data.test_cases])

    await db.execute(
        """
        INSERT INTO tasks (id, title, description, reference_solution, test_cases, difficulty, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            task_id,
            task_data.title,
            task_data.description,
            task_data.reference_solution,
            test_cases_json,
            task_data.difficulty.value,
            created_at,
        ),
    )
    await db.commit()

    return {
        "id": task_id,
        "title": task_data.title,
        "description": task_data.description,
        "test_cases": task_data.test_cases,
        "difficulty": task_data.difficulty,
        "created_at": created_at,
    }


async def get_tasks(db: aiosqlite.Connection, difficulty: str | None = None) -> list[dict]:
    if difficulty:
        cursor = await db.execute(
            "SELECT id, title, description, test_cases, difficulty, created_at FROM tasks WHERE difficulty = ?",
            (difficulty,),
        )
    else:
        cursor = await db.execute(
            "SELECT id, title, description, test_cases, difficulty, created_at FROM tasks"
        )

    rows = await cursor.fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "test_cases": json.loads(row["test_cases"]),
            "difficulty": row["difficulty"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


async def get_task_by_id(db: aiosqlite.Connection, task_id: str) -> dict | None:
    cursor = await db.execute(
        "SELECT id, title, description, test_cases, difficulty, created_at FROM tasks WHERE id = ?",
        (task_id,),
    )
    row = await cursor.fetchone()
    if row is None:
        return None

    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "test_cases": json.loads(row["test_cases"]),
        "difficulty": row["difficulty"],
        "created_at": row["created_at"],
    }
