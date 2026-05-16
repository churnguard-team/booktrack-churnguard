#!/usr/bin/env python3
"""
Script pour créer la table churn_scores dans PostgreSQL
À exécuter une seule fois
"""

from sqlalchemy import create_engine, text
import sys

# ⚙️ CONFIGURATION - À adapter à ton setup
DB_USER = "postgres"
DB_PASSWORD = "1234"  # Change si ton mot de passe est différent
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "bookdatabase"

# Construction de l'URL de connexion
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print("=" * 60)
print("🗄️  CRÉATION DE LA TABLE CHURN_SCORES")
print("=" * 60)
print(f"Connexion à : {DB_HOST}:{DB_PORT}/{DB_NAME}")
print()

try:
    # Créer la connexion
    engine = create_engine(DATABASE_URL)
    
    # Tester la connexion
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1;"))
        print("✅ Connexion PostgreSQL réussie !")
    
    # SQL pour créer les tables et index
    sql_statements = [
        """
        CREATE TABLE IF NOT EXISTS churn_scores (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            churn_probability FLOAT NOT NULL,
            churn_prediction INT NOT NULL,
            risk_level VARCHAR(20),
            predicted_at TIMESTAMP DEFAULT NOW(),
            is_latest BOOLEAN DEFAULT TRUE
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_churn_user_latest ON churn_scores(user_id, is_latest);",
        "CREATE INDEX IF NOT EXISTS idx_churn_risk ON churn_scores(risk_level);",
        "CREATE INDEX IF NOT EXISTS idx_churn_latest ON churn_scores(is_latest, predicted_at DESC);"
    ]
    
    # Exécuter chaque statement
    with engine.connect() as conn:
        for i, sql in enumerate(sql_statements, 1):
            try:
                conn.execute(text(sql))
                print(f"✅ Étape {i}/{len(sql_statements)} réussie")
            except Exception as e:
                print(f"⚠️  Étape {i} : {str(e)}")
        
        # Committer les changements
        conn.commit()
    
    # Vérifier que la table existe
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'churn_scores');")
        )
        exists = result.scalar()
        
        if exists:
            print()
            print("=" * 60)
            print("✅ TABLE CRÉÉE AVEC SUCCÈS !")
            print("=" * 60)
            
            # Afficher les colonnes
            result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'churn_scores';"))
            print("\n📋 Colonnes :")
            for col_name, col_type in result:
                print(f"   • {col_name:20} ({col_type})")
        else:
            print("❌ Erreur : La table n'a pas pu être créée")
            sys.exit(1)

except Exception as e:
    print()
    print("=" * 60)
    print("❌ ERREUR DE CONNEXION")
    print("=" * 60)
    print(f"\n{str(e)}")
    print("\n🔧 Solutions possibles :")
    print("   1. PostgreSQL n'est pas en cours d'exécution")
    print("   2. Identifiants incorrects (user/password)")
    print("   3. Base de données n'existe pas")
    print("   4. Port PostgreSQL différent (par défaut 5432)")
    print("\n💡 Modifie les variables au début du script :")
    print("   - DB_USER")
    print("   - DB_PASSWORD")
    print("   - DB_HOST")
    print("   - DB_PORT")
    print("   - DB_NAME")
    sys.exit(1)