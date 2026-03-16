# Code Task Evaluator

A web application for creating coding tasks with test cases, submitting Python solutions, and viewing automated grading results with detailed pass/fail breakdowns.

Users create tasks (like "Two Sum" or "FizzBuzz"), define test cases with expected input/output, and submit Python solutions. The system executes each submission in a sandboxed subprocess, compares stdout against expected output, and displays results with five distinct failure modes.

## Quick Start

```bash
docker compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

The app ships with 3 pre-loaded seed tasks (easy, medium, hard) so you can start submitting solutions immediately.

## Table of Contents

- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Code Execution & Sandboxing](#code-execution--sandboxing)
- [Seed Tasks](#seed-tasks)
- [Frontend Pages](#frontend-pages)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Development Setup](#development-setup)
- [Design Decisions](#design-decisions)

## Architecture

```
┌──────────────────┐       ┌──────────────────────────────┐
│                  │  /api  │                              │
│  React + Vite    │───────>│  FastAPI + Uvicorn           │
│  TypeScript      │<───────│  Python 3.11                 │
│  Monaco Editor   │       │                              │
│  Port 5173       │       │  ┌────────────┐  ┌────────┐ │
│                  │       │  │ aiosqlite  │  │ sub-   │ │
└──────────────────┘       │  │ (SQLite)   │  │ process│ │
                           │  └────────────┘  └────────┘ │
                           │  Port 8000                    │
                           └──────────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite + TypeScript | SPA with Monaco code editor |
| Backend | FastAPI + Uvicorn | Async REST API |
| Database | SQLite via aiosqlite | Async file-based storage |
| Validation | Pydantic v2 | Request/response schemas |
| Code Execution | `subprocess.run()` | Sandboxed Python execution |
| Containerization | Docker Compose | Two-service orchestration |

No authentication — the app is a shared public tool by design.

## Project Structure

```
├── docker-compose.yml
├── Dockerfile                          # Backend container (Python 3.11-slim)
├── backend/
│   ├── main.py                         # FastAPI app, lifespan, CORS, router registration
│   ├── config.py                       # Environment variable settings
│   ├── db.py                           # SQLite DDL, connection factory
│   ├── seed.py                         # 3 pre-loaded tasks (easy/medium/hard)
│   ├── requirements.txt                # fastapi, uvicorn, aiosqlite, pydantic, pytest, httpx
│   ├── models/
│   │   ├── task.py                     # Difficulty enum (easy, medium, hard)
│   │   └── submission.py               # ResultStatus enum (5 statuses)
│   ├── schemas/
│   │   ├── task.py                     # TaskCreate, TaskUpdate, TaskResponse
│   │   ├── submission.py               # SubmissionCreate, SubmissionResponse, TestCaseResult
│   │   └── dashboard.py               # DashboardResponse, OverallStatsResponse
│   ├── services/
│   │   ├── executor.py                 # Code execution engine with sandbox
│   │   ├── task_service.py             # Task CRUD + verify
│   │   ├── submission_service.py       # Submission creation + listing
│   │   └── dashboard_service.py        # Aggregated stats
│   ├── routers/
│   │   ├── tasks.py                    # /api/tasks endpoints (CRUD + verify)
│   │   ├── submissions.py             # /api/tasks/:id/submissions
│   │   └── dashboard.py              # /api/dashboard endpoints
│   └── tests/
│       ├── conftest.py                 # Shared fixtures
│       ├── test_executor.py            # 18 tests: all 5 statuses, import blocking, metadata
│       ├── test_task_crud_api.py       # 11 tests: update, delete (cascade), verify
│       ├── test_submissions_api.py     # 10 tests: submit, list, persist, error cases
│       ├── test_dashboard_api.py       # 6 tests: stats, filters, failure modes
│       ├── test_db.py                  # 3 tests: table creation, idempotency
│       └── test_schemas.py            # 14 tests: validation, round-trips
├── frontend/
│   ├── Dockerfile                      # Frontend container (Node 20-alpine)
│   ├── package.json                    # react, react-router-dom, @monaco-editor/react
│   ├── vite.config.ts                  # Dev server + /api proxy to backend
│   └── src/
│       ├── App.tsx                     # Route definitions
│       ├── api/client.ts               # fetchJSON, postJSON, putJSON, deleteJSON
│       ├── types/index.ts              # TypeScript interfaces
│       ├── components/
│       │   ├── Layout.tsx              # Navigation bar
│       │   ├── CodeEditor.tsx          # Monaco Editor wrapper (Python, Ctrl+Enter)
│       │   ├── ResultsDisplay.tsx      # Test results table with status badges
│       │   ├── DiffView.tsx            # Monaco DiffEditor for wrong answers
│       │   ├── Spinner.tsx             # CSS loading spinner
│       │   └── Toast.tsx               # Auto-dismiss notification
│       └── pages/
│           ├── DashboardPage.tsx       # Stats bar, task table, filters, actions
│           ├── TaskListPage.tsx        # Task card grid with edit/delete
│           ├── TaskCreatePage.tsx      # Task creation form
│           └── TaskDetailPage.tsx      # View, edit, delete, verify, submit, history
└── verification/
    └── stories.yaml                    # 3 end-to-end user workflows
```

## How It Works

### The stdin/stdout Contract

Solutions communicate via standard I/O:

1. Your code reads test input from **stdin** (e.g., `input()`)
2. Your code prints output to **stdout** (e.g., `print()`)
3. The system compares your stdout against the expected output (trailing whitespace stripped)

The system never inspects your source code. Variable names, algorithms, and coding style are irrelevant — only the output matters.

### Grading Pipeline

```
User submits code
        │
        ▼
   Syntax check (compile())
        │ fail → SYNTAX_ERROR for all test cases
        ▼
   Import blocker prepended
        │
        ▼
   For each test case:
        │
        ├──► subprocess.run(code, stdin=input, timeout=5s)
        │         │
        │         ├── Timeout? → TIMEOUT
        │         ├── Non-zero exit? → RUNTIME_ERROR
        │         └── Clean exit → Compare output
        │                              │
        │                              ├── Match → PASS
        │                              └── Mismatch → WRONG_ANSWER
        ▼
   Return results + summary
```

### Five Result Statuses

| Status | Meaning | Displayed As |
|--------|---------|-------------|
| `PASS` | Output matches expected exactly | Green badge |
| `WRONG_ANSWER` | Code ran but output differs | Red badge + side-by-side diff |
| `RUNTIME_ERROR` | Exception during execution | Orange badge + error message |
| `TIMEOUT` | Exceeded 5-second limit | Yellow badge |
| `SYNTAX_ERROR` | Code fails to compile | Purple badge + error message |

## API Reference

### Tasks

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/api/tasks/` | Create task | 201 |
| `GET` | `/api/tasks/` | List tasks (optional `?difficulty=easy`) | 200 |
| `GET` | `/api/tasks/{id}` | Get task (no reference solution exposed) | 200/404 |
| `PUT` | `/api/tasks/{id}` | Partial update (any field optional) | 200/404/422 |
| `DELETE` | `/api/tasks/{id}` | Delete task + cascade submissions | 204/404 |
| `POST` | `/api/tasks/{id}/verify` | Run reference solution (not stored) | 200/404 |

**Create Task Request:**
```json
{
  "title": "Two Sum",
  "description": "Read two integers, print their sum",
  "reference_solution": "a, b = map(int, input().split())\nprint(a + b)",
  "test_cases": [
    { "input": "1 2", "expected_output": "3" },
    { "input": "0 0", "expected_output": "0" }
  ],
  "difficulty": "easy"
}
```

**Task Response** (reference_solution never included):
```json
{
  "id": "uuid-here",
  "title": "Two Sum",
  "description": "Read two integers, print their sum",
  "test_cases": [{ "input": "1 2", "expected_output": "3" }],
  "difficulty": "easy",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### Submissions

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/api/tasks/{id}/submissions` | Submit code for grading | 201/404 |
| `GET` | `/api/tasks/{id}/submissions` | List submissions (newest first) | 200/404 |

**Submit Request:**
```json
{ "code": "a, b = map(int, input().split())\nprint(a + b)" }
```

**Submission Response:**
```json
{
  "id": "submission-uuid",
  "task_id": "task-uuid",
  "results": [
    {
      "test_case_index": 0,
      "passed": true,
      "expected_output": "3",
      "actual_output": "3",
      "execution_time_ms": 12,
      "status": "PASS",
      "error_message": null
    }
  ],
  "summary": { "passed": 1, "failed": 0, "total": 1 },
  "created_at": "2026-01-01T00:00:00Z"
}
```

### Dashboard

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/api/dashboard/` | Per-task stats (optional `?difficulty=`) | 200 |
| `GET` | `/api/dashboard/stats` | Overall aggregated stats | 200 |

**Dashboard Stats Response:**
```json
{
  "total_tasks": 3,
  "total_submissions": 42,
  "overall_pass_rate": 0.65
}
```

## Code Execution & Sandboxing

Submissions run in isolated `subprocess.run()` calls with these protections:

### Import Blocking

A custom import hook is prepended to all user code, blocking dangerous modules:

- `os` — filesystem/process access
- `subprocess` — command execution
- `pathlib` — filesystem traversal
- `shutil` — file operations
- `ctypes` — C-level access
- `socket` — network access

Both `import os` and `__import__('os')` are blocked. Violations produce a `RUNTIME_ERROR` with an "Import not allowed" message. Safe modules like `json`, `math`, `collections` work normally.

### Execution Limits

| Limit | Default | Env Var |
|-------|---------|---------|
| Timeout | 5 seconds | `EXEC_TIMEOUT_SECONDS` |
| Output size | 10 KB | `MAX_OUTPUT_BYTES` |
| Memory | 128 MB (defined) | `EXEC_MEMORY_LIMIT_MB` |

Each test case runs as a separate subprocess — a timeout on one test case doesn't affect others.

## Seed Tasks

Three tasks are auto-inserted on first startup:

| Task | Difficulty | Test Cases | Description |
|------|-----------|------------|-------------|
| **Two Sum** | Easy | 4 | Read two integers, print their sum |
| **FizzBuzz** | Medium | 4 | Classic FizzBuzz from 1 to N |
| **Longest Common Subsequence** | Hard | 4 | DP problem — print LCS length of two strings |

## Frontend Pages

### Dashboard (`/`)

The home page showing overall statistics and a task overview table.

- **Stats bar:** Total Tasks, Total Submissions, Overall Pass Rate (color-coded)
- **Task table:** Title, difficulty badge, submission count, pass rate, failure mode breakdown, Edit/Delete actions
- **Difficulty filter:** Dropdown to filter by easy/medium/hard
- Click any row to navigate to the task detail page

### Task List (`/tasks`)

Card grid view of all tasks.

- Each card shows title, difficulty badge, truncated description
- Edit and Delete buttons per card (Delete shows inline confirmation)
- "Create Task" button at the top

### Create Task (`/tasks/new`)

Form to create a new coding task.

- Title, description (text inputs)
- Difficulty dropdown (easy/medium/hard)
- Reference solution — **Monaco code editor** with Python syntax highlighting
- Test cases — dynamic list with Add/Remove (minimum 1 required)
- On submit, redirects to the new task's detail page

### Task Detail (`/tasks/:taskId`)

The main workspace for a task. Sections:

- **Header:** Title, difficulty badge, Edit/Delete buttons
- **Edit mode:** Inline form to update any field (Toast notification on save)
- **Delete:** Confirmation dialog; cascades to remove all submissions
- **Test cases table:** Numbered list of input/expected output
- **Verify Reference Solution:** Runs stored solution as a dry run (not saved)
- **Code editor:** Monaco Editor with Python syntax, Ctrl+Enter to submit
- **Results:** Status badges per test case, diff view for wrong answers, execution times
- **Submission history:** Collapsible list of all past submissions

## Configuration

All settings are configurable via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `8000` | FastAPI server port |
| `FRONTEND_PORT` | `5173` | Vite dev server port |
| `DATABASE_URL` | `./data/evaluator.db` | SQLite database file path |
| `EXEC_TIMEOUT_SECONDS` | `5` | Per-test-case execution timeout |
| `EXEC_MEMORY_LIMIT_MB` | `128` | Memory limit (defined, not enforced) |
| `MAX_OUTPUT_BYTES` | `10240` | Maximum captured stdout/stderr size |

## Running Tests

All tests run inside Docker:

```bash
# Build and start containers
docker compose up --build -d

# Backend tests (62 tests)
docker compose exec backend pytest tests/ -v

# Frontend tests (38 tests)
docker compose exec frontend npm test
```

### Test Coverage

**Backend (62 tests across 7 files):**

| File | Tests | Covers |
|------|-------|--------|
| `test_executor.py` | 18 | All 5 result statuses, import blocking (6 modules), safe imports, execution metadata |
| `test_task_crud_api.py` | 11 | PUT (partial update, validation), DELETE (cascade), Verify (dry run) |
| `test_submissions_api.py` | 10 | Submit correct/wrong/error/syntax code, list submissions, persistence |
| `test_dashboard_api.py` | 6 | Stats aggregation, difficulty filter, failure mode breakdown |
| `test_schemas.py` | 14 | Pydantic validation, round-trips, TaskUpdate optionality |
| `test_db.py` | 3 | Table creation, idempotency, column structure |

**Frontend (38 tests across 11 files):**

| File | Tests | Covers |
|------|-------|--------|
| `client.test.ts` | 4 | putJSON/deleteJSON success and error paths |
| `CodeEditor.test.tsx` | 2 | Renders wrapper, onChange callback |
| `DiffView.test.tsx` | 2 | Labels, content display |
| `ResultsDisplay.test.tsx` | 6 | Summary bar, badges, errors, times, diff for wrong answers |
| `Spinner.test.tsx` | 1 | Renders spinner element |
| `Toast.test.tsx` | 2 | Renders message, auto-dismisses |
| `DashboardPage.test.tsx` | 5 | Stats, table, filter, failure badges, actions column |
| `TaskListPage.test.tsx` | 4 | Cards, badges, create button, delete buttons |
| `TaskCreatePage.test.tsx` | 5 | Form fields, test cases, add/remove, required attributes |
| `TaskDetailPage.test.tsx` | 5 | Title, test cases, editor, submit, edit/delete/verify buttons |
| `App.test.tsx` | 2 | Route rendering |

## Development Setup

### With Docker (recommended)

```bash
docker compose up --build
```

Frontend source is volume-mounted for hot reload. Backend requires `docker compose up --build` after code changes.

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8000` (when running locally, update `vite.config.ts` target from `http://backend:8000` to `http://localhost:8000`).

## Design Decisions

### Why SQLite?

Simplest possible persistence for an MVP. File-based, zero-config, async via `aiosqlite`. Test cases and results stored as JSON columns — avoids a complex relational schema while keeping queries simple.

### Why subprocess instead of Docker-based sandboxing?

For an MVP, `subprocess.run()` with timeouts and import blocking provides a practical sandbox without the overhead of spinning up containers per submission. The import blocker prevents access to `os`, `subprocess`, `pathlib`, `shutil`, `ctypes`, and `socket`. This is not production-grade isolation but is sufficient for a demo/evaluation tool.

### Why are reference solutions hidden from the API?

The `reference_solution` field is stored in the database but deliberately excluded from all `TaskResponse` schemas. This prevents users from simply fetching the answer via the API. The verify endpoint runs the reference solution server-side and returns only the results.

### Why Monaco Editor?

Monaco provides a real code editing experience — syntax highlighting, line numbers, proper indentation, and keyboard shortcuts (Ctrl+Enter to submit). The DiffEditor is reused for WRONG_ANSWER results to show side-by-side expected vs actual output. Both Editor and DiffEditor come from the same `@monaco-editor/react` package.

### Why no authentication?

The spec defines this as a shared public tool. Adding auth would add complexity without serving the core use case of task creation and code evaluation.

### Why five distinct failure modes?

Granular feedback helps users debug faster:
- **SYNTAX_ERROR** — "Your code doesn't compile" (check before running)
- **RUNTIME_ERROR** — "Your code crashes" (with error message)
- **TIMEOUT** — "Your code is too slow" (infinite loops, O(n!) algorithms)
- **WRONG_ANSWER** — "Your code runs but gives wrong output" (with diff view)
- **PASS** — "Correct!"

The dashboard aggregates these per task, making it easy to spot tasks that commonly cause timeouts vs wrong answers.
