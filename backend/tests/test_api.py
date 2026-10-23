from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.matching import normalize_text


client = TestClient(app)


def test_health_declares_supabase_only():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["database"] == "supabase-only"


def test_ready_requires_supabase_configuration():
    response = client.get("/ready")
    assert response.status_code in {200, 503}
    if response.status_code == 503:
        assert response.json()["detail"]["code"] in {
            "SUPABASE_NOT_CONFIGURED",
            "SUPABASE_SERVER_KEY_REQUIRED",
        }


def test_normalize_text_is_deterministic():
    assert normalize_text("  Fee & Refund — Delay  ") == "fee refund delay"
