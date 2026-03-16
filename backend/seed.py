import json
import uuid
from datetime import datetime, timezone

import aiosqlite

SEED_TASKS = [
    {
        "title": "Two Sum",
        "description": "Read two space-separated integers from stdin and print their sum.",
        "reference_solution": "a, b = map(int, input().split())\nprint(a + b)",
        "test_cases": [
            {"input": "1 2", "expected_output": "3"},
            {"input": "0 0", "expected_output": "0"},
            {"input": "-5 10", "expected_output": "5"},
            {"input": "1000000 2000000", "expected_output": "3000000"},
        ],
        "difficulty": "easy",
    },
    {
        "title": "FizzBuzz",
        "description": (
            "Read an integer N from stdin. For each number from 1 to N (inclusive), "
            "print 'FizzBuzz' if divisible by both 3 and 5, 'Fizz' if divisible by 3, "
            "'Buzz' if divisible by 5, or the number itself. Each on a new line."
        ),
        "reference_solution": (
            "n = int(input())\n"
            "for i in range(1, n + 1):\n"
            "    if i % 15 == 0:\n"
            "        print('FizzBuzz')\n"
            "    elif i % 3 == 0:\n"
            "        print('Fizz')\n"
            "    elif i % 5 == 0:\n"
            "        print('Buzz')\n"
            "    else:\n"
            "        print(i)"
        ),
        "test_cases": [
            {"input": "1", "expected_output": "1"},
            {"input": "5", "expected_output": "1\n2\nFizz\n4\nBuzz"},
            {"input": "15", "expected_output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz"},
            {"input": "3", "expected_output": "1\n2\nFizz"},
        ],
        "difficulty": "medium",
    },
    {
        "title": "Longest Common Subsequence",
        "description": (
            "Read two strings from stdin (one per line). Print the length of their "
            "longest common subsequence."
        ),
        "reference_solution": (
            "s1 = input()\n"
            "s2 = input()\n"
            "m, n = len(s1), len(s2)\n"
            "dp = [[0] * (n + 1) for _ in range(m + 1)]\n"
            "for i in range(1, m + 1):\n"
            "    for j in range(1, n + 1):\n"
            "        if s1[i-1] == s2[j-1]:\n"
            "            dp[i][j] = dp[i-1][j-1] + 1\n"
            "        else:\n"
            "            dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n"
            "print(dp[m][n])"
        ),
        "test_cases": [
            {"input": "abcde\nace", "expected_output": "3"},
            {"input": "abc\nabc", "expected_output": "3"},
            {"input": "abc\ndef", "expected_output": "0"},
            {"input": "abcbdab\nbdcaba", "expected_output": "4"},
        ],
        "difficulty": "hard",
    },
]


async def seed_tasks(db: aiosqlite.Connection):
    cursor = await db.execute("SELECT COUNT(*) FROM tasks")
    row = await cursor.fetchone()
    if row[0] > 0:
        return

    now = datetime.now(timezone.utc).isoformat()
    for task in SEED_TASKS:
        await db.execute(
            """
            INSERT INTO tasks (id, title, description, reference_solution, test_cases, difficulty, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                task["title"],
                task["description"],
                task["reference_solution"],
                json.dumps(task["test_cases"]),
                task["difficulty"],
                now,
            ),
        )
    await db.commit()
