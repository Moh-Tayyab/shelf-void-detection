#!/usr/bin/env python3
"""
Transform a multi-class YOLO dataset into a single-class dataset by keeping
selected source classes (relabeled to class 0) and dropping the rest.

Built for Roboflow Universe datasets, e.g. 'Stock Detection' has classes
{Empty, Full, Partially empty, Partially full}; keep the two partial classes
and drop Empty/Full (they become negatives = images with no label).

Preserves the train/valid/test images+labels structure and writes a single-class
data.yaml. Output is ready to zip and upload to Roboflow.

Usage:
    python transform_classes.py --input /tmp/stock-detection \\
        --output data/partial-roboflow --keep 2,3 --name partially_filled
"""
import argparse
import shutil
from pathlib import Path

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def label_rel_for(img_rel: Path) -> Path:
    """Mirror an image rel path to its label rel path (images/ -> labels/)."""
    parts = list(img_rel.parts)
    if "images" in parts:
        idx = parts.index("images")
        return Path(*parts[:idx], "labels", *parts[idx + 1:]).with_suffix(".txt")
    return img_rel.with_suffix(".txt")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--input", required=True, help="source YOLO dataset folder")
    ap.add_argument("--output", required=True, help="output single-class dataset folder")
    ap.add_argument("--keep", required=True,
                    help="comma-sep source class ids to KEEP (all relabeled to 0)")
    ap.add_argument("--name", required=True, help="single output class name")
    args = ap.parse_args()

    keep = {int(x) for x in args.keep.split(",")}
    in_dir, out_dir = Path(args.input), Path(args.output)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    img_count = pos = neg = boxes = 0
    for img in sorted(in_dir.rglob("*")):
        if img.suffix.lower() not in EXTS:
            continue
        rel = img.relative_to(in_dir)
        dst_img = out_dir / rel
        dst_img.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(img, dst_img)
        img_count += 1

        src_label = in_dir / label_rel_for(rel)
        dst_label = out_dir / label_rel_for(rel)
        dst_label.parent.mkdir(parents=True, exist_ok=True)

        kept = []
        if src_label.exists():
            for line in src_label.read_text().splitlines():
                p = line.split()
                if not p:
                    continue
                if int(p[0]) in keep:
                    kept.append("0 " + " ".join(p[1:]))
                    boxes += 1
        dst_label.write_text(("\n".join(kept) + "\n") if kept else "")

        if kept:
            pos += 1
        else:
            neg += 1

    (out_dir / "data.yaml").write_text(f"nc: 1\nnames: ['{args.name}']\n")
    print("=== transform report ===")
    print(f"  kept classes   : {sorted(keep)} -> 0 ('{args.name}')")
    print(f"  images         : {img_count}")
    print(f"  with-label     : {pos}")
    print(f"  negatives      : {neg}")
    print(f"  kept boxes     : {boxes}")
    print(f"  output         : {out_dir}")


if __name__ == "__main__":
    main()
