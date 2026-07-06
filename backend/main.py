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

MODEL_PATH = os.environ.get("MODEL_PATH", "")
model = None


def get_model():
    global model
    if model is None:
        if MODEL_PATH and Path(MODEL_PATH).exists():
            model = YOLO(MODEL_PATH)
        else:
            model = YOLO("yolo11n.pt")
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
    results = m.predict(
        source=img,
        conf=confidence,
        iou=overlap,
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

            is_occupied = cls_name.lower() not in ("missing", "void", "empty", "vacant")
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
