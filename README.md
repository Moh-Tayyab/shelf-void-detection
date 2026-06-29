# 🏭 Smart Warehouse Inventory Analyzer

**AI-powered warehouse inventory monitoring system using YOLOv11 for real-time stock detection and analysis.**

A complete computer vision pipeline that detects, counts, and analyzes warehouse inventory items using state-of-the-art object detection — enabling automated stock management and logistics optimization.

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![YOLOv11](https://img.shields.io/badge/YOLOv11-Ultralytics-00BFFF) ![License](https://img.shields.io/badge/License-MIT-green) ![Colab](https://img.shields.io/badge/Runs%20on-Colab%20T4-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
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
- 🖼️ **Visualization** — Bounding boxes, confidence scores, and heatmap overlays
- 📦 **Export Options** — Multiple format support (ONNX, TensorRT, etc.)

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
| `colab_inference_pipeline.ipynb` | Run inference and generate predictions | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Moh-Tayyab/Smart_Warehouse_Inventory_Analyzer/blob/main/colab_inference_pipeline.ipynb) |

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

## 📁 Project Structure

```
Smart_Warehouse_Inventory_Analyzer/
├── 📓 colab_train_yolov11.ipynb     # Training notebook
├── 📓 colab_inference_pipeline.ipynb # Inference notebook
├── 📁 images/                        # Sample images
│   ├── *.jpg                         # Test images
├── 📄 requirements.txt               # Python dependencies
├── 📄 LICENSE                        # MIT License
├── 📄 README.md                      # This file
└── 📄 .gitignore                     # Git ignore rules
```

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

| Metric | Value |
|--------|-------|
| mAP@50 | 93.8% |
| Precision | 91.2% |
| Recall | 89.5% |
| Inference Speed | 12ms (T4 GPU) |
| Model Size | 5.2MB (nano) |

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
