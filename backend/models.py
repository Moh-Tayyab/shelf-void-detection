import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from ultralytics import YOLO

_BACKEND_DIR = Path(__file__).resolve().parent
VOID_KEYWORDS = ("void", "missing", "empty", "vacant", "gap")


@dataclass
class ModelState:
    key: str
    weight_path: Path
    yolo: Optional[YOLO] = None
    available: bool = False
    names: dict = field(default_factory=dict)
    meta: dict = field(default_factory=dict)


def _resolve_weight(key: str) -> Optional[Path]:
    env_key = f"MODEL_PATH_{key.upper()}"
    env_path = os.environ.get(env_key, "")
    if env_path and Path(env_path).exists():
        return Path(env_path)

    models_dir = Path(os.environ.get("MODELS_DIR", _BACKEND_DIR / "models"))
    candidate = models_dir / f"{key}.pt"
    if candidate.exists():
        return candidate

    if key == "occupancy":
        legacy = _BACKEND_DIR / "best.pt"
        if legacy.exists():
            return legacy

    return None


_registry: Optional[dict[str, ModelState]] = None


def get_registry() -> dict[str, ModelState]:
    global _registry
    if _registry is not None:
        return _registry

    keys = ["occupancy", "partial", "arrangement"]
    _registry = {}

    for key in keys:
        weight_path = _resolve_weight(key)
        if weight_path is None:
            _registry[key] = ModelState(key=key, weight_path=Path(""), available=False)
            continue

        yolo = YOLO(str(weight_path))
        names = getattr(yolo, "names", {}) or {}
        meta = {}

        if key == "occupancy":
            void_ids = {
                cid
                for cid, name in names.items()
                if any(kw in str(name).lower() for kw in VOID_KEYWORDS)
            }
            meta["void_class_ids"] = void_ids

        _registry[key] = ModelState(
            key=key,
            weight_path=weight_path,
            yolo=yolo,
            available=True,
            names=names,
            meta=meta,
        )

    return _registry
