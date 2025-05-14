# HScriptMasters - Plateforme de Gestion de Projets

## Description

ScriptMasters est une plateforme complète de gestion de projets conçue pour faciliter la collaboration entre développeurs. Elle intègre :

* Un système de recommandation intelligent basé sur l'IA pour suggérer les développeurs les plus adaptés à chaque projet en fonction de leurs compétences, expérience et charge de travail actuelle.
* Un modèle de prédiction des tâches pour estimer les durées et les ressources nécessaires.
* Un modèle de classification des développeurs basé sur l'IA pour segmenter les profils selon leurs performances et spécialités.

## Fonctionnalités principales

* **Gestion de projets** : Création, modification et suivi des projets
* **Gestion des tâches** : Attribution, suivi d'avancement et gestion des échéances
* **Système de recommandation de développeurs** : Utilisation d'un modèle d'IA pour recommander les développeurs les plus adaptés à un projet
* **Modèle de prédiction de tâches** : Estimation automatique des durées et priorités des tâches
* **Modèle de classification des développeurs** : Segmentation et évaluation des profils de développeurs selon leurs compétences et historique
* **Authentification et sécurité** : Connexion sécurisée avec support d'authentification Google
* **Espaces de travail collaboratifs** : Organisation des projets par équipes
* **Interface utilisateur moderne** : Design réactif et ergonomique avec Tailwind CSS et Shadcn UI

## Architecture technique

### Frontend (Client)

* **Technologies** : React 18, TypeScript, Vite
* **État et requêtes** : Tanstack React Query, Zustand
* **Interface utilisateur** : Tailwind CSS, Shadcn UI, Framer Motion
* **Authentification** : JWT, OAuth 2.0 (Google)
* **Temps réel** : Socket.IO

### Backend (Serveur)

* **Technologies** : Node.js, Express.js
* **Base de données** : MongoDB avec Mongoose
* **Authentification** : Passport.js, JWT
* **Traitement des fichiers** : Multer
* **Communication temps réel** : Socket.IO

### Système de recommandation et prédiction (ML)

Le module ML centralise plusieurs modèles pour enrichir la plateforme :

* **RandomForestRegressor** pour la recommandation de développeurs
* **Modèle de prédiction de tâches** (basé sur des régressions et séries temporelles) pour estimer la durée et la charge de travail
* **Modèle de classification des développeurs** (basé sur des algorithmes supervisés) pour segmenter les profils selon leurs performances
* **Intégration** : Communication Node.js - Python via `child_process`

## Installation et démarrage

### Prérequis

* Node.js (v14 ou plus)
* MongoDB
* Python 3.x avec scikit-learn et joblib

### Installation du client

```bash
cd client
npm install
```

### Installation du serveur

```bash
cd server
npm install
```

### Configuration

1. Créez un fichier `.env` dans le dossier server avec les variables suivantes :

```
MONGODB_URI=votre_uri_mongodb
JWT_SECRET=votre_secret_jwt
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
CLIENT_URL=http://localhost:5173
```

### Démarrage du projet

#### Démarrage du serveur backend

```bash
cd server
npm run dev
```

#### Démarrage du client frontend

```bash
cd client
npm run dev
```

## Structure du projet

```
ScriptMasters/
├── client/                 # Application frontend React
│   ├── public/             # Fichiers statiques
│   └── src/                # Code source frontend
│       ├── components/     # Composants React
│       ├── contexts/       # Contextes React
│       ├── hooks/          # Hooks personnalisés
│       ├── lib/            # Fonctions utilitaires
│       ├── pages/          # Pages principales
│       ├── stores/         # Stores Zustand
│       └── types/          # Types TypeScript
├── server/                 # Serveur backend Node.js
│   ├── src/                # Code source backend
│       ├── controllers/    # Contrôleurs des routes
│       ├── models/         # Modèles Mongoose
│       ├── routes/         # Définition des routes API
│       └── ml/             # Système de machine learning
│           ├── skill_recommendation.js       # Interface JS vers Python
│           ├── recommendation_model.py        # Modèle RF pour recommandation
│           ├── task_prediction_model.py      # Modèle de prédiction des tâches
│           └── developer_classification.py   # Modèle de classification des développeurs
└── docker-compose.yml      # Configuration Docker
```

## Développement

Le projet est organisé en deux parties principales : client et serveur.  Le backend intègre plusieurs modèles Python pour la recommandation, la prédiction de tâches et la classification des développeurs.

## Auteurs

* Équipe ScriptMasters

Anis Chebbi
Hachem Akrimi
Meriem Mghirbi 
Ousama wanassi
Aziz Halleb
