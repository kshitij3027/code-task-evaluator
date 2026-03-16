import asyncio
import json
import uuid
from datetime import datetime, timezone

import aiosqlite
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from db import TASKS_DDL
from main import app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


SAMPLE_TASK = {
    "id": "test-task-001",
    "title": "Two Sum",
    "description": "Read two space-separated integers and print their sum.",
    "reference_solution": "a, b = map(int, input().split())\nprint(a + b)",
    "test_cases": json.dumps([
        {"input": "1 2", "expected_output": "3"},
        {"input": "0 0", "expected_output": "0"},
    ]),
    "difficulty": "easy",
    "created_at": datetime.now(timezone.utc).isoformat(),
}


@pytest_asyncio.fixture
async def db():
    """In-memory SQLite database with tables created."""
    conn = await aiosqlite.connect(":memory:")
    conn.row_factory = aiosqlite.Row
    await conn.execute(TASKS_DDL)
    await conn.commit()
    try:
        yield conn
    finally:
        await conn.close()


@pytest_asyncio.fixture
async def db_with_task(db):
    """DB with a sample task inserted."""
    await db.execute(
        """INSERT INTO tasks (id, title, description, reference_solution, test_cases, difficulty, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            SAMPLE_TASK["id"],
            SAMPLE_TASK["title"],
            SAMPLE_TASK["description"],
            SAMPLE_TASK["reference_solution"],
            SAMPLE_TASK["test_cases"],
            SAMPLE_TASK["difficulty"],
            SAMPLE_TASK["created_at"],
        ),
    )
    await db.commit()
    return db


@pytest.fixture
def test_client():
    """FastAPI async test client."""
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")
