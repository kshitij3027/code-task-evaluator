import os
from pathlib import Path


class Settings:
    def __init__(self):
        self.BACKEND_PORT: int = int(os.environ.get("BACKEND_PORT", "8000"))
        self.DATABASE_URL: str = os.environ.get("DATABASE_URL", "./data/evaluator.db")
        self.EXEC_TIMEOUT_SECONDS: int = int(os.environ.get("EXEC_TIMEOUT_SECONDS", "5"))
        self.EXEC_MEMORY_LIMIT_MB: int = int(os.environ.get("EXEC_MEMORY_LIMIT_MB", "128"))
        self.MAX_OUTPUT_BYTES: int = int(os.environ.get("MAX_OUTPUT_BYTES", "10240"))

        # Ensure DB parent directory exists
        Path(self.DATABASE_URL).parent.mkdir(parents=True, exist_ok=True)


settings = Settings()
