import asyncio
import json
import uuid
from datetime import datetime, timezone

import aiosqlite

from services.executor import execute_code
from services.task_service import get_task_by_id


async def create_submission(db: aiosqlite.Connection, task_id: str, code: str) -> dict | None:
    """Grade code against a task's test cases and persist the result. Returns None if task not found."""
    task = await get_task_by_id(db, task_id)
    if task is None:
        return None

    results, summary = await asyncio.to_thread(execute_code, code, task["test_cases"])

    submission_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    await db.execute(
        """
        INSERT INTO submissions (id, task_id, submitted_code, results, summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            submission_id,
            task_id,
            code,
            json.dumps(results),
            json.dumps(summary),
            created_at,
        ),
    )
    await db.commit()

    return {
        "id": submission_id,
        "task_id": task_id,
        "results": results,
        "summary": summary,
        "created_at": created_at,
    }


async def get_submissions_for_task(db: aiosqlite.Connection, task_id: str) -> list[dict] | None:
    """List submissions for a task, newest first. Returns None if task not found."""
    task = await get_task_by_id(db, task_id)
    if task is None:
        return None

    cursor = await db.execute(
        "SELECT id, task_id, results, summary, created_at FROM submissions WHERE task_id = ? ORDER BY created_at DESC",
        (task_id,),
    )
    rows = await cursor.fetchall()
    return [
        {
            "id": row["id"],
            "task_id": row["task_id"],
            "results": json.loads(row["results"]),
            "summary": json.loads(row["summary"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]
