# CARSTYLE — Boutique accessoires auto

E-commerce full-stack pour **Carstyle** (Le Bardo, Tunisie) : accessoires intérieur / extérieur, detailing, entretien et électronique auto.

Même principe que la boutique Nelya (catalogue, panier, commandes, admin, WhatsApp), adapté à la vente d’accessoires automobile — dans l’esprit d’un shop type [Tomobile](https://tomobile.store/).

## Stack

- **Frontend** : Angular 17, Angular Material
- **Backend** : Node.js, Express, Sequelize
- **Base** : PostgreSQL 15
- **Auth** : JWT (admin, seller, client)
- **Paiement** : espèces à la livraison (structure prête pour une passerelle)

## Lancement (Docker)

1. Copier `docker/.env.example` vers `docker/.env` et renseigner `DB_PASSWORD` + `JWT_SECRET`.
2. À la racine :

```bash
docker compose -f docker/docker-compose.yml up --build
```

3. Accès :
   - Boutique : `http://localhost:4200`
   - API : `http://localhost:3000/api`
   - Health : `http://localhost:3000/health`

Au premier démarrage (catalogue vide), le seeder crée les catégories et 15 produits démo (prix en TND).

## Développement local

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm start
```

Créer un admin :

```bash
cd backend
# ADMIN_EMAIL et ADMIN_PASSWORD dans backend/.env
npm run create-admin
```

## Fonctionnalités

- Catalogue, filtres, fiche produit, favoris, panier
- Commande (compte ou invité selon réglage admin)
- Suivi public `/commande/:token`
- Admin : produits, stock, catégories, commandes, utilisateurs, paramètres
- Import CSV / Excel, WhatsApp, e-mail (si SMTP configuré)
- Devise par défaut : **TND**

## Identité client

- Marque : **CARSTYLE**
- Adresse : Avenue Bayrem Ettounsi, Le Bardo 2000
- Tél / WhatsApp : +216 53 933 751
- Instagram : [@carstyle_tunisia](https://www.instagram.com/carstyle_tunisia)
