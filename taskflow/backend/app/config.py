import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./taskflow.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-please-change")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
