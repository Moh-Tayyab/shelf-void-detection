# Shelf Void Detection — Backend

FastAPI inference API for shelf-void detection.

## Quick Start

```bash
python -m venv .venv
source .venv/bin/activate

# Install PyTorch (CPU-only)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install app deps
pip install -r requirements.txt

# Run the API
uvicorn main:app --reload
```

Verify: `curl http://localhost:8000/api/health`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | `backend/best.pt` if present, else `yolo11n.pt` | Path to trained YOLOv11 weights |
