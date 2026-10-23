from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./caselink.db"
    jwt_secret: str = "development-secret-change-me"
    jwt_expires_minutes: int = 30
    ai_model_name: str = "all-MiniLM-L6-v2"
    ai_model_version: str = "all-MiniLM-L6-v2"
    storage_bucket: str = "caselink-private"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")


settings = Settings()

