#!/bin/bash

# Script pour télécharger les modèles face-api.js

# Dossier cible pour les modèles
TARGET_DIR="./public/models"

# Créer le dossier s'il n'existe pas
mkdir -p "$TARGET_DIR"

# URL de base pour les modèles
BASE_URL="https://github.com/justadudewhohacks/face-api.js/raw/master/weights"

# Liste des fichiers à télécharger
FILES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
)

# Télécharger chaque fichier
echo "Téléchargement des modèles face-api.js..."
for file in "${FILES[@]}"; do
  echo "Téléchargement de $file..."
  curl -L "$BASE_URL/$file" -o "$TARGET_DIR/$file"
done

echo "Téléchargement terminé! Les modèles sont dans $TARGET_DIR" 