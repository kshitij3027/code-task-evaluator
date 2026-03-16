from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import init_db
from routers.tasks import router as tasks_router
from seed import seed_tasks
import aiosqlite


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with aiosqlite.connect(settings.DATABASE_URL) as db:
        await seed_tasks(db)
    yield


app = FastAPI(title="Code Task Evaluator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.BACKEND_PORT, reload=True)
