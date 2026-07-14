import asyncio
import io
import time
from pathlib import Path

import numpy as np
import torch
from fastapi import FastAPI, File, Form, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from starlette.concurrency import run_in_threadpool

from models import get_registry, ModelState

app = FastAPI(title="Shelf Void Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_MODELS = {"occupancy", "partial", "arrangement"}


@app.get("/api/health")
def health():
    return {"status": "ok", "device": "cuda" if torch.cuda.is_available() else "cpu"}


@app.get("/api/model/info")
def model_info():
    registry = get_registry()
    models = {}
    for key, ms in registry.items():
        models[key] = {
            "available": ms.available,
            "classes": ms.names,
            "weight": str(ms.weight_path) if ms.available else None,
        }
    return {
        "models": models,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
    }


# ── Interpreters ─────────────────────────────────────────────────────────

def _interpret_occupancy(results, ms: ModelState):
    void_ids = ms.meta.get("void_class_ids", set())
    detections = []
    occupied = 0
    vacant = 0

    for r in results:
        if r.boxes is None:
            continue
        img_h, img_w = r.orig_shape
        for box in r.boxes:
            cls_id = int(box.cls[0])
            cls_name = r.names.get(cls_id, str(cls_id))
            conf = round(float(box.conf[0]), 4)
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            is_occupied = cls_id not in void_ids
            label = "occupied" if is_occupied else "vacant"

            if is_occupied:
                occupied += 1
            else:
                vacant += 1

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

    total = occupied + vacant
    occupied_pct = round(occupied / total * 100, 1) if total else 0
    vacant_pct = round(vacant / total * 100, 1) if total else 0

    return detections, {
        "detectionCount": len(detections),
        "processingTime": 0,
        "occupiedPct": occupied_pct,
        "vacantPct": vacant_pct,
        "slotsDetected": total,
        "occupiedBoxes": occupied,
        "vacantBoxes": vacant,
    }


def _interpret_partial(results, ms: ModelState):
    detections = []
    for r in results:
        if r.boxes is None:
            continue
        img_h, img_w = r.orig_shape
        for box in r.boxes:
            conf = round(float(box.conf[0]), 4)
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cls_name = r.names.get(int(box.cls[0]), str(int(box.cls[0])))

            detections.append({
                "id": len(detections) + 1,
                "x": round(x1 / img_w * 100, 2),
                "y": round(y1 / img_h * 100, 2),
                "w": round((x2 - x1) / img_w * 100, 2),
                "h": round((y2 - y1) / img_h * 100, 2),
                "type": "partial",
                "confidence": conf,
                "class": cls_name,
            })

    return detections, {
        "detectionCount": len(detections),
        "processingTime": 0,
    }


def _interpret_arrangement(results, ms: ModelState):
    detections = []
    for r in results:
        if r.boxes is None:
            continue
        img_h, img_w = r.orig_shape
        for box in r.boxes:
            conf = round(float(box.conf[0]), 4)
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cls_name = r.names.get(int(box.cls[0]), str(int(box.cls[0])))

            detections.append({
                "id": len(detections) + 1,
                "x": round(x1 / img_w * 100, 2),
                "y": round(y1 / img_h * 100, 2),
                "w": round((x2 - x1) / img_w * 100, 2),
                "h": round((y2 - y1) / img_h * 100, 2),
                "type": "misarranged",
                "confidence": conf,
                "class": cls_name,
            })

    return detections, {
        "detectionCount": len(detections),
        "processingTime": 0,
    }


_INTERPRETERS = {
    "occupancy": _interpret_occupancy,
    "partial": _interpret_partial,
    "arrangement": _interpret_arrangement,
}


def _run_inference_np(ms: ModelState, img: np.ndarray, confidence: float, overlap: float) -> dict:
    start = time.time()
    results = ms.yolo.predict(
        source=img,
        conf=confidence,
        iou=overlap,
        agnostic_nms=True,
        verbose=False,
    )
    elapsed_ms = round((time.time() - start) * 1000)

    interpreter = _INTERPRETERS[ms.key]
    detections, stats = interpreter(results, ms)
    stats["processingTime"] = elapsed_ms

    return {
        "model": ms.key,
        "available": True,
        "detections": detections,
        "stats": stats,
        "image": {
            "width": results[0].orig_shape[1] if results else 0,
            "height": results[0].orig_shape[0] if results else 0,
        },
    }


def _run_inference(ms: ModelState, image_bytes: bytes, confidence: float, overlap: float) -> dict:
    pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = np.array(pil)
    return _run_inference_np(ms, img, confidence, overlap)


@app.post("/api/detect")
async def detect(
    file: UploadFile = File(...),
    confidence: float = Form(0.35),
    overlap: float = Form(0.45),
    model: str = Query("occupancy"),
):
    if model not in VALID_MODELS:
        return JSONResponse(
            {"error": f"Invalid model '{model}'. Choose from: {', '.join(sorted(VALID_MODELS))}"},
            status_code=400,
        )

    registry = get_registry()
    ms = registry[model]

    if not ms.available:
        return {
            "model": model,
            "available": False,
            "detections": [],
            "stats": {"detectionCount": 0, "processingTime": 0},
            "image": {"width": 0, "height": 0},
        }

    image_bytes = await file.read()
    return await run_in_threadpool(_run_inference, ms, image_bytes, confidence, overlap)


@app.post("/api/detect/all")
async def detect_all(
    file: UploadFile = File(...),
    confidence: float = Form(0.35),
    overlap: float = Form(0.45),
):
    image_bytes = await file.read()

    pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = np.array(pil)

    registry = get_registry()

    async def run(key: str) -> dict:
        ms = registry[key]
        if not ms.available:
            return {
                "model": key,
                "available": False,
                "detections": [],
                "stats": {"detectionCount": 0, "processingTime": 0},
                "image": {"width": 0, "height": 0},
            }
        return await run_in_threadpool(_run_inference_np, ms, img, confidence, overlap)

    tasks = [run(key) for key in VALID_MODELS]
    gathered = await asyncio.gather(*tasks, return_exceptions=True)

    output: dict[str, dict] = {}
    for key, result in zip(VALID_MODELS, gathered):
        if isinstance(result, Exception):
            output[key] = {
                "model": key,
                "available": False,
                "error": str(result),
                "detections": [],
                "stats": {"detectionCount": 0, "processingTime": 0},
                "image": {"width": 0, "height": 0},
            }
        else:
            output[key] = result

    return output
