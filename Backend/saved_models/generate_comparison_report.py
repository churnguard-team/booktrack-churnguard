"""
Generate a comparison report JSON by scanning saved_models/*/metadata.json

Usage: run from repo root (this script will locate backend/saved_models)
"""
from pathlib import Path
import json
from datetime import datetime


ROOT = Path(__file__).resolve().parent
COMPARISON_DIR = ROOT / "comparison"
COMPARISON_DIR.mkdir(parents=True, exist_ok=True)


def find_metadata_files(root: Path):
    # Look for metadata.json in immediate child dirs and one level deeper
    results = []
    for child in root.iterdir():
        if not child.is_dir():
            continue
        if child.name == "comparison":
            continue
        # direct metadata
        m = child / "metadata.json"
        if m.exists():
            results.append(m)
            continue
        # nested (e.g., logistic_regression/logistic_regression/metadata.json)
        for sub in child.iterdir():
            if not sub.is_dir():
                continue
            m2 = sub / "metadata.json"
            if m2.exists():
                results.append(m2)
                break
    return results


def load_metadata(path: Path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def model_name_from_metadata(path: Path, metadata: dict):
    # Prefer algorithm, otherwise infer from parent folder name
    alg = metadata.get("algorithm") if isinstance(metadata, dict) else None
    if alg:
        return alg
    # parent folder might be inner model folder
    parent = path.parent
    return parent.name


def main():
    metapaths = find_metadata_files(ROOT)
    models = []
    for mp in metapaths:
        md = load_metadata(mp)
        if not md:
            continue
        metrics = md.get("metrics", {})
        name = model_name_from_metadata(mp, md)
        models.append({
            "model": name,
            "accuracy": float(metrics.get("accuracy", 0)),
            "precision": float(metrics.get("precision", 0)),
            "recall": float(metrics.get("recall", 0)),
            "f1": float(metrics.get("f1", 0)),
            "roc_auc": float(metrics.get("roc_auc", 0)),
        })

    best_model = None
    best_roc = -1.0
    for m in models:
        if m.get("roc_auc", 0) > best_roc:
            best_roc = m.get("roc_auc", 0)
            best_model = m.get("model")

    report = {
        "generated_at": datetime.utcnow().isoformat(),
        "dataset": "unknown",
        "n_samples": 0,
        "n_features": 0,
        "churn_rate": 0.0,
        "models": models,
        "best_model": best_model,
        "best_roc_auc": best_roc if best_roc >= 0 else None,
        "graphiques": [
            "comparison_metrics.png",
            "comparison_roc_curves.png",
            "comparison_confusion_matrices.png",
            "comparison_radar.png",
            "comparison_table.png",
        ],
    }

    out = COMPARISON_DIR / "comparison_report.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Wrote comparison report: {out}")


if __name__ == "__main__":
    main()
