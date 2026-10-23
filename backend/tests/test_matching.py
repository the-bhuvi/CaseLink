import pytest

from backend.app.services.matching import matching_service, normalize_text


class Vector:
    def __init__(self, value: float):
        self.value = value

    def __matmul__(self, other: "Vector") -> float:
        return self.value * other.value


def test_matching_exposes_evidence_and_separate_scores(monkeypatch):
    monkeypatch.setattr(matching_service, "_load_model", lambda: None)
    monkeypatch.setattr(matching_service, "_embedding", lambda text: Vector(0.9 if "payment" in text else 0.8))
    result = matching_service.compare(
        "Scholarship payment is delayed",
        "Scholarship disbursement is delayed",
        same_institution=True,
        same_category=True,
        cross_bureau=True,
    )
    assert result.semantic_similarity == pytest.approx(0.72)
    assert result.relationship_score > result.semantic_similarity
    assert result.evidence_signals
    assert not result.uncertainty


def test_matching_uncertainty_is_explicit_for_unconfirmed_institutions(monkeypatch):
    monkeypatch.setattr(matching_service, "_load_model", lambda: None)
    monkeypatch.setattr(matching_service, "_embedding", lambda text: Vector(0.5))
    result = matching_service.compare(
        "Infrastructure issue",
        "Infrastructure issue",
        same_institution=False,
        same_category=False,
        cross_bureau=False,
    )
    assert "institution identity was not confirmed" in result.uncertainty
    assert "complaint categories differ" in result.uncertainty


def test_normalization_is_stable():
    assert normalize_text("  Fee & Refund — Delay  ") == "fee refund delay"
