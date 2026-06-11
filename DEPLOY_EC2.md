# Deploiement EC2 AWS

Ce guide garde `docker-compose.yml` pour le developpement local et utilise `docker-compose.prod.yml` pour EC2.

## 1. Preparer le repo local

```powershell
git status
git add .
git commit -m "Prepare production deployment"
git push origin main
```

Si ta branche s'appelle `master`, remplace `main` par `master`.

## 2. Creer l'instance EC2

- Image conseillee : Ubuntu Server 22.04 ou 24.04 LTS.
- Type minimum : `t3.small` ou `t3.medium` si le build Docker est lent.
- Stockage : au moins 20 Go.
- Security Group :
  - SSH `22` depuis ton IP.
  - Frontend `3000` depuis `0.0.0.0/0`.
  - Backend `8000` depuis `0.0.0.0/0`.

Pour une vraie production, mets ensuite Nginx + HTTPS et ferme `3000/8000` au public.

## 3. Installer Docker sur EC2

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Deconnecte-toi puis reconnecte-toi en SSH pour activer le groupe Docker.

## 4. Cloner le projet sur EC2

```bash
git clone <URL_DE_TON_REPO_GITHUB>
cd booktrack-churnguard
```

## 5. Configurer les variables production

```bash
cp .env.prod.example .env
nano .env
```

Remplace `1.2.3.4` par l'IP publique EC2.

Exemple :

```env
POSTGRES_PASSWORD=un_mot_de_passe_fort
FRONTEND_URL=http://EC2_PUBLIC_IP:3000
NEXT_PUBLIC_API_URL=http://EC2_PUBLIC_IP:8000
CORS_ORIGINS=http://EC2_PUBLIC_IP:3000
```

## 6. Lancer l'application

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Verifier :

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Ouvre ensuite :

```text
http://EC2_PUBLIC_IP:3000
```

## 7. Mettre a jour apres un nouveau push

```bash
cd booktrack-churnguard
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Commandes utiles

Voir les logs :

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Redemarrer :

```bash
docker compose -f docker-compose.prod.yml restart
```

Entrer dans PostgreSQL :

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d bookdatabase
```

Stopper sans supprimer la base :

```bash
docker compose -f docker-compose.prod.yml down
```

Attention : ne fais pas `docker compose down -v` sur EC2, car cela supprime le volume PostgreSQL.
