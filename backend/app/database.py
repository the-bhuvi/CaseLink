from collections.abc import Generator

from fastapi import HTTPException
from supabase import Client, create_client

from .config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "SUPABASE_NOT_CONFIGURED",
                "message": "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured on the backend.",
                "fields": {},
            },
        )
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


def reset_client() -> None:
    global _client
    _client = None


def get_db() -> Generator[Client, None, None]:
    yield get_supabase()
