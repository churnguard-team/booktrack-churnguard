"""
Comparaison des modèles de Churn
================================
Script pour comparer les performances des 3 algorithmes de churn.
"""

import json
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

MODEL_DIR = Path(__file__).parent.parent / "saved_models"

MODELS_TO_COMPARE = {
    'random_forest_churn': 'Random Forest',
    'xgboost_churn': 'XGBoost',
    'deep_learning_churn': 'Deep Learning'
}

METRICS_TO_SHOW = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']


def load_model_metrics(model_name: str) -> dict:
    """Charger les métriques d'un modèle."""
    metadata_path = MODEL_DIR / model_name / "metadata.json"
    
    if not metadata_path.exists():
        print(f"⚠️  {model_name}: metadata.json not found")
        return None
    
    with open(metadata_path) as f:
        metadata = json.load(f)
    
    return metadata.get('metrics', {})


def compare_models():
    """Comparer les performances des modèles."""
    print("=" * 70)
    print("📊 COMPARAISON DES MODÈLES DE CHURN")
    print("=" * 70)
    
    # Charger les métriques
    results = {}
    for model_key, model_name in MODELS_TO_COMPARE.items():
        metrics = load_model_metrics(model_key)
        if metrics:
            results[model_name] = metrics
            print(f"\n✓ {model_name}")
        else:
            print(f"\n✗ {model_name} (pas encore entraîné)")
    
    if not results:
        print("\n❌ Aucun modèle trouvé!")
        return
    
    # Créer DataFrame de comparaison
    print("\n" + "=" * 70)
    print("📋 RÉSULTATS DÉTAILLÉS")
    print("=" * 70)
    
    comparison_df = pd.DataFrame(results).T
    
    # Afficher les métriques
    for metric in METRICS_TO_SHOW:
        if metric in comparison_df.columns:
            print(f"\n{metric.upper()}:")
            print(f"{'-' * 50}")
            for model, value in comparison_df[metric].items():
                print(f"  {model:<20} {value:.4f}")
    
    # Trouver le meilleur modèle
    print("\n" + "=" * 70)
    print("🏆 MEILLEUR MODÈLE PAR MÉTRIQUE")
    print("=" * 70)
    
    for metric in METRICS_TO_SHOW:
        if metric in comparison_df.columns:
            best_model = comparison_df[metric].idxmax()
            best_score = comparison_df[metric].max()
            print(f"  {metric:<15} → {best_model:<20} ({best_score:.4f})")
    
    # Score global (moyenne pondérée)
    weights = {
        'accuracy': 0.2,
        'precision': 0.2,
        'recall': 0.2,
        'f1': 0.2,
        'roc_auc': 0.2
    }
    
    print("\n" + "=" * 70)
    print("⭐ SCORE GLOBAL (moyenne pondérée)")
    print("=" * 70)
    
    global_scores = {}
    for model in results.keys():
        score = sum(
            results[model].get(metric, 0) * weights.get(metric, 0)
            for metric in METRICS_TO_SHOW
        )
        global_scores[model] = score
        print(f"  {model:<20} {score:.4f}")
    
    best_overall = max(global_scores.items(), key=lambda x: x[1])
    print(f"\n🥇 RECOMMANDATION: {best_overall[0]} ({best_overall[1]:.4f})")
    
    # Visualisation
    plot_comparison(comparison_df)
    
    return comparison_df


def plot_comparison(df: pd.DataFrame):
    """Générer des graphiques de comparaison."""
    output_dir = MODEL_DIR / "comparison"
    output_dir.mkdir(exist_ok=True)
    
    print(f"\n📈 Génération des graphiques de comparaison...")
    
    # 1. Radar chart
    metrics_subset = [m for m in METRICS_TO_SHOW if m in df.columns]
    
    fig, ax = plt.subplots(figsize=(12, 6), subplot_kw=dict(projection='polar'))
    
    angles = np.linspace(0, 2 * np.pi, len(metrics_subset), endpoint=False).tolist()
    angles += angles[:1]  # Complete the circle
    
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']
    
    for idx, (model, color) in enumerate(zip(df.index, colors)):
        values = df.loc[model, metrics_subset].tolist()
        values += values[:1]
        ax.plot(angles, values, 'o-', linewidth=2, label=model, color=color)
        ax.fill(angles, values, alpha=0.15, color=color)
    
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(metrics_subset)
    ax.set_ylim(0, 1)
    ax.set_title('Comparaison des Performances - Radar Chart', size=14, weight='bold', pad=20)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0))
    ax.grid(True)
    
    plt.tight_layout()
    plt.savefig(output_dir / 'comparison_radar.png', dpi=100, bbox_inches='tight')
    print(f"  ✓ comparison_radar.png")
    
    # 2. Bar chart
    fig, ax = plt.subplots(figsize=(12, 6))
    
    df[metrics_subset].T.plot(kind='bar', ax=ax, width=0.8)
    ax.set_title('Comparaison des Métriques', size=14, weight='bold')
    ax.set_ylabel('Score')
    ax.set_xlabel('')
    ax.set_ylim(0, 1.05)
    ax.legend(title='Modèle', loc='best')
    ax.grid(axis='y', alpha=0.3)
    plt.xticks(rotation=0)
    
    plt.tight_layout()
    plt.savefig(output_dir / 'comparison_bars.png', dpi=100)
    print(f"  ✓ comparison_bars.png")
    
    # 3. Heatmap
    fig, ax = plt.subplots(figsize=(10, 4))
    
    sns.heatmap(df[metrics_subset], annot=True, fmt='.4f', cmap='RdYlGn',
                cbar_kws={'label': 'Score'}, ax=ax, vmin=0, vmax=1)
    ax.set_title('Heatmap des Performances', size=14, weight='bold')
    
    plt.tight_layout()
    plt.savefig(output_dir / 'comparison_heatmap.png', dpi=100)
    print(f"  ✓ comparison_heatmap.png")
    
    print(f"✓ Graphiques sauvegardés dans: {output_dir}")


if __name__ == "__main__":
    import numpy as np
    
    print("📊 Script de comparaison des modèles de churn\n")
    print("Assurez-vous d'avoir d'abord entraîné les modèles:")
    print("  1. python churn_random_forest_train.py")
    print("  2. python churn_xgboost_train.py")
    print("  3. python churn_deeplearning_train.py\n")
    
    compare_models()
