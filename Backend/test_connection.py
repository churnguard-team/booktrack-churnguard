#!/usr/bin/env python3
"""
Test de connexion PostgreSQL avec les bons identifiants
"""

from sqlalchemy import create_engine, text

# ✅ CONFIG CORRIGÉE POUR DOCKER
DB_USER = "postgres"
DB_PASSWORD = "1234"  # ⚠️ doit matcher POSTGRES_PASSWORD dans docker-compose
DB_HOST = "localhost"
DB_PORT = "5431"  # ✅ IMPORTANT: Docker mapped port
DB_NAME = "bookdatabase"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print("=" * 60)
print("🔌 TEST DE CONNEXION POSTGRESQL")
print("=" * 60)
print(f"Base de données : {DB_NAME}")
print(f"User : {DB_USER}")
print(f"Host : {DB_HOST}:{DB_PORT}")
print()

try:
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Test 1 : Connexion simple
        conn.execute(text("SELECT 1;"))
        print("✅ Connexion réussie !")

        # Test 2 : Vérifier table churn_scores
        result = conn.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.tables 
                    WHERE table_name = 'churn_scores'
                );
            """)
        )
        exists = result.scalar()

        if exists:
            print("✅ Table 'churn_scores' existe !")

            result = conn.execute(
                text("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'churn_scores' 
                    ORDER BY ordinal_position;
                """)
            )

            print("\n📋 Colonnes de churn_scores :")
            for col_name, col_type in result:
                print(f"   • {col_name:20} ({col_type})")
        else:
            print("❌ Table 'churn_scores' n'existe pas")

        # Test 3 : users table
        result = conn.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.tables 
                    WHERE table_name = 'users'
                );
            """)
        )
        exists = result.scalar()

        if exists:
            print("\n✅ Table 'users' existe !")
        else:
            print("\n❌ Table 'users' n'existe pas")

except Exception:
    import traceback
    traceback.print_exc()