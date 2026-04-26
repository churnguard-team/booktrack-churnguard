"""
Training - Book Recommendations
===============================
Script pour entraîner un modèle de recommandation de livres.
"""

import pandas as pd
import numpy as np
import warnings
import joblib
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import matplotlib.pyplot as plt

warnings.filterwarnings('ignore')

# ── CONFIGURATION ──────────────────────────────────────────
MODEL_NAME = "book_recommendation"
MODEL_DIR = Path(__file__).parent.parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42


def load_interaction_data(csv_path: str) -> pd.DataFrame:
    """Charger les données d'interactions utilisateur-livre."""
    print(f"📥 Chargement des données depuis {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✓ Données chargées: {df.shape}")
    print(f"  Colonnes: {df.columns.tolist()}")
    return df


def load_book_features(csv_path: str) -> pd.DataFrame:
    """Charger les données des livres (optionnel)."""
    if not Path(csv_path).exists():
        print(f"⚠️  Fichier livres non trouvé: {csv_path}")
        return None
    
    print(f"📥 Chargement des données livres...")
    df = pd.read_csv(csv_path)
    print(f"✓ Livres chargés: {df.shape}")
    return df


def analyze_data(interactions_df: pd.DataFrame, books_df: pd.DataFrame = None):
    """Analyser les données."""
    print("\n📊 Analyse des données...")
    
    n_users = interactions_df['user_id'].nunique()
    n_books = interactions_df['book_id'].nunique()
    n_interactions = len(interactions_df)
    sparsity = 1 - (n_interactions / (n_users * n_books))
    
    print(f"  - Utilisateurs: {n_users}")
    print(f"  - Livres: {n_books}")
    print(f"  - Interactions: {n_interactions}")
    print(f"  - Sparsité: {sparsity:.2%}")
    
    if 'rating' in interactions_df.columns:
        print(f"  - Note moyenne: {interactions_df['rating'].mean():.2f}")
        print(f"  - Range: [{interactions_df['rating'].min()}, {interactions_df['rating'].max()}]")
    
    if books_df is not None:
        print(f"\n  Livres:")
        if 'genre' in books_df.columns:
            print(f"    - Genres uniques: {books_df['genre'].nunique()}")
        if 'author' in books_df.columns:
            print(f"    - Auteurs uniques: {books_df['author'].nunique()}")


def build_user_book_matrix(interactions_df: pd.DataFrame) -> tuple[np.ndarray, dict, dict]:
    """Construire la matrice utilisateur-livre."""
    print("\n🔨 Construction de la matrice utilisateur-livre...")
    
    # Créer les mappings
    users = interactions_df['user_id'].unique()
    books = interactions_df['book_id'].unique()
    
    user_to_idx = {uid: idx for idx, uid in enumerate(users)}
    book_to_idx = {bid: idx for idx, bid in enumerate(books)}
    
    # Créer la matrice
    matrix = np.zeros((len(users), len(books)))
    
    for _, row in interactions_df.iterrows():
        user_idx = user_to_idx[row['user_id']]
        book_idx = book_to_idx[row['book_id']]
        
        # Utiliser la rating si disponible, sinon 1 (interaction)
        rating = row.get('rating', 1)
        matrix[user_idx, book_idx] = rating
    
    print(f"✓ Matrice créée: {matrix.shape}")
    print(f"  - Densité: {np.count_nonzero(matrix) / matrix.size:.2%}")
    
    return matrix, user_to_idx, book_to_idx


def train_collaborative_filtering(matrix: np.ndarray) -> dict:
    """Entraîner un modèle collaborative filtering."""
    print("\n🚀 Entraînement - Collaborative Filtering...")
    
    # Calculer la similarité utilisateur-utilisateur
    user_similarity = cosine_similarity(matrix)
    
    # Calculer la similarité livre-livre
    book_similarity = cosine_similarity(matrix.T)
    
    print(f"✓ Similarités calculées")
    
    return {
        'user_similarity': user_similarity,
        'book_similarity': book_similarity,
        'algorithm': 'collaborative_filtering'
    }


def train_content_based(books_df: pd.DataFrame) -> dict:
    """Entraîner un modèle content-based."""
    print("\n🚀 Entraînement - Content-Based...")
    
    if books_df is None:
        print("⚠️  Pas de données livres disponibles pour content-based")
        return None
    
    # Combiner genre et auteur
    books_df['features'] = books_df.get('genre', '') + ' ' + books_df.get('author', '')
    
    # TF-IDF vectorization
    vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
    book_features = vectorizer.fit_transform(books_df['features'])
    
    # Similarité basée sur les features
    book_similarity = cosine_similarity(book_features)
    
    print(f"✓ Content-based model entraîné")
    
    return {
        'book_similarity': book_similarity,
        'vectorizer': vectorizer,
        'algorithm': 'content_based'
    }


def evaluate_recommendations(model: dict, interactions_df: pd.DataFrame,
                            matrix: np.ndarray, user_to_idx: dict, 
                            book_to_idx: dict, test_size: float = 0.2) -> dict:
    """Évaluer les recommandations."""
    print("\n📊 Évaluation du modèle...")
    
    # Split interactions en train/test
    train_df, test_df = train_test_split(
        interactions_df, test_size=test_size, random_state=RANDOM_STATE
    )
    
    # Metrics
    metrics = {
        'algorithm': model['algorithm'],
        'n_train_interactions': len(train_df),
        'n_test_interactions': len(test_df),
        'coverage': len(interactions_df['book_id'].unique()) / matrix.shape[1],
        'mean_rating': interactions_df['rating'].mean() if 'rating' in interactions_df else None
    }
    
    print(f"  - Algorithm: {metrics['algorithm']}")
    print(f"  - Train interactions: {metrics['n_train_interactions']}")
    print(f"  - Test interactions: {metrics['n_test_interactions']}")
    print(f"  - Coverage: {metrics['coverage']:.2%}")
    
    return metrics


def plot_results(matrix: np.ndarray, model: dict, interactions_df: pd.DataFrame,
                output_dir: Path = None):
    """Générer les visualisations."""
    if output_dir is None:
        output_dir = MODEL_DIR / MODEL_NAME
        output_dir.mkdir(exist_ok=True)
    
    print(f"\n📈 Génération des graphiques...")
    
    # 1. Interaction heatmap sample
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Prendre un échantillon pour visualisation
    sample_users = min(50, matrix.shape[0])
    sample_books = min(50, matrix.shape[1])
    
    sample_matrix = matrix[:sample_users, :sample_books]
    
    im = ax.imshow(sample_matrix, cmap='YlOrRd', aspect='auto')
    ax.set_xlabel('Book Index')
    ax.set_ylabel('User Index')
    ax.set_title(f'User-Book Interactions (Sample {sample_users}x{sample_books})')
    plt.colorbar(im, ax=ax, label='Rating')
    plt.tight_layout()
    plt.savefig(output_dir / 'interaction_heatmap.png', dpi=100)
    print(f"  ✓ interaction_heatmap.png")
    
    # 2. Sparsity analysis
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Interactions per user
    interactions_per_user = matrix.sum(axis=1)
    axes[0].hist(interactions_per_user, bins=30, color='steelblue', edgecolor='black')
    axes[0].set_xlabel('Nombre d\'interactions')
    axes[0].set_ylabel('Nombre d\'utilisateurs')
    axes[0].set_title('Distribution des Interactions par Utilisateur')
    axes[0].grid(axis='y', alpha=0.3)
    
    # Interactions per book
    interactions_per_book = matrix.sum(axis=0)
    axes[1].hist(interactions_per_book, bins=30, color='coral', edgecolor='black')
    axes[1].set_xlabel('Nombre d\'interactions')
    axes[1].set_ylabel('Nombre de livres')
    axes[1].set_title('Distribution des Interactions par Livre')
    axes[1].grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_dir / 'interaction_distribution.png', dpi=100)
    print(f"  ✓ interaction_distribution.png")
    
    # 3. Similarity distribution
    if 'user_similarity' in model:
        similarities = model['user_similarity'][np.triu_indices_from(model['user_similarity'], k=1)]
    else:
        similarities = model['book_similarity'][np.triu_indices_from(model['book_similarity'], k=1)]
    
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.hist(similarities, bins=50, color='mediumpurple', edgecolor='black')
    ax.set_xlabel('Similarité de cosinus')
    ax.set_ylabel('Fréquence')
    ax.set_title(f'Distribution des Similarités - {model["algorithm"]}')
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_dir / 'similarity_distribution.png', dpi=100)
    print(f"  ✓ similarity_distribution.png")


def save_model(model: dict, matrix: np.ndarray, user_to_idx: dict, 
               book_to_idx: dict, interactions_df: pd.DataFrame, 
               books_df: pd.DataFrame, metrics: dict):
    """Sauvegarder le modèle."""
    print(f"\n💾 Sauvegarde du modèle...")
    
    model_dir = MODEL_DIR / MODEL_NAME
    model_dir.mkdir(exist_ok=True)
    
    # Sauvegarder les composantes du modèle
    joblib.dump(model, model_dir / "model.pkl")
    joblib.dump(matrix, model_dir / "user_book_matrix.pkl")
    joblib.dump(user_to_idx, model_dir / "user_to_idx.pkl")
    joblib.dump(book_to_idx, model_dir / "book_to_idx.pkl")
    
    print(f"  ✓ Model components saved")
    
    # Métadonnées
    import json
    metadata = {
        'model_name': MODEL_NAME,
        'algorithm': model['algorithm'],
        'trained_at': datetime.now().isoformat(),
        'metrics': metrics,
        'matrix_shape': list(matrix.shape),
        'n_users': len(user_to_idx),
        'n_books': len(book_to_idx),
        'n_interactions': len(interactions_df)
    }
    
    with open(model_dir / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"  ✓ Métadonnées: metadata.json")
    print(f"\n✓ Modèle sauvegardé dans: {model_dir}")


def main(interactions_path: str, books_path: str = None, algorithm: str = 'collaborative'):
    """Pipeline complet."""
    print("=" * 70)
    print("🎯 BOOK RECOMMENDATION MODEL - TRAINING")
    print("=" * 70)
    
    # Charger les données
    interactions_df = load_interaction_data(interactions_path)
    books_df = load_book_features(books_path) if books_path else None
    
    # Analyser
    analyze_data(interactions_df, books_df)
    
    # Construire matrice
    matrix, user_to_idx, book_to_idx = build_user_book_matrix(interactions_df)
    
    # Entraîner selon l'algorithme
    if algorithm == 'collaborative':
        model = train_collaborative_filtering(matrix)
    elif algorithm == 'content_based':
        model = train_content_based(books_df)
    else:
        raise ValueError(f"Algorithme non supporté: {algorithm}")
    
    # Évaluer
    metrics = evaluate_recommendations(
        model, interactions_df, matrix, user_to_idx, book_to_idx
    )
    
    # Visualiser
    plot_results(matrix, model, interactions_df)
    
    # Sauvegarder
    save_model(model, matrix, user_to_idx, book_to_idx, 
               interactions_df, books_df, metrics)
    
    print("\n" + "=" * 70)
    print("✅ ENTRAÎNEMENT RECOMMANDATION TERMINÉ!")
    print("=" * 70)
    
    return model, metrics


if __name__ == "__main__":
    from sklearn.datasets import make_multilabel_classification
    
    print("⚠️  Création d'un dataset d'exemple...")
    
    # Créer un dataset d'exemple
    np.random.seed(42)
    
    n_users = 100
    n_books = 50
    n_interactions = 500
    
    user_ids = np.random.randint(0, n_users, n_interactions)
    book_ids = np.random.randint(0, n_books, n_interactions)
    ratings = np.random.randint(1, 6, n_interactions)
    
    interactions_df = pd.DataFrame({
        'user_id': [f'user_{uid}' for uid in user_ids],
        'book_id': [f'book_{bid}' for bid in book_ids],
        'rating': ratings
    })
    
    # Supprimer les doublons (garder la dernière rating)
    interactions_df = interactions_df.drop_duplicates(
        subset=['user_id', 'book_id'], keep='last'
    )
    
    # Créer dataset livres
    genres = ['Fiction', 'Science-Fiction', 'Mystery', 'Romance', 'Thriller']
    authors = ['Author A', 'Author B', 'Author C', 'Author D', 'Author E']
    
    books_df = pd.DataFrame({
        'book_id': [f'book_{i}' for i in range(n_books)],
        'title': [f'Book {i}' for i in range(n_books)],
        'genre': np.random.choice(genres, n_books),
        'author': np.random.choice(authors, n_books)
    })
    
    # Sauvegarder temporairement
    interactions_csv = Path(__file__).parent / "example_interactions.csv"
    books_csv = Path(__file__).parent / "example_books.csv"
    
    interactions_df.to_csv(interactions_csv, index=False)
    books_df.to_csv(books_csv, index=False)
    
    # Entraîner
    main(str(interactions_csv), str(books_csv), algorithm='collaborative')
    
    # Nettoyer
    interactions_csv.unlink()
    books_csv.unlink()
