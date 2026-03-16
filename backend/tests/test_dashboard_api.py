import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from main import app


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def task_id(client):
    """Get the first seed task's ID (Two Sum, easy)."""
    resp = await client.get("/api/tasks/")
    tasks = resp.json()["tasks"]
    return tasks[0]["id"]


@pytest.mark.asyncio
async def test_dashboard_with_no_submissions(client):
    resp = await client.get("/api/dashboard/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["tasks"]) >= 3
    for task in data["tasks"]:
        assert "task_id" in task
        assert "title" in task
        assert "difficulty" in task
        assert "total_submissions" in task
        assert "pass_rate" in task
        assert "failure_mode_breakdown" in task


@pytest.mark.asyncio
async def test_dashboard_after_submissions(client, task_id):
    # Submit correct solution
    await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "a, b = map(int, input().split())\nprint(a + b)"},
    )
    # Submit wrong solution
    await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "print('wrong')"},
    )

    resp = await client.get("/api/dashboard/")
    assert resp.status_code == 200
    data = resp.json()
    task_entry = next(t for t in data["tasks"] if t["task_id"] == task_id)
    assert task_entry["total_submissions"] >= 2
    assert 0.0 <= task_entry["pass_rate"] <= 1.0
    breakdown = task_entry["failure_mode_breakdown"]
    assert breakdown["PASS"] >= 1
    assert breakdown["WRONG_ANSWER"] >= 1


@pytest.mark.asyncio
async def test_dashboard_difficulty_filter(client):
    resp = await client.get("/api/dashboard/?difficulty=easy")
    assert resp.status_code == 200
    data = resp.json()
    for task in data["tasks"]:
        assert task["difficulty"] == "easy"


@pytest.mark.asyncio
async def test_dashboard_stats_empty(client):
    resp = await client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_tasks"] >= 3
    assert isinstance(data["total_submissions"], int)
    assert isinstance(data["overall_pass_rate"], float)


@pytest.mark.asyncio
async def test_dashboard_stats_after_submissions(client, task_id):
    await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "a, b = map(int, input().split())\nprint(a + b)"},
    )

    resp = await client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_submissions"] >= 1
    assert data["overall_pass_rate"] > 0.0


@pytest.mark.asyncio
async def test_failure_mode_at_least_one_semantics(client, task_id):
    """A submission with mixed results (some PASS, some WRONG_ANSWER) should
    count under both PASS and WRONG_ANSWER in the breakdown."""
    # Submit code that passes first test case but fails others
    # Two Sum test cases: "1 2"→"3", "0 0"→"0", "-5 10"→"5", "1000000 2000000"→"3000000"
    # This code always prints "3", so first test passes, rest fail
    await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "print(3)"},
    )

    resp = await client.get("/api/dashboard/")
    data = resp.json()
    task_entry = next(t for t in data["tasks"] if t["task_id"] == task_id)
    breakdown = task_entry["failure_mode_breakdown"]
    # This submission has at least one PASS and at least one WRONG_ANSWER
    assert breakdown["PASS"] >= 1
    assert breakdown["WRONG_ANSWER"] >= 1
