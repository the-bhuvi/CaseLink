import os
os.environ["DATABASE_URL"] = "sqlite:///./test-caselink.db"
from fastapi.testclient import TestClient
from backend.app.database import Base, engine
from backend.app.main import app

Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
client = TestClient(app)


def login(email="complainant@demo.caselink", role="complainant"):
    response = client.post("/api/v1/auth/demo-login", json={"email": email, "role": role})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_health_and_auth():
    assert client.get("/health").json()["status"] == "ok"
    token = login()
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200


def test_complaint_ownership_and_public_timeline():
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/v1/public/complaints", headers=headers, json={"institution_name": "Demo College", "category": "Academic", "subject": "Missing response", "description": "The institution did not respond to my complaint for several weeks."})
    assert response.status_code == 201
    case_id = response.json()["id"]
    timeline = client.get(f"/api/v1/public/complaints/{case_id}/timeline", headers=headers)
    assert timeline.status_code == 200
    assert timeline.json()[0]["action_type"] == "submitted"


def test_officer_is_required_for_case_list():
    token = login()
    assert client.get("/api/v1/cases", headers={"Authorization": f"Bearer {token}"}).status_code == 403
