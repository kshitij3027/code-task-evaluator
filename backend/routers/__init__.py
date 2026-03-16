from routers.dashboard import router as dashboard_router
from routers.submissions import router as submissions_router
from routers.tasks import router as tasks_router

__all__ = ["tasks_router", "submissions_router", "dashboard_router"]
