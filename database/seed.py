import random
from datetime import timedelta

from sqlalchemy import select

from backend.app.database import Base, SessionLocal, engine
from backend.app.models import Case, CaseAction, CaseRelationship, CaseStatus, Institution, Notification, ReviewStatus, Role, User, Visibility, utcnow
from backend.app.services.matching import normalize_text

random.seed(26264)
Base.metadata.create_all(engine)
db = SessionLocal()

try:
    if db.scalar(select(User).where(User.email == "admin@demo.caselink")):
        print("Synthetic seed already present")
    else:
        users = [
            User(email="complainant@demo.caselink", display_name="Demo Complainant", role=Role.complainant),
            User(email="rb.officer@demo.caselink", display_name="RB Officer", role=Role.officer, bureau_code="RB"),
            User(email="pgrc.officer@demo.caselink", display_name="PGRC Officer", role=Role.officer, bureau_code="PGRC"),
            User(email="supervisor@demo.caselink", display_name="Demo Supervisor", role=Role.supervisor),
            User(email="admin@demo.caselink", display_name="Demo Admin", role=Role.admin),
        ]
        db.add_all(users); db.flush()
        institutions = []
        for index in range(25):
            name = f"Synthetic Institute {index + 1:02d}"
            institutions.append(Institution(aicte_permanent_id=f"SYN-{index + 1:04d}", name=name, normalized_name=normalize_text(name), state="Synthetic State", district=f"District {(index % 5) + 1}", institution_type="Engineering College"))
        db.add_all(institutions); db.flush()
        statuses = list(CaseStatus)
        cases = []
        for index in range(125):
            institution = institutions[index % len(institutions)]
            bureau = "RB" if index % 2 == 0 else "PGRC"
            received = utcnow() - timedelta(days=(index * 3) % 90)
            description = f"Students report delayed scholarship processing and missing grievance response at {institution.name}."
            if index in {10, 11, 50, 51}: description = "Students report delayed scholarship processing and no response to repeated grievance submissions."
            item = Case(reference=f"CL-{utcnow().year}-{index + 1:05d}", institution_id=institution.id, submitted_institution_name=institution.name, submitted_institution_id=institution.aicte_permanent_id, category="Scholarship" if index % 3 == 0 else "Academic", subject=f"Synthetic complaint {index + 1}", description=description, assigned_bureau=bureau, assigned_officer_id=users[1 if bureau == "RB" else 2].id, status=statuses[index % len(statuses)], priority=["low", "medium", "high", "critical"][index % 4], received_at=received, due_at=received + timedelta(days=30), complainant_id=users[0].id, public_status=statuses[index % len(statuses)].replace("_", " ").title(), is_synthetic=True)
            cases.append(item)
        db.add_all(cases); db.flush()
        for item in cases:
            db.add(CaseAction(case_id=item.id, actor_id=item.assigned_officer_id, action_type="seeded", description="Synthetic case created for demonstration", new_status=item.status, visibility=Visibility.internal))
        for left, right in [(cases[10], cases[11]), (cases[50], cases[51])]:
            db.add(CaseRelationship(case_a_id=min(left.id, right.id, key=str), case_b_id=max(left.id, right.id, key=str), semantic_similarity=0.82, relationship_score=0.86, match_explanation="Synthetic paraphrase pair for review workflow.", evidence_json={"signals": ["same institution", "paraphrased complaint"]}, review_status=ReviewStatus.pending, model_version="synthetic-seed"))
        for officer in users[1:]:
            db.add(Notification(user_id=officer.id, type="overlap_alert", title="Synthetic overlap alerts available", message="Review the seeded cross-case relationship alerts."))
        db.commit()
        print(f"Seeded {len(institutions)} institutions and {len(cases)} cases")
finally:
    db.close()
