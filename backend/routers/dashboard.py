from fastapi import APIRouter, Depends

import aiosqlite

from db import get_db_connection
from models.task import Difficulty
from schemas.dashboard import DashboardResponse, OverallStatsResponse
from services.dashboard_service import get_dashboard, get_overall_stats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardResponse)
async def get_dashboard_endpoint(
    difficulty: Difficulty | None = None,
    db: aiosqlite.Connection = Depends(get_db_connection),
):
    tasks = await get_dashboard(db, difficulty.value if difficulty else None)
    return DashboardResponse(tasks=tasks)


@router.get("/stats", response_model=OverallStatsResponse)
async def get_overall_stats_endpoint(
    db: aiosqlite.Connection = Depends(get_db_connection),
):
    return await get_overall_stats(db)
