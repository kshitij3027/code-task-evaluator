# Code Task Evaluator — Project Requirements

## 1. Project Overview

**Project Name:** Code Task Evaluator

**One-Line Description:** A web application where users create coding tasks with test cases, submit Python solutions, and view grading results with pass/fail breakdowns on a dashboard.

**How It Runs:** Web App — Python backend (FastAPI) serving a REST API, with a Node.js/React frontend, and Docker used to sandbox code execution.

---

## 2. Core Requirements

These are the minimum requirements drawn directly from the main task body.

**Task Management:**
- [ ] Users can create a coding task with a title and description (problem statement)
- [ ] Each task stores a reference solution (Python code)
- [ ] Each task includes test cases defined as input/output pairs
- [ ] Each task has a difficulty rating (one of: easy, medium, hard)
- [ ] The system ships with at least 3 pre-loaded example tasks spanning varying difficulties

**Submission & Grading:**
- [ ] Users can submit Python code solutions against any existing task
- [ ] Submitted code is executed against all of the task's test cases
- [ ] The system reports which individual test cases passed and which failed
- [ ] Execution time is measured and displayed per test case
- [ ] The system handles timeout failures (code that runs too long)
- [ ] The system handles runtime errors (exceptions, crashes)
- [ ] The system handles wrong output (code runs but produces incorrect result)

**Results Dashboard:**
- [ ] A dashboard page lists all tasks with their aggregate pass rates across submissions
- [ ] Each task has a per-task breakdown showing common failure modes (timeout, runtime error, wrong output)
- [ ] Dashboard supports filtering tasks by difficulty level

**Sandboxing:**
- [ ] Code execution is sandboxed — at minimum: enforced timeout and no file system access for submitted code

**Documentation:**
- [ ] Include a README explaining architecture decisions

---

## 3. Extended Requirements (Homework / Enhancements)

The original task does not break out explicit homework or extension sections, but the evaluation criteria imply deeper architectural quality. These are inferred enhancements grouped by area.

**Code Organization & Architecture:**
- [ ] Clear separation between API layer, business logic, and code execution engine
- [ ] Modular project structure (routers, models, services, schemas in distinct modules)
- [ ] Every architectural decision should be explainable and documented

**Failure Mode Depth:**
- [ ] Distinguish and label each failure mode clearly in API responses (e.g., `TIMEOUT`, `RUNTIME_ERROR`, `WRONG_ANSWER`, `PASS`)
- [ ] Capture and return stderr/traceback for runtime errors to aid debugging
- [ ] Handle compilation/syntax errors as a distinct failure mode before execution

**Dashboard Enhancements:**
- [ ] Show submission history per task (list of past submissions with timestamps and results)
- [ ] Display overall statistics (total submissions, overall pass rate)

---

## 4. Bonus / Stretch Goals

Nice-to-haves not explicitly required but that would elevate the project.

- [ ] Run submitted code inside a disposable Docker container for stronger sandboxing (resource limits, network isolation, filesystem isolation)
- [ ] Support memory limit enforcement in addition to time limits
- [ ] Allow users to edit or delete tasks
- [ ] Syntax-highlighted code editor on the frontend (e.g., Monaco or CodeMirror)
- [ ] Side-by-side diff of expected vs. actual output on failed test cases
- [ ] Rate limiting on submissions to prevent abuse
- [ ] Persist data in a real database (PostgreSQL/SQLite) instead of in-memory
- [ ] Allow users to run only the reference solution to auto-verify test case correctness on task creation

---

## 5. Success Criteria

- [ ] A user can create a new task via the UI with title, description, reference solution, test cases, and difficulty
- [ ] A user can submit Python code to a task and receive a per-test-case pass/fail report with execution times
- [ ] A submission that times out is reported as a timeout (not a crash or hang)
- [ ] A submission that raises an exception is reported as a runtime error with the error message
- [ ] A submission that produces wrong output is reported as wrong answer, showing expected vs. actual
- [ ] The dashboard lists all tasks with correct aggregate pass rates
- [ ] The dashboard filters correctly by easy, medium, and hard
- [ ] The 3 pre-loaded example tasks are present on first launch without manual setup
- [ ] The README accurately describes the architecture and key decisions

---

## 6. Technical Needs

| Category                         | Details                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Language / Runtime**           | Python 3.11+ (backend — FastAPI), Node.js (frontend — React + Vite + TypeScript)                         |
| **External Libraries (Backend)** | `fastapi`, `uvicorn`, `pydantic` (API & validation); `aiosqlite` (async SQLite); no Docker SDK needed — using `subprocess` for sandboxing |
| **External Libraries (Frontend)**| `react`, `react-router`, `axios` or `fetch`, optionally a code editor lib (Monaco/CodeMirror)            |
| **Infrastructure**               | None beyond what's already installed — SQLite is file-based, subprocess is stdlib                        |
| **Already Have**                 | Python, Node.js, Docker Desktop (available but not used for sandboxing in MVP)                           |
| **Need to Install**              | Python packages via `pip` (`fastapi`, `uvicorn`, `aiosqlite`), Node packages via `npm`                  |

---

## 7. Configurable Parameters

| Parameter                        | Default             | Configured Via               |
| -------------------------------- | ------------------- | ---------------------------- |
| Backend port                     | `8000`              | Env var (`BACKEND_PORT`)     |
| Frontend dev server port         | `5173`              | Env var (`FRONTEND_PORT`)    |
| Code execution timeout (seconds) | `5`                 | Env var (`EXEC_TIMEOUT_SECONDS`) |
| Code execution memory limit (MB) | `128`               | Env var (`EXEC_MEMORY_LIMIT_MB`) |
| Maximum output size (bytes)      | `10240`             | Env var (`MAX_OUTPUT_BYTES`) |
| Database path (SQLite file)      | `./data/evaluator.db` | Env var (`DATABASE_URL`)   |
| Number of pre-loaded seed tasks  | `3`                 | Hardcoded in seed script     |

---

## 8. Input / Output Spec

**Inputs:**
- Task creation: title (string), description (string), reference solution (Python code string), test cases (list of `{input: string, expected_output: string}`), difficulty (`easy` | `medium` | `hard`)
- Submission: task ID (reference to existing task), submitted code (Python code string)

**Outputs:**
- Task creation: the created task object with an assigned ID
- Submission result: list of per-test-case results, each containing `{test_case_index, passed (bool), expected_output, actual_output, execution_time_ms, status (PASS | WRONG_ANSWER | RUNTIME_ERROR | TIMEOUT)}`
- Dashboard: list of tasks with `{task_id, title, difficulty, total_submissions, pass_rate, failure_mode_breakdown}`

**Output Format(s):** JSON (REST API responses)

**Sample Output (submission result):**
```json
{
  "task_id": "abc123",
  "results": [
    {"test_case": 1, "status": "PASS", "execution_time_ms": 12},
    {"test_case": 2, "status": "WRONG_ANSWER", "expected": "6", "actual": "5", "execution_time_ms": 8},
    {"test_case": 3, "status": "TIMEOUT", "execution_time_ms": 5000}
  ],
  "summary": {"passed": 1, "failed": 2, "total": 3}
}
```

---

## 9. Open Questions / Ambiguities

> **Resolved decisions are marked with ✅**

- ✅ **User identity / auth:** No authentication. No user accounts. The app is a shared public tool — anyone can create tasks, submit solutions, and view the dashboard. Submissions are anonymous. This avoids significant scope creep (login flows, sessions, protected routes) and nothing in the requirements depends on knowing who did what.
- ✅ **User separation:** Not needed. There is no feature in the spec that requires distinguishing user A from user B. Tasks are global, submission results are returned inline to the submitter, and the dashboard shows aggregate stats. No users table, no sessions, no cookies.
- ✅ **Test case authorship:** Test cases are provided by the task creator as part of task creation. The system does not generate or infer test cases. The reference solution exists for the creator's confidence that their test cases are correct.
- ✅ **Persistence model:** SQLite via `aiosqlite`. Single file, zero infrastructure, works natively with FastAPI's async. Tables are created on first run in a `db.py` module. No Docker database container, no connection pooling, no migrations tool. Data survives restarts and the 3 seed tasks only need to be inserted once.
- ✅ **Test case format:** stdin/stdout. Submitted code reads from `stdin` and prints to `stdout`. The system pipes test case input in via subprocess stdin and compares captured stdout against expected output (stripped of trailing whitespace). No function signature contracts, no import conventions, no argument parsing.
- ✅ **Reference solution visibility:** Stored in the database but never exposed in API responses. The "get task" and "list tasks" endpoints exclude it from the Pydantic response model. Zero extra work — just omit the field from the response schema.
- ✅ **Concurrent submissions:** No special handling. FastAPI is async by default so simultaneous API requests work fine. Each submission's code execution runs sequentially via `subprocess` — at take-home test scale, no one is load-testing with 50 concurrent users. No task queue, no worker pool, no concurrency limiter.
- ✅ **Sandboxing depth:** `subprocess.run()` with `timeout` parameter. This directly satisfies the "at minimum: timeout handling" requirement. For "no file system access," use a lightweight Python wrapper that blocks dangerous imports (`os`, `subprocess`, `pathlib`, `shutil`, etc.) before executing the submitted code. Not bulletproof, but satisfies the spec's "at minimum" bar. The README will note that production would use Docker container isolation and explain why subprocess was chosen for the MVP.

---

## 10. Notes

- The evaluation criteria emphasize *explainability* of architectural decisions — the README is not an afterthought, it's a graded deliverable.
- "Any frontend approach" gives full latitude — a React SPA is the plan given the Node.js setup, but a minimal Jinja2 template approach would also satisfy the spec.
- The 3 pre-loaded tasks should cover all three difficulty levels and ideally exercise different failure modes (one that's easy to timeout on, one that's prone to edge-case runtime errors, etc.).
- **No auth, no users** — this is a deliberate scope decision. The data model is just `tasks` and `submissions`. This saves roughly an hour of implementation time and keeps the schema clean.
- **subprocess over Docker for sandboxing** — Docker-as-sandbox adds real complexity (pulling images, container management, Docker SDK errors, startup latency per test case). subprocess with timeout + import blocking hits the spec's "at minimum" bar and saves ~30 min of implementation. The README explains the trade-off.
- **SQLite over in-memory** — trivial to set up, data survives restarts, seed tasks only need inserting once. `aiosqlite` keeps it async-compatible with FastAPI.
- **stdin/stdout contract** — the simplest possible interface for code execution. No function signatures, no imports, no argument parsing. Universal and easy to explain.
- This project fits the existing backend-labs mono-repo structure as a standalone mini-project.
