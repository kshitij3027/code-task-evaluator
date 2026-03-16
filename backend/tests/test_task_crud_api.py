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
    tasks = resp.json()["tasks"]
    return tasks[0]["id"]


@pytest_asyncio.fixture
async def created_task_id(client):
    """Create a disposable task for mutation tests."""
    resp = await client.post("/api/tasks/", json={
        "title": "Temp Task",
        "description": "Disposable task for testing",
        "reference_solution": "print(int(input()) * 2)",
        "test_cases": [{"input": "3", "expected_output": "6"}, {"input": "0", "expected_output": "0"}],
        "difficulty": "easy",
    })
    return resp.json()["id"]


@pytest.mark.asyncio
class TestUpdateTask:
    async def test_update_title(self, client, created_task_id):
        resp = await client.put(
            f"/api/tasks/{created_task_id}",
            json={"title": "Updated Title"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "Disposable task for testing"

    async def test_partial_update_description(self, client, created_task_id):
        resp = await client.put(
            f"/api/tasks/{created_task_id}",
            json={"description": "New description"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["description"] == "New description"
        assert data["title"] == "Temp Task"

    async def test_update_test_cases(self, client, created_task_id):
        new_cases = [{"input": "5", "expected_output": "10"}]
        resp = await client.put(
            f"/api/tasks/{created_task_id}",
            json={"test_cases": new_cases},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["test_cases"]) == 1
        assert data["test_cases"][0]["input"] == "5"

    async def test_update_not_found(self, client):
        resp = await client.put(
            "/api/tasks/nonexistent",
            json={"title": "Nope"},
        )
        assert resp.status_code == 404

    async def test_update_empty_title_rejected(self, client, created_task_id):
        resp = await client.put(
            f"/api/tasks/{created_task_id}",
            json={"title": ""},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestDeleteTask:
    async def test_delete_success(self, client, created_task_id):
        resp = await client.delete(f"/api/tasks/{created_task_id}")
        assert resp.status_code == 204

        get_resp = await client.get(f"/api/tasks/{created_task_id}")
        assert get_resp.status_code == 404

    async def test_delete_cascades_submissions(self, client, created_task_id):
        await client.post(
            f"/api/tasks/{created_task_id}/submissions",
            json={"code": "print(int(input()) * 2)"},
        )
        resp = await client.delete(f"/api/tasks/{created_task_id}")
        assert resp.status_code == 204

    async def test_delete_not_found(self, client):
        resp = await client.delete("/api/tasks/nonexistent")
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestVerifyTask:
    async def test_verify_seed_task_passes(self, client, task_id):
        resp = await client.post(f"/api/tasks/{task_id}/verify")
        assert resp.status_code == 200
        data = resp.json()
        assert data["summary"]["passed"] == data["summary"]["total"]
        assert all(r["status"] == "PASS" for r in data["results"])

    async def test_verify_not_found(self, client):
        resp = await client.post("/api/tasks/nonexistent/verify")
        assert resp.status_code == 404

    async def test_verify_not_stored_in_submissions(self, client, created_task_id):
        await client.post(f"/api/tasks/{created_task_id}/verify")
        resp = await client.get(f"/api/tasks/{created_task_id}/submissions")
        assert resp.status_code == 200
        assert len(resp.json()["submissions"]) == 0
