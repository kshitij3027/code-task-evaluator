import json
from collections import defaultdict

import aiosqlite


async def get_dashboard(db: aiosqlite.Connection, difficulty: str | None = None) -> list[dict]:
    """Per-task aggregate stats for the dashboard."""
    # Query 1: per-task submission counts and pass counts
    if difficulty:
        cursor = await db.execute(
            """
            SELECT t.id AS task_id, t.title, t.difficulty,
                COUNT(s.id) AS total_submissions,
                COALESCE(SUM(CASE WHEN json_extract(s.summary, '$.passed') = json_extract(s.summary, '$.total')
                    THEN 1 ELSE 0 END), 0) AS all_pass_count
            FROM tasks t LEFT JOIN submissions s ON t.id = s.task_id
            WHERE t.difficulty = ?
            GROUP BY t.id, t.title, t.difficulty
            """,
            (difficulty,),
        )
    else:
        cursor = await db.execute(
            """
            SELECT t.id AS task_id, t.title, t.difficulty,
                COUNT(s.id) AS total_submissions,
                COALESCE(SUM(CASE WHEN json_extract(s.summary, '$.passed') = json_extract(s.summary, '$.total')
                    THEN 1 ELSE 0 END), 0) AS all_pass_count
            FROM tasks t LEFT JOIN submissions s ON t.id = s.task_id
            GROUP BY t.id, t.title, t.difficulty
            """
        )

    rows = await cursor.fetchall()
    task_stats = {}
    for row in rows:
        task_id = row["task_id"]
        total = row["total_submissions"]
        task_stats[task_id] = {
            "task_id": task_id,
            "title": row["title"],
            "difficulty": row["difficulty"],
            "total_submissions": total,
            "pass_rate": row["all_pass_count"] / total if total > 0 else 0.0,
        }

    # Query 2: failure mode breakdown (fetch results JSON, parse in Python)
    breakdown: dict[str, dict[str, int]] = defaultdict(lambda: {
        "PASS": 0, "WRONG_ANSWER": 0, "RUNTIME_ERROR": 0, "TIMEOUT": 0, "SYNTAX_ERROR": 0,
    })

    if difficulty:
        cursor2 = await db.execute(
            """
            SELECT s.task_id, s.results
            FROM submissions s JOIN tasks t ON s.task_id = t.id
            WHERE t.difficulty = ?
            """,
            (difficulty,),
        )
    else:
        cursor2 = await db.execute("SELECT task_id, results FROM submissions")

    sub_rows = await cursor2.fetchall()
    for sub_row in sub_rows:
        task_id = sub_row["task_id"]
        if task_id not in task_stats:
            continue
        results = json.loads(sub_row["results"])
        # Count each status that appears at least once in this submission
        statuses_in_submission = {r["status"] for r in results}
        for status in statuses_in_submission:
            if status in breakdown[task_id]:
                breakdown[task_id][status] += 1

    # Merge
    result = []
    for task_id, stats in task_stats.items():
        stats["failure_mode_breakdown"] = breakdown[task_id]
        result.append(stats)

    return result


async def get_overall_stats(db: aiosqlite.Connection) -> dict:
    """Overall aggregate stats across all tasks and submissions."""
    cursor = await db.execute(
        """
        SELECT
            (SELECT COUNT(*) FROM tasks) AS total_tasks,
            COUNT(*) AS total_submissions,
            COALESCE(SUM(CASE WHEN json_extract(summary, '$.passed') = json_extract(summary, '$.total')
                THEN 1 ELSE 0 END), 0) AS all_pass_count
        FROM submissions
        """
    )
    row = await cursor.fetchone()
    total_tasks = row["total_tasks"]
    total_submissions = row["total_submissions"]
    all_pass_count = row["all_pass_count"]

    return {
        "total_tasks": total_tasks,
        "total_submissions": total_submissions,
        "overall_pass_rate": all_pass_count / total_submissions if total_submissions > 0 else 0.0,
    }
