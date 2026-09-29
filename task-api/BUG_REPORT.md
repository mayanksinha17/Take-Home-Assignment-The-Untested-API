# Bug Report

## Bug 1: `completeTask` Overwrites Existing Task Priority to 'medium'
- **Location:** `src/services/taskService.js` (inside `completeTask`)
- **Problem:** When marking a task as complete via `completeTask(id)` (or `PATCH /tasks/:id/complete`), the function hardcodes `priority: 'medium'` into the updated task object, overwriting the original task priority (e.g., `'high'` or `'low'`).
- **Expected:** Completing a task should only update its `status` to `'done'` and set `completedAt` to the current timestamp, while preserving its existing `priority` and other properties.
- **Actual:** Any task completed had its priority reset to `'medium'`, causing high-priority completed tasks to lose their priority information.
- **How Discovered:** Discovered during codebase inspection and confirmed with unit tests in `tests/taskService.test.js` and integration tests in `tests/tasks.test.js` asserting that a completed high-priority task retains `priority: 'high'`.
- **Fix:** Removed `priority: 'medium'` from the updated object in `completeTask()`, allowing `...task` to retain its original priority value.
- **Regression Test:** 
  - Unit: `tests/taskService.test.js` (`marks task done, sets completedAt, and preserves original priority`)
  - Integration: `tests/tasks.test.js` (`marks task as completed, sets completedAt, and preserves priority`)

---

## Bug 2: `getPaginated` Calculates 0-based Offset Incorrectly for 1-based Page Numbers
- **Location:** `src/services/taskService.js` (inside `getPaginated`)
- **Problem:** The pagination offset was calculated as `const offset = page * limit;`. Because the API accepts 1-based page numbers (`?page=1&limit=10` as specified in documentation and route defaults), requesting page 1 calculated `offset = 1 * 10 = 10`, completely skipping the first 10 items (items 0 to 9).
- **Expected:** Requesting `?page=1&limit=10` should return items from index `0` to `9` (offset `0`).
- **Actual:** Requesting `?page=1&limit=2` returned tasks starting from index 2 (Task 3 and Task 4), skipping Task 1 and Task 2.
- **How Discovered:** Discovered via unit test `tests/taskService.test.js` and integration test `tests/tasks.test.js` for pagination.
- **Fix:** Updated offset calculation to `const offset = (pageNum - 1) * limitNum;` with `pageNum = Math.max(1, parseInt(page) || 1)` and `limitNum = Math.max(1, parseInt(limit) || 10)`.
- **Regression Test:**
  - Unit: `tests/taskService.test.js` (`returns first page of tasks for page=1`)
  - Integration: `tests/tasks.test.js` (`supports pagination with page and limit`)

---

## Bug 3: `getByStatus` Uses Substring Matching Instead of Exact Status Matching
- **Location:** `src/services/taskService.js` (inside `getByStatus`)
- **Problem:** The status filter was implemented as `tasks.filter((t) => t.status.includes(status));`. This performs a substring search rather than an exact equality check.
- **Expected:** Filtering by status (e.g. `?status=todo`) should only return tasks whose status strictly matches the queried status.
- **Actual:** Searching for partial strings (e.g. `do`) would return both `todo` and `done` tasks.
- **How Discovered:** Discovered during code review of `taskService.js`.
- **Fix Recommendation:** Replace `t.status.includes(status)` with `t.status === status`.
