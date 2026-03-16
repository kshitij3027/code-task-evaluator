# Phase 4: Advanced Frontend Features & Task Management

## Completed Commits

### Commit 1: Backend — PUT, DELETE, and Verify endpoints + tests
- Added `TaskUpdate` schema (all fields optional with validations)
- Added `get_task_with_solution`, `update_task`, `delete_task`, `verify_task` service functions
- Added `PUT /{task_id}`, `DELETE /{task_id}`, `POST /{task_id}/verify` routes
- 11 integration tests + 4 schema validation tests

### Commit 2: Frontend API client — putJSON/deleteJSON + tests
- Added `putJSON<T>()` and `deleteJSON()` to API client
- 4 unit tests covering success and error paths

### Commit 3: Monaco CodeEditor component + replace textareas
- Created `CodeEditor` wrapping `@monaco-editor/react` (Python syntax, Ctrl+Enter, minimap off)
- Replaced code textareas in TaskDetailPage and TaskCreatePage
- Created inline Monaco mocks for Vitest
- 2 component tests + updated page tests

### Commit 4: DiffView component for WRONG_ANSWER results
- Created `DiffView` using Monaco `DiffEditor` (side-by-side, read-only)
- ResultsDisplay now shows DiffView for WRONG_ANSWER, inline `<pre>` for others
- 2 component tests + 2 additional ResultsDisplay tests

### Commit 5: Task Edit/Delete/Verify UI on all pages
- TaskDetailPage: inline edit form, delete confirmation dialog, verify button
- TaskListPage: Edit/Delete buttons per card, inline delete confirmation
- DashboardPage: Actions column with Edit/Delete, click propagation stopped
- Updated all page tests

### Commit 6: UI polish + loading spinners + Toast + verification stories
- Created `Spinner` (CSS-only) and `Toast` (auto-dismiss) components
- Replaced `<p>Loading...</p>` with `<Spinner />` across all pages
- Added Toast for edit success feedback
- Extended verification stories (3 total: create+verify, submit+diff, edit+delete)
- 3 component tests (Spinner, Toast)

## Test Summary
- Backend: 62 tests passing
- Frontend: 38 tests passing
- All testing done inside Docker
