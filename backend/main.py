import io
import os
import time
from pathlib import Path

import numpy as np
import torch
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from ultralytics import YOLO

app = FastAPI(title="Shelf Void Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MODEL_PATH (env) takes precedence; otherwise fall back to the trained best.pt
# that ships next to main.py, and only then to the generic yolo11n.pt COCO model.
# If MODEL_PATH is unset we previously loaded yolo11n.pt, which knows nothing
# about shelf-void/product classes and so returned zero detections.
_BACKEND_DIR = Path(__file__).resolve().parent
MODEL_PATH = os.environ.get("MODEL_PATH", "")
_FALLBACK = _BACKEND_DIR / "best.pt"
# Keywords that mark a class as an empty/unoccupied shelf slot. Matched as
# substrings against model.names so the API classifies the void class correctly
# regardless of whether the trained model calls it "missing", "shelf-void",
# "empty", etc. The old code used exact tuple membership on the class NAME
# ("missing"/"void"/...), which silently counted every void as occupied the
# moment a model whose void class was named "shelf-void" was loaded.
_VOID_KEYWORDS = ("void", "missing", "empty", "vacant", "gap")

model = None
_void_class_ids: set[int] = set()


def get_model():
    global model, _void_class_ids
    if model is None:
        if MODEL_PATH and Path(MODEL_PATH).exists():
            path = MODEL_PATH
        elif _FALLBACK.exists():
            path = str(_FALLBACK)
        else:
            path = "yolo11n.pt"
        model = YOLO(path)
        names = getattr(model, "names", {}) or {}
        _void_class_ids = {
            cid
            for cid, name in names.items()
            if any(kw in str(name).lower() for kw in _VOID_KEYWORDS)
        }
    return model


@app.get("/api/health")
def health():
    return {"status": "ok", "device": "cuda" if torch.cuda.is_available() else "cpu"}


@app.get("/api/model/info")
def model_info():
    m = get_model()
    names = m.names if hasattr(m, "names") else {}
    return {
        "model_path": MODEL_PATH or "yolo11n (default pretrained)",
        "classes": names,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
    }


@app.post("/api/detect")
async def detect(
    file: UploadFile = File(...),
    confidence: float = Form(0.35),
    overlap: float = Form(0.45),
):
    image_bytes = await file.read()

    m = get_model()

    pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = np.array(pil)

    start = time.time()
    # agnostic_nms=True: NMS merges overlapping boxes across CLASSES, not just within a class.
    # Without it, a region the model is unsure about emits BOTH a product and a void box that
    # survive per-class NMS and show up as overlapping green/red boxes. This picks the
    # higher-confidence class. Band-aid for the v6 annotation conflicts; revisit once labels
    # are cleaned and the model is retrained. See backend/clean_annotations.py.
    results = m.predict(
        source=img,
        conf=confidence,
        iou=overlap,
        agnostic_nms=True,
        verbose=False,
    )
    elapsed_ms = round((time.time() - start) * 1000)

    detections = []
    occupied_count = 0
    vacant_count = 0

    for r in results:
        if r.boxes is None:
            continue
        img_h, img_w = r.orig_shape
        for box in r.boxes:
            cls_id = int(box.cls[0])
            cls_name = r.names.get(cls_id, str(cls_id))
            conf = round(float(box.conf[0]), 4)
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            is_occupied = cls_id not in _void_class_ids
            label = "occupied" if is_occupied else "vacant"

            if is_occupied:
                occupied_count += 1
            else:
                vacant_count += 1

            detections.append({
                "id": len(detections) + 1,
                "x": round(x1 / img_w * 100, 2),
                "y": round(y1 / img_h * 100, 2),
                "w": round((x2 - x1) / img_w * 100, 2),
                "h": round((y2 - y1) / img_h * 100, 2),
                "type": label,
                "confidence": conf,
                "class": cls_name,
            })

    total = occupied_count + vacant_count
    occupied_pct = round(occupied_count / total * 100, 1) if total else 0
    vacant_pct = round(vacant_count / total * 100, 1) if total else 0

    return JSONResponse({
        "detections": detections,
        "stats": {
            "detectionCount": len(detections),
            "processingTime": elapsed_ms,
            "occupiedPct": occupied_pct,
            "vacantPct": vacant_pct,
            "slotsDetected": total,
            "occupiedBoxes": occupied_count,
            "vacantBoxes": vacant_count,
        },
        "image": {
            "width": results[0].orig_shape[1] if results else 0,
            "height": results[0].orig_shape[0] if results else 0,
        },
    })
