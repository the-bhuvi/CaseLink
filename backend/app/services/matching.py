import re
from dataclasses import dataclass
from functools import lru_cache

from ..config import settings


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", value.lower())).strip()


@dataclass
class MatchResult:
    semantic_similarity: float
    relationship_score: float
    explanation: str
    evidence_signals: list[str]
    uncertainty: list[str]
    model_version: str


class AIUnavailable(RuntimeError):
    pass


class MatchingService:
    def __init__(self) -> None:
        self.model = None
        self.load_error: str | None = None

    @property
    def ready(self) -> bool:
        return self.model is not None

    def _load_model(self) -> None:
        if self.model is not None:
            return
        if self.load_error:
            raise AIUnavailable(self.load_error)
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer(settings.ai_model_name)
        except Exception as exc:
            self.load_error = f"Semantic model could not be loaded: {exc}"
            raise AIUnavailable(self.load_error) from exc

    @lru_cache(maxsize=2048)
    def _embedding(self, text: str):
        self._load_model()
        return self.model.encode(text, normalize_embeddings=True)

    def compare(
        self,
        left: str,
        right: str,
        *,
        same_institution: bool,
        same_category: bool,
        cross_bureau: bool,
    ) -> MatchResult:
        self._load_model()
        left_vector = self._embedding(normalize_text(left))
        right_vector = self._embedding(normalize_text(right))
        similarity = float(left_vector @ right_vector)
        signals: list[str] = []
        uncertainty: list[str] = []
        if same_institution:
            signals.append("official or normalized institution identity matches")
        else:
            uncertainty.append("institution identity was not confirmed")
        if same_category:
            signals.append("complaint categories match")
        else:
            uncertainty.append("complaint categories differ")
        if cross_bureau:
            signals.append("cases are assigned to different bureaus")
        score = min(1.0, max(0.0, similarity * 0.75 + (0.15 if same_institution else 0) + (0.05 if same_category else 0) + (0.05 if cross_bureau else 0)))
        return MatchResult(
            similarity,
            score,
            "The candidate combines semantic complaint similarity with institution, category, and bureau evidence. Human review is required.",
            signals,
            uncertainty,
            settings.ai_model_version,
        )


matching_service = MatchingService()
