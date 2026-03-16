from typing import AsyncGenerator

import aiosqlite

from config import settings

TASKS_DDL = """
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reference_solution TEXT NOT NULL,
    test_cases TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
    created_at TEXT NOT NULL
)
"""

SUBMISSIONS_DDL = """
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id),
    submitted_code TEXT NOT NULL,
    results TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TEXT NOT NULL
)
"""


async def init_db():
    async with aiosqlite.connect(settings.DATABASE_URL) as db:
        await db.execute(TASKS_DDL)
        await db.execute(SUBMISSIONS_DDL)
        await db.commit()


async def get_db_connection() -> AsyncGenerator[aiosqlite.Connection, None]:
    db = await aiosqlite.connect(settings.DATABASE_URL)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
