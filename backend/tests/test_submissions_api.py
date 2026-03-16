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
    """Get the first seed task's ID."""
    resp = await client.get("/api/tasks/")
    assert resp.status_code == 200
    tasks = resp.json()["tasks"]
    assert len(tasks) >= 1
    return tasks[0]["id"]


@pytest.mark.asyncio
async def test_phase1_endpoints_still_work(client):
    resp = await client.get("/api/tasks/")
    assert resp.status_code == 200
    tasks = resp.json()["tasks"]
    assert len(tasks) >= 3


@pytest.mark.asyncio
async def test_submit_correct_solution(client, task_id):
    resp = await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "a, b = map(int, input().split())\nprint(a + b)"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["task_id"] == task_id
    assert all(r["status"] == "PASS" for r in data["results"])
    assert all(r["passed"] is True for r in data["results"])
    assert data["summary"]["passed"] == data["summary"]["total"]
    assert data["summary"]["failed"] == 0


@pytest.mark.asyncio
async def test_submit_wrong_answer(client, task_id):
    resp = await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "a, b = map(int, input().split())\nprint(a + b + 1)"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert all(r["status"] == "WRONG_ANSWER" for r in data["results"])
    assert data["summary"]["failed"] == data["summary"]["total"]


@pytest.mark.asyncio
async def test_submit_runtime_error(client, task_id):
    resp = await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": 'int("abc")'},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert all(r["status"] == "RUNTIME_ERROR" for r in data["results"])
    assert all(r["error_message"] is not None for r in data["results"])


@pytest.mark.asyncio
async def test_submit_syntax_error(client, task_id):
    resp = await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "def foo("},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert all(r["status"] == "SYNTAX_ERROR" for r in data["results"])
    assert all(r["error_message"] is not None for r in data["results"])


@pytest.mark.asyncio
async def test_submit_nonexistent_task(client):
    resp = await client.post(
        "/api/tasks/nonexistent-id/submissions",
        json={"code": "print(1)"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_submit_empty_code(client, task_id):
    resp = await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": ""},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_submissions_for_task(client, task_id):
    # Create two submissions
    await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "print(1)"},
    )
    await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "print(2)"},
    )

    resp = await client.get(f"/api/tasks/{task_id}/submissions")
    assert resp.status_code == 200
    submissions = resp.json()["submissions"]
    assert len(submissions) >= 2
    # Newest first
    assert submissions[0]["created_at"] >= submissions[1]["created_at"]


@pytest.mark.asyncio
async def test_get_submissions_nonexistent_task(client):
    resp = await client.get("/api/tasks/nonexistent-id/submissions")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_submission_persists(client, task_id):
    post_resp = await client.post(
        f"/api/tasks/{task_id}/submissions",
        json={"code": "a, b = map(int, input().split())\nprint(a + b)"},
    )
    assert post_resp.status_code == 201
    submission_id = post_resp.json()["id"]

    get_resp = await client.get(f"/api/tasks/{task_id}/submissions")
    assert get_resp.status_code == 200
    ids = [s["id"] for s in get_resp.json()["submissions"]]
    assert submission_id in ids
