Postgresql 18.3 Windows x86-64 (pgadmin4 or psql)

1-Récupérer le projet
 git clone 
 cd booktrack-churnguard

 Si le repo est déjà cloné: git pull

 2-Créer leur fichier .env local à côté de docker-compose.yml avec au minimum:
  POSTGRES_PASSWORD=un_mot_de_passe_local
3-supprimer le volume et Démarrer la base
 docker compose down -v   # ← supprime le volume ancien (IMPORTANT)
 docker compose up -d

4-Vérifier que le service tourne :
 docker compose ps
 docker compose logs postgres --tail=50

5-Vérifier que l’import SQL a marché :
 docker compose exec postgres psql -U postgres -d bookdatabase -c "\dt"
 docker compose exec postgres psql -U postgres -d bookdatabase -c "\d users"

 Si ça bloque chez quelqu’un (ancien conteneur/volume), faire un reset local:
 docker compose down -v --remove-orphans
 docker compose up -d
 
relancer docker : docker compose up -d --build

note: pour lancer l'app :  docker compose up va lancer les serveurs back et front
  API racine : http://localhost:8000/
  API livres : http://localhost:8000/books
  Front : http://localhost:3000/books