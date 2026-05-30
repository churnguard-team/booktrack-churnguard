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
    generate_images(models)


def generate_images(models):
    try:
        import matplotlib.pyplot as plt
        import numpy as np
    except ImportError as exc:
        print("matplotlib et numpy sont requis pour générer les images de comparaison.")
        raise exc

    metrics = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    model_names = [m["model"] for m in models]
    values = [[m[k] for k in metrics] for m in models]

    # Metrics grouped bar chart
    x = np.arange(len(metrics))
    width = 0.7 / max(1, len(models))
    fig, ax = plt.subplots(figsize=(10, 6))
    for idx, vals in enumerate(values):
        ax.bar(x + idx * width, vals, width, label=model_names[idx])
    ax.set_xticks(x + width * (len(models) - 1) / 2)
    ax.set_xticklabels([m.capitalize() for m in metrics])
    ax.set_ylim(0, 1)
    ax.set_ylabel("Score")
    ax.set_title("Comparaison des métriques des modèles")
    ax.legend(loc="upper right")
    ax.grid(axis="y", linestyle="--", alpha=0.5)
    fig.tight_layout()
    fig.savefig(COMPARISON_DIR / "comparison_metrics.png")
    plt.close(fig)

    # ROC AUC chart
    fig, ax = plt.subplots(figsize=(8, 5))
    roc_vals = [m["roc_auc"] for m in models]
    ax.bar(model_names, roc_vals, color=plt.cm.tab10.colors[: len(models)])
    ax.set_ylim(0, 1)
    ax.set_ylabel("ROC AUC")
    ax.set_title("ROC AUC comparaison")
    ax.grid(axis="y", linestyle="--", alpha=0.5)
    for i, v in enumerate(roc_vals):
        ax.text(i, v + 0.02, f"{v:.3f}", ha="center")
    fig.tight_layout()
    fig.savefig(COMPARISON_DIR / "comparison_roc_curves.png")
    plt.close(fig)

    # Radar chart
    angles = np.linspace(0, 2 * np.pi, len(metrics), endpoint=False).tolist()
    angles += angles[:1]
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw={"projection": "polar"})
    for name, vals in zip(model_names, values):
        data = vals + vals[:1]
        ax.plot(angles, data, label=name)
        ax.fill(angles, data, alpha=0.25)
    ax.set_thetagrids(np.degrees(angles[:-1]), [m.capitalize() for m in metrics])
    ax.set_ylim(0, 1)
    ax.set_title("Comparaison radar des modèles")
    ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.05))
    fig.tight_layout()
    fig.savefig(COMPARISON_DIR / "comparison_radar.png")
    plt.close(fig)

    # Table image
    fig, ax = plt.subplots(figsize=(10, 2 + len(models) * 0.4))
    ax.axis("off")
    table_data = [[m[k] for k in metrics] for m in models]
    table = ax.table(
        cellText=[[f"{v:.3f}" for v in row] for row in table_data],
        colLabels=[m.capitalize() for m in metrics],
        rowLabels=model_names,
        cellLoc="center",
        loc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 1.5)
    ax.set_title("Tableau comparatif des modèles", pad=15)
    fig.tight_layout()
    fig.savefig(COMPARISON_DIR / "comparison_table.png")
    plt.close(fig)

    # Confusion matrix placeholder
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.axis("off")
    ax.text(0.5, 0.6, "Confusion matrices unavailable", ha="center", va="center", fontsize=16)
    ax.text(0.5, 0.4, "Train the Deep Learning model and add prediction data", ha="center", va="center", fontsize=10)
    fig.tight_layout()
    fig.savefig(COMPARISON_DIR / "comparison_confusion_matrices.png")
    plt.close(fig)

    print(f"Wrote comparison images in: {COMPARISON_DIR}")


if __name__ == "__main__":
    main()
