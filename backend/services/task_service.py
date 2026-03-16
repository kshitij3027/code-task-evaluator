import asyncio
import json
import uuid
from datetime import datetime, timezone

import aiosqlite

from schemas.task import TaskCreate, TaskUpdate
from services.executor import execute_code


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


async def get_task_with_solution(db: aiosqlite.Connection, task_id: str) -> dict | None:
    """Fetch a task including reference_solution (internal use only)."""
    cursor = await db.execute(
        "SELECT id, title, description, reference_solution, test_cases, difficulty, created_at FROM tasks WHERE id = ?",
        (task_id,),
    )
    row = await cursor.fetchone()
    if row is None:
        return None

    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "reference_solution": row["reference_solution"],
        "test_cases": json.loads(row["test_cases"]),
        "difficulty": row["difficulty"],
        "created_at": row["created_at"],
    }


async def update_task(db: aiosqlite.Connection, task_id: str, task_data: TaskUpdate) -> dict | None:
    """Update a task with partial data. Returns updated task dict or None if not found."""
    existing = await get_task_by_id(db, task_id)
    if existing is None:
        return None

    updates = task_data.model_dump(exclude_none=True)
    if not updates:
        return existing

    set_clauses = []
    values = []
    for key, value in updates.items():
        if key == "test_cases":
            set_clauses.append("test_cases = ?")
            values.append(json.dumps(value))
        elif key == "difficulty":
            set_clauses.append("difficulty = ?")
            values.append(value)
        else:
            set_clauses.append(f"{key} = ?")
            values.append(value)

    values.append(task_id)
    await db.execute(
        f"UPDATE tasks SET {', '.join(set_clauses)} WHERE id = ?",
        values,
    )
    await db.commit()

    return await get_task_by_id(db, task_id)


async def delete_task(db: aiosqlite.Connection, task_id: str) -> bool:
    """Delete a task and its submissions. Returns False if task not found."""
    existing = await get_task_by_id(db, task_id)
    if existing is None:
        return False

    await db.execute("DELETE FROM submissions WHERE task_id = ?", (task_id,))
    await db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    await db.commit()
    return True


async def verify_task(db: aiosqlite.Connection, task_id: str) -> dict | None:
    """Run reference solution against test cases without storing. Returns SubmissionResponse-shaped dict or None."""
    task = await get_task_with_solution(db, task_id)
    if task is None:
        return None

    results, summary = await asyncio.to_thread(execute_code, task["reference_solution"], task["test_cases"])

    return {
        "id": f"verify-{task_id}",
        "task_id": task_id,
        "results": results,
        "summary": summary,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
