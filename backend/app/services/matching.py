import re
from dataclasses import dataclass

from ..config import settings


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", value.lower())).strip()


@dataclass
class MatchResult:
    semantic_similarity: float
    relationship_score: float
    explanation: str
    evidence_signals: list[str]
    model_version: str


class MatchingService:
    def __init__(self) -> None:
        self.model = None
        self.ready = False

    def _load_model(self) -> None:
        if self.model is not None or self.ready:
            return
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(settings.ai_model_name)
            self.ready = True
        except Exception:
            self.model = False

    def compare(self, left: str, right: str, same_institution: bool = False) -> MatchResult:
        a, b = normalize_text(left), normalize_text(right)
        signals = []
        self._load_model()
        if same_institution:
            signals.append("same normalized institution")
        if self.ready:
            vectors = self.model.encode([a, b], normalize_embeddings=True)
            similarity = float(vectors[0] @ vectors[1])
            version = settings.ai_model_version
        else:
            left_words, right_words = set(a.split()), set(b.split())
            similarity = len(left_words & right_words) / max(1, len(left_words | right_words))
            version = "deterministic-token-overlap-fallback"
            signals.append("semantic model unavailable; deterministic fallback")
        score = min(1.0, similarity * 0.75 + (0.25 if same_institution else 0))
        if similarity > 0.65:
            signals.append("high text similarity")
        return MatchResult(similarity, score, "Candidate generated from transparent institution and complaint-text signals.", signals, version)


matching_service = MatchingService()
