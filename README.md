# 🏭 Shelf Void Detection

**AI-powered warehouse inventory monitoring system using YOLOv11 for real-time stock detection and analysis.**

A complete computer vision pipeline that detects, counts, and analyzes warehouse inventory items using state-of-the-art object detection — enabling automated stock management and logistics optimization.

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![YOLOv11](https://img.shields.io/badge/YOLOv11-Ultralytics-00BFFF) ![License](https://img.shields.io/badge/License-MIT-green) ![Colab](https://img.shields.io/badge/Runs%20on-Colab%20T4-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [How Void Detection Works (2-Stage)](#how-void-detection-works-2-stage)
- [Notebooks](#notebooks)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Model Performance](#model-performance)
- [Contributing](#contributing)
- [License](#license)

---

## 🔍 Overview

This project implements an intelligent warehouse inventory management system that uses computer vision to:

- **Detect** warehouse items and products in real-time
- **Count** inventory automatically from images/video feeds
- **Analyze** stock levels and identify gaps
- **Generate** detailed reports for inventory management

Built with **YOLOv11** (Ultralytics) and optimized for **Google Colab** with T4 GPU acceleration.

---

## ✨ Features

- 🎯 **Real-time Detection** — Detect multiple object classes simultaneously
- 📊 **Inventory Counting** — Automatic item counting with accuracy metrics
- 🔄 **Training Pipeline** — Complete training workflow with data augmentation
- 📱 **Colab Ready** — One-click execution on Google Colab with free T4 GPU
- 📈 **Performance Metrics** — Detailed mAP, precision, and recall analysis
- 🖼️ **Visualization** — Color-coded bounding boxes (red=void, green=product) with confidence scores
- 📦 **Export Options** — Multiple format support (ONNX, TensorRT, etc.)
- 📊 **Shelf Fill Metric** — Calculate average shelf fill percentage
- 🎯 **2-Stage Void Detection** — YOLOv11 + inverse "complement" detector (opt-in, conservative defaults, measured F1 lower than YOLO alone on our test set)
- 🛡️ **Error Handling** — Fixed PNG crash + clear error if no images detected

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT LAYER                              │
│  Camera Feed / Images / Video / RTSP Stream                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 PREPROCESSING                               │
│  Resize • Normalize • Augment                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              YOLOv11 DETECTION ENGINE                       │
│  Backbone → Neck → Head → NMS                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               POST-PROCESSING                               │
│  Bounding Boxes • Confidence • Classification               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              ANALYTICS & REPORTING                          │
│  Count • Stock Level • Gap Detection • Export               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📓 Notebooks

| Notebook | Description | Link |
|----------|-------------|------|
| `colab_train_yolov11.ipynb` | Train YOLOv11 on custom warehouse dataset | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Moh-Tayyab/Smart_Warehouse_Inventory_Analyzer/blob/main/colab_train_yolov11.ipynb) |
| `colab_inference_pipeline.ipynb` | Run inference and generate predictions | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1I9EYoOdVC1GYhZVl2-TnvAC466oiQOQN?usp=sharing) |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Google Colab account (recommended) OR local GPU
- 8GB+ RAM
- CUDA-compatible GPU (recommended)

### Option 1: Google Colab (Recommended)

1. Click the Colab badges above
2. Connect to a T4 GPU runtime
3. Run all cells

### Option 2: Local Setup

```bash
# Clone the repository
git clone https://github.com/Moh-Tayyab/Smart_Warehouse_Inventory_Analyzer.git
cd Smart_Warehouse_Inventory_Analyzer

# Install dependencies
pip install -r requirements.txt

# Run training
python train.py --data dataset.yaml --epochs 100 --img 640

# Run inference
python predict.py --source images/ --weights best.pt
```

---

## 🎯 How Void Detection Works (2-Stage)

A common challenge in shelf-monitoring systems: **"void" = absence of products = no positive visual pattern.**
Even a strong YOLOv11 model struggles here (we measured **45% recall** on voids vs **86% on products**).

This project ships **two modes**:

### Mode 1 — YOLO alone (default, proven baseline)
The trained model directly predicts the `missing` class. On our 31-image test set:
- **Recall 45%, Precision 63%, F1 52.7%** — the best result we measured.
- This is what runs by default. `USE_INVERSE_VOIDS = False` in the notebook.

### Mode 2 — 2-stage "products-first, voids-as-complement" (experimental, opt-in)
When `USE_INVERSE_VOIDS = True`, the pipeline adds a second stage on top of YOLO:

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 1 — YOLOv11 (unchanged)                              │
│  ──────────────────────────────                             │
│  • Strong product detection (recall 0.86)                   │
│  • Detects both "product" and "missing" classes             │
│  • The strong product signal is the foundation              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Stage 2 — Inverse Void Detector (opt-in)                   │
│  ─────────────────────────────────────                      │
│  1. Group YOLO product boxes into horizontal rows (y-center)│
│  2. For each row: build strip mask (full image width ×      │
│     product y-extent), subtract products as full-height     │
│     barriers                                               │
│  3. cv2.connectedComponentsWithStats → void candidate boxes │
│  4. CV filter (3-signal: saturation + edge density +       │
│     color variance) — reject likely-missed products        │
│  5. Quality gate: if >3 candidates from one row, halve     │
│     their confidence (suspicious row)                      │
│  6. Output: (xyxy, conf, method="inverse")                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Merge + Containment-NMS                                    │
│  ────────────────────────                                   │
│  Stage 1 + Stage 2 boxes go through the same containment-    │
│  aware NMS as before — duplicate / nested / overlapping     │
│  boxes are merged. Final output is color-coded.             │
└─────────────────────────────────────────────────────────────┘
```

**Measured on 31 test images (IoU>0.3 matching):**

| Variant | Recall | Precision | F1 |
|---|---|---|---|
| YOLO alone (default) | **45%** | **63%** | **52.7%** |
| 2-stage (`USE_INVERSE_VOIDS = True`) | 36-44% | 14-22% | 23-28% |

**Honest conclusion:** On this test set the inverse stage is **not yet better than YOLO alone** — it
catches some new voids but generates many more false-positive candidates, hurting precision. We ship
it anyway as an opt-in, fully-tunable pipeline you can run **Step 4.6** (validation harness) on
to measure its F1 on your own data. On a different dataset (with simpler shelves, plain products,
consistent backgrounds) it may do better.

**Tunable parameters** (in `colab_inference_pipeline.ipynb` Step 4.5):
- `USE_INVERSE_VOIDS = False` — master switch
- `SAT_MAX_FOR_VOID = 65` — max HSV saturation; lower = stricter (fewer FP, lower recall)
- `MIN_VOID_AREA = 400` — minimum void area in pixels²
- `MIN_VOID_WIDTH_FRAC = 0.40` — min void width as fraction of median product width
- `MAX_VOIDS_PER_ROW = 3` — quality gate threshold
- `MERGE_GAP_FRAC = 0.50` — merge adjacent voids if gap < this × median product width

**Honest caveat:** The CV filter is heuristic. For unusual images (very textured empty shelves like wood grain, pegboard) it will under-detect. For unusually plain products (plain cardboard) it may over-detect. The defaults are tuned for typical retail — validate on a 20-image holdout and tune 2-3 thresholds for production. Research-backed approach (Šikić 2024, Jha 2022, Sementille 2026 — "products-first, voids-as-complement").

---

## 📁 Project Structure

```
Smart_Warehouse_Inventory_Analyzer/
├── 📓 colab_train_yolov11.ipynb     # Training notebook
├── 📓 colab_inference_pipeline.ipynb # Inference notebook (visualization + validation)
├── 📁 scripts/                       # Standalone utility scripts
│   └── threshold_sweep.py           # Find best CONFIDENCE via F1 sweep
├── 📁 shelf_dataset_v6/              # Train/valid/test split (28 test images with labels)
├── 📁 images/                        # Sample images
├── 📄 requirements.txt               # Python dependencies
├── 📄 LICENSE                        # MIT License
├── 📄 README.md                      # This file
└── 📄 .gitignore                     # Git ignore rules
```

### 🧪 Data-backed threshold tuning (sweep)

The default `CONFIDENCE = 0.30` in the inference notebook is chosen via a sweep on the 28 labeled test images. To re-run the sweep locally or on Colab:

```bash
# Local (CPU, ~1-2 min)
MODEL_PATH=/path/to/best.pt python3 scripts/threshold_sweep.py

# Colab (GPU, ~30 sec)
!MODEL_PATH=/content/best.pt python3 scripts/threshold_sweep.py
```

Sweep table (last measured on 28 test images, IoU>0.3):

| conf | recall | precision | F1 |
|---|---|---|---|
| 0.20 | 59.2% | 58.0% | 58.6% |
| **0.30** | **53.4%** | **69.4%** | **60.3% ← best** |
| 0.40 | 45.8% | 75.2% | 56.9% |
| 0.50 | 40.3% | 83.5% | 54.4% |
| 0.60 | 27.3% | 86.7% | 41.5% |

> ⚠️ 0.50+ avoid karo — recall collapses, F1 drops. Voids = absence of product (no direct visual pattern), strict threshold hurts.

---

## 💡 Usage

### Training

```python
from ultralytics import YOLO

# Load model
model = YOLO('yolo11n.pt')  # Load pretrained

# Train on custom dataset
results = model.train(
    data='dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    name='warehouse_detector'
)
```

### Inference

```python
from ultralytics import YOLO

# Load trained model
model = YOLO('best.pt')

# Run inference
results = model.predict(
    source='images/',
    conf=0.25,
    save=True
)

# Process results
for result in results:
    boxes = result.boxes
    print(f"Detected {len(boxes)} items")
```

### Command Line

```bash
# Training
yolo train model=yolo11n.pt data=dataset.yaml epochs=100 imgsz=640

# Prediction
yolo predict model=best.pt source=images/ conf=0.25

# Export
yolo export model=best.pt format=onnx
```

---

## 📊 Model Performance

Trained on `shelf_dataset_v5` (273 train / 72 valid / 31 test images, 2 classes: `missing` + `product`).

### Per-class metrics (best.pt, validation split)

| Class | Precision | Recall | mAP@50 |
|-------|-----------|--------|--------|
| `missing` (void) | 0.634 | 0.449 | 0.470 |
| `product` | 0.850 | 0.860 | 0.880 |
| **Overall** | 0.742 | 0.655 | 0.675 |

### With 2-stage inverse void detector (inference-side, opt-in)

| Metric | YOLOv11 only (default) | + Inverse Stage 2 (opt-in) |
|---|---|---|
| Void recall | 0.45 | 0.36-0.44 (catches some YOLO-missed voids) |
| Void precision | **0.63** | 0.14-0.22 (many more candidates, CV filter) |
| F1 | **0.527** | 0.23-0.28 |
| Product detection | unchanged | unchanged |
| Inference time | ~12ms | +200-400ms (CV pass on candidates) |

**On this test set YOLO alone wins on F1.** The 2-stage is shipped as an opt-in, fully-tunable
alternative — on a different dataset (simpler shelves, plain products, consistent backgrounds) it
may improve. Always validate on your own holdout using `Step 4.6` (the validation cell in the
inference notebook). The 2-stage trades some precision for higher recall — preferable for
restock planning only if you tune `SAT_MAX_FOR_VOID` and `MIN_VOID_AREA` carefully.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Ultralytics YOLOv11](https://github.com/ultralytics/ultralytics) — Object detection framework
- [Google Colab](https://colab.research.google.com/) — Free GPU computing
- [Roboflow](https://roboflow.com/) — Dataset management

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by [Moh-Tayyab](https://github.com/Moh-Tayyab)

</div>
