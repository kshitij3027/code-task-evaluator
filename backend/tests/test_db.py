import pytest
import pytest_asyncio
import aiosqlite

from db import TASKS_DDL, SUBMISSIONS_DDL


@pytest_asyncio.fixture
async def mem_db():
    conn = await aiosqlite.connect(":memory:")
    try:
        yield conn
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_creates_both_tables(mem_db):
    await mem_db.execute(TASKS_DDL)
    await mem_db.execute(SUBMISSIONS_DDL)
    await mem_db.commit()

    cursor = await mem_db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )
    tables = [row[0] for row in await cursor.fetchall()]
    assert "tasks" in tables
    assert "submissions" in tables


@pytest.mark.asyncio
async def test_idempotent(mem_db):
    """Running DDL twice should not error."""
    for _ in range(2):
        await mem_db.execute(TASKS_DDL)
        await mem_db.execute(SUBMISSIONS_DDL)
        await mem_db.commit()


@pytest.mark.asyncio
async def test_submissions_table_columns(mem_db):
    await mem_db.execute(TASKS_DDL)
    await mem_db.execute(SUBMISSIONS_DDL)
    await mem_db.commit()

    cursor = await mem_db.execute("PRAGMA table_info(submissions)")
    columns = {row[1] for row in await cursor.fetchall()}
    expected = {"id", "task_id", "submitted_code", "results", "summary", "created_at"}
    assert columns == expected
