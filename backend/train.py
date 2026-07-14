#!/usr/bin/env python3
"""
YOLOv11 Training Pipeline

Usage:
    # Train from local dataset directory
    python train.py --dataset data/partial-roboflow --name partial --imgsz 960

    # Train from zip (Colab)
    python train.py --zip partial_dataset.zip --name partial --imgsz 960

    # Quick test (CPU, few epochs)
    python train.py --dataset data/partial-roboflow --name partial-test --epochs 5 --imgsz 640
"""

import argparse
import glob
import os
import shutil
import sys
import yaml
from pathlib import Path

from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="YOLOv11 Training Pipeline")
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--dataset", help="Path to extracted dataset directory (must contain data.yaml)")
    src.add_argument("--zip", help="Path to dataset zip file (auto-extracted)")

    parser.add_argument("--name", default="partial", help="Model name (partial, arrangement, occupancy)")
    parser.add_argument("--model", default="yolo11s.pt", help="Base model variant (yolo11n/s/m)")
    parser.add_argument("--epochs", type=int, default=120, help="Number of epochs")
    parser.add_argument("--imgsz", type=int, default=960, help="Image size (640/960)")
    parser.add_argument("--batch", type=int, default=8, help="Batch size")
    parser.add_argument("--patience", type=int, default=35, help="Early stopping patience")
    parser.add_argument("--output", default="runs/train", help="Output directory for runs")
    parser.add_argument("--device", default=None, help="Device (cuda:0, cpu) — auto-detect if not set")

    return parser.parse_args()


def setup_dataset(args):
    if args.zip:
        extract_dir = "/content/dataset"
        if os.path.exists(extract_dir):
            shutil.rmtree(extract_dir)
        os.makedirs(extract_dir, exist_ok=True)
        os.system(f"unzip -q '{args.zip}' -d '{extract_dir}'")
        print(f"Extracted {args.zip} to {extract_dir}")

        yaml_files = glob.glob(f"{extract_dir}/**/data.yaml", recursive=True)
        if not yaml_files:
            print("ERROR: No data.yaml found in zip")
            sys.exit(1)
        dataset_dir = os.path.dirname(os.path.abspath(yaml_files[0]))
    else:
        dataset_dir = os.path.abspath(args.dataset)
        if not os.path.exists(f"{dataset_dir}/data.yaml"):
            print(f"ERROR: data.yaml not found in {dataset_dir}")
            sys.exit(1)

    with open(f"{dataset_dir}/data.yaml") as f:
        cfg = yaml.safe_load(f) or {}

    names = cfg.get("names", [])
    if isinstance(names, dict):
        names = [names[i] for i in sorted(names)]
    nc = cfg.get("nc") or len(names)
    print(f"Classes ({nc}): {names}")

    fixed_cfg = {
        "train": f"{dataset_dir}/train/images",
        "val": f"{dataset_dir}/valid/images",
        "test": f"{dataset_dir}/test/images" if os.path.exists(f"{dataset_dir}/test/images") else f"{dataset_dir}/valid/images",
        "nc": nc,
        "names": names,
    }
    yaml_path = f"{dataset_dir}/data_fixed.yaml"
    with open(yaml_path, "w") as f:
        yaml.safe_dump(fixed_cfg, f, sort_keys=False)

    for split in ["train", "valid", "test"]:
        imgs = glob.glob(f"{dataset_dir}/{split}/images/*.jpg")
        labs = glob.glob(f"{dataset_dir}/{split}/labels/*.txt")
        print(f"  {split}: {len(imgs)} images, {len(labs)} labels")

    return yaml_path, nc, names


def train(args, yaml_path, nc, names):
    print(f"\n{'='*60}")
    print(f"Training: {args.name}")
    print(f"  Model: {args.model}")
    print(f"  Epochs: {args.epochs} | Imgsz: {args.imgsz} | Batch: {args.batch}")
    print(f"  Classes: {nc} {names}")
    print(f"{'='*60}\n")

    model = YOLO(args.model)

    train_kwargs = {
        "data": yaml_path,
        "epochs": args.epochs,
        "imgsz": args.imgsz,
        "batch": args.batch,
        "name": args.name,
        "patience": args.patience,
        "cache": True,
        "plots": True,
        "exist_ok": True,
        "close_mosaic": min(15, args.epochs // 4),
        "mosaic": 1.0,
        "fliplr": 0.5,
        "project": args.output,
    }
    if args.device:
        train_kwargs["device"] = args.device

    results = model.train(**train_kwargs)
    print(f"\n✅ Training complete: {args.name}")

    best_path = f"{args.output}/{args.name}/weights/best.pt"
    if os.path.exists(best_path):
        dest = Path(__file__).resolve().parent / "models" / f"{args.name}.pt"
        shutil.copy(best_path, str(dest))
        print(f"✅ Model saved to: {dest}")
        print(f"   Size: {os.path.getsize(dest) / 1024 / 1024:.1f} MB")

    return results


def validate(args, yaml_path):
    model = YOLO(f"{args.output}/{args.name}/weights/best.pt")
    metrics = model.val(data=yaml_path, split="test", plots=True)

    print(f"\n{'='*60}")
    print("Validation Results")
    print(f"{'='*60}")
    print(f"  mAP50    : {metrics.box.map50:.4f}")
    print(f"  mAP50-95 : {metrics.box.map:.4f}")
    print(f"  Precision: {metrics.box.mp:.4f}")
    print(f"  Recall   : {metrics.box.mr:.4f}")

    for i, n in enumerate(model.names.values()):
        print(f"  {n:12s}: mAP50={metrics.box.ap50[i]:.4f}  P={metrics.box.p[i]:.4f}  R={metrics.box.r[i]:.4f}")

    return metrics


def main():
    args = parse_args()
    yaml_path, nc, names = setup_dataset(args)
    train(args, yaml_path, nc, names)
    try:
        validate(args, yaml_path)
    except Exception as e:
        print(f"Validation skipped: {e}")


if __name__ == "__main__":
    main()
