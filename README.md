# Shelf Void Detection

**AI-powered shelf & warehouse inventory monitoring — a full-stack computer-vision product that detects occupied vs. vacant shelf slots in real time.**

Upload a shelf photo and get back color-coded bounding boxes (green = product, red = void), live occupancy analytics, and per-slot confidence scores — powered by a custom-trained YOLOv11 model served through a FastAPI backend and a Next.js dashboard.

![Status](https://img.shields.io/badge/status-active-success) ![Python](https://img.shields.io/badge/Python-3.12+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688) ![Next.js](https://img.shields.io/badge/Next.js-13.5-black) ![YOLOv11](https://img.shields.io/badge/YOLOv11-Ultralytics-00BFFF) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Model & Training](#model--training)
- [How Void Detection Works](#how-void-detection-works)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Manual shelf auditing is slow, error-prone, and expensive. **Shelf Void Detection** automates it: a single photo of a shelf is analyzed in milliseconds to report **how full the shelf is, which slots are empty, and where the gaps are**.

The system is built as three decoupled layers:

| Layer | Role | Tech |
|------|------|------|
| **Model** | Detects `product` and `missing` (void) classes | YOLOv11 (Ultralytics), trained on a custom retail-shelf dataset |
| **Backend API** | Loads the model, runs inference, returns boxes + stats | FastAPI + PyTorch + Ultralytics, managed with `uv` |
| **Frontend Dashboard** | Upload image, render boxes overlay, show analytics | Next.js 13 + React 18 + TypeScript + Tailwind + shadcn/ui + Recharts |

This separation makes each layer independently deployable, testable, and scalable.

---

## Key Features

- **Real-time detection** — single-image inference in ~10–200 ms (CPU/GPU).
- **Occupancy analytics** — live `% occupied` vs `% vacant`, slot counts, processing time.
- **Color-coded overlay** — green boxes for products, red boxes for voids, with confidence labels.
- **Tunable at runtime** — confidence threshold and IoU/NMS overlap adjustable from the UI.
- **Class-agnostic NMS** — prevents duplicate overlapping product/void boxes on ambiguous regions.
- **Robust model loading** — auto-detects void class by keyword (`missing`, `void`, `empty`, `vacant`, `gap`) so any retrained model works without code changes.
- **Health & model info endpoints** — operational endpoints for monitoring and debugging.
- **CORS-secured backend** — locked to the frontend origin by default.
- **Production-ready frontend** — Netlify-deployable, responsive, dark-mode-aware UI.
- **Reproducible training** — Colab notebooks for training and inference, dataset versioned as `dataset.zip`.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│  Next.js Dashboard (upload, sliders, analytics, box overlay)     │
└──────────────────────────────┬───────────────────────────────────┘
                               │  POST /api/detect  (multipart image)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FastAPI BACKEND                              │
│  /api/health   /api/model/info   /api/detect                     │
│  ─ image decode (PIL) → numpy                                    │
│  ─ YOLOv11 predict (conf, iou, agnostic_nms)                     │
│  ─ classify boxes as occupied/vacant                             │
│  ─ compute occupancy stats                                       │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  YOLOv11 MODEL (best.pt)                         │
│  Trained on custom shelf dataset — 2 classes:                    │
│     • product  (occupied slot)                                   │
│     • missing  (vacant / void slot)                              │
└──────────────────────────────────────────────────────────────────┘
```

**Data flow for one request:**

1. User drops a shelf image in the dashboard.
2. Frontend posts it to `POST /api/detect` with `confidence` and `overlap` form fields.
3. Backend decodes the image, runs YOLOv11 inference, applies class-agnostic NMS.
4. Each box is classified `occupied` / `vacant` using the model's void-class keywords.
5. Backend returns bounding boxes (in `%` of image, render-resolution independent) + aggregate stats.
6. Frontend renders the image with an absolutely-positioned box overlay and updates the analytics charts.

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — async REST API
- [Ultralytics YOLOv11](https://github.com/ultralytics/ultralytics) — object detection
- [PyTorch](https://pytorch.org/) — model runtime (CPU or CUDA)
- [Pillow](https://python-pillow.org/) / [NumPy](https://numpy.org/) — image handling
- [uv](https://github.com/astral-sh/uv) — fast Python package manager

**Frontend**
- [Next.js 13](https://nextjs.org/) + [React 18](https://react.dev/) — app framework
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix) — UI
- [Recharts](https://recharts.org/) — analytics charts
- [Netlify](https://www.netlify.com/) — deployment

**Training**
- [Google Colab](https://colab.research.google.com/) — free T4 GPU training
- YOLOv11 training pipeline with augmentation

---

## Project Structure

```
shelf-void-detection/
├── backend/                          # FastAPI inference API
│   ├── main.py                       # API: /api/health, /api/model/info, /api/detect
│   ├── best.pt                       # Trained YOLOv11 weights (2 classes)
│   ├── yolo11n.pt                    # Generic COCO pretrained (fallback)
│   ├── colab_train_yolov11.ipynb     # Training notebook
│   ├── colab_inference_pipeline.ipynb# Inference + 2-stage experiment notebook
│   ├── pyproject.toml                # Python deps (uv)
│   └── uv.lock                       # Locked dependency versions
│
├── frontend/                         # Next.js dashboard
│   ├── app/                          # Next.js App Router (layout, page)
│   ├── components/
│   │   ├── dashboard/                # top-nav, source-panel, detection-output, occupancy-breakdown
│   │   └── ui/                       # shadcn/ui primitives
│   ├── lib/api.ts                    # Typed API client for the backend
│   ├── next.config.js
│   ├── netlify.toml                  # Netlify deployment config
│   └── package.json
│
├── dataset.zip                       # Custom labeled shelf dataset
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.12+** and [`uv`](https://github.com/astral-sh/uv) installed
- **Node.js 18+** and npm
- (Optional) CUDA GPU for faster inference — CPU works out of the box

### 1. Backend

```bash
cd backend

# Install dependencies (uv resolves torch CPU/CPU automatically)
uv sync

# Start the API (defaults to http://localhost:8000)
uv run uvicorn main:app --reload
```

Verify it's up:

```bash
curl http://localhost:8000/api/health
# {"status":"ok","device":"cpu"}
```

### 2. Frontend

In a new terminal:

```bash
cd frontend

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload a shelf image, and you should see detection boxes + occupancy analytics.

> The frontend expects the backend at `http://localhost:8000` by default. Override with `NEXT_PUBLIC_API_URL` (see [Configuration](#configuration)).

---

## Configuration

### Backend (environment variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | `backend/best.pt` if present, else `yolo11n.pt` | Path to trained YOLOv11 weights. Set this to override. |

### Backend (runtime params — `POST /api/detect`)

| Param | Default | Description |
|-------|---------|-------------|
| `confidence` | `0.35` | Minimum detection confidence. Lower = more detections (higher recall), more false positives. |
| `overlap` | `0.45` | IoU threshold for NMS. Lower = more aggressive deduplication of overlapping boxes. |

### Frontend (environment variables)

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Reference

Base URL: `http://localhost:8000`

### `GET /api/health`
Service liveness + device check.

```json
{ "status": "ok", "device": "cpu" }
```

### `GET /api/model/info`
Loaded model metadata + class names.

```json
{
  "model_path": "backend/best.pt",
  "classes": { "0": "missing", "1": "product" },
  "device": "cpu"
}
```

### `POST /api/detect`
Run detection on an uploaded image.

**Form data:** `file` (image), `confidence` (float, optional), `overlap` (float, optional)

**Response:**
```json
{
  "detections": [
    {
      "id": 1,
      "x": 12.34, "y": 45.6, "w": 8.7, "h": 15.2,
      "type": "occupied",
      "confidence": 0.91,
      "class": "product"
    }
  ],
  "stats": {
    "detectionCount": 87,
    "processingTime": 142,
    "occupiedPct": 78.4,
    "vacantPct": 21.6,
    "slotsDetected": 87,
    "occupiedBoxes": 68,
    "vacantBoxes": 19
  },
  "image": { "width": 615, "height": 444 }
}
```

> Bounding box coordinates are **percentages of image dimensions** (`x`, `y`, `w`, `h` ∈ 0–100), so the overlay renders correctly at any display size.

Interactive API docs are auto-generated at `http://localhost:8000/docs` (Swagger UI).

---

## Model & Training

The shipped `backend/best.pt` is a **YOLOv11** model trained on a custom retail-shelf dataset with two classes:

| Class ID | Class Name | Meaning |
|----------|-----------|---------|
| `0` | `missing` | Empty / vacant shelf slot (void) |
| `1` | `product` | Occupied shelf slot |

### Retrain on your own data

Open `backend/colab_train_yolov11.ipynb` in [Google Colab](https://colab.research.google.com/) (free T4 GPU), point it at your dataset, and run end-to-end. Drop the resulting `best.pt` into `backend/` (or set `MODEL_PATH`) and the API picks it up automatically.

The companion `backend/colab_inference_pipeline.ipynb` runs batch inference, visualization, and an optional experimental **2-stage void detector** (see below).

---

## How Void Detection Works

Detecting "voids" is hard because **an empty slot is the absence of a visual pattern** — there's nothing positive for the model to latch onto. This project handles it in two complementary ways:

### Default: Direct YOLOv11 classification (production)
The trained model predicts the `missing` class directly. This is what the backend runs. Class-agnostic NMS (`agnostic_nms=True`) is enabled to merge overlapping product/void boxes on ambiguous regions — a pragmatic fix for annotation noise in the current dataset.

### Experimental: 2-stage "products-first, voids-as-complement"
Available in `colab_inference_pipeline.ipynb` (opt-in via `USE_INVERSE_VOIDS = True`):

1. YOLOv11 detects products with high recall.
2. Products are grouped into horizontal shelf rows by y-center.
3. For each row, a strip mask is built and products are subtracted as full-height barriers.
4. `cv2.connectedComponentsWithStats` extracts void candidate boxes.
5. A heuristic CV filter (saturation + edge density + color variance) rejects likely-missed products.
6. A quality gate penalizes suspicious rows that emit too many candidates.
7. Stage 1 + Stage 2 boxes go through containment-aware NMS.

This is a research-backed approach (products-first, voids-as-complement) and is shipped as a fully-tunable pipeline for experimentation on different datasets. On the current test set, direct YOLO classification has the stronger F1 — the 2-stage variant trades precision for recall and is preferable only for restock-planning workflows after tuning.

**Tunable knobs** (in the inference notebook): `USE_INVERSE_VOIDS`, `SAT_MAX_FOR_VOID`, `MIN_VOID_AREA`, `MIN_VOID_WIDTH_FRAC`, `MAX_VOIDS_PER_ROW`, `MERGE_GAP_FRAC`.

---


## Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit with clear messages — `git commit -m 'feat: add video inference endpoint'`
4. Push — `git push origin feature/your-feature`
5. Open a Pull Request

Please run the frontend checks locally before submitting:

```bash
cd frontend && npm run lint && npm run typecheck
```

---

## License

Released under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built by [Muhammad Tayyab](https://github.com/Moh-Tayyab)**

</div>
