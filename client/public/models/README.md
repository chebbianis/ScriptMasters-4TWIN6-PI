# Modèles de reconnaissance faciale

Ce dossier doit contenir les modèles nécessaires pour la reconnaissance faciale avec face-api.js.

## Installation

1. Téléchargez les modèles depuis le dépôt officiel face-api.js:
   https://github.com/justadudewhohacks/face-api.js/tree/master/weights

2. Placez les modèles suivants dans ce dossier:
   - tiny_face_detector_model-weights_manifest.json
   - tiny_face_detector_model-shard1
   - face_landmark_68_model-weights_manifest.json
   - face_landmark_68_model-shard1
   - face_recognition_model-weights_manifest.json
   - face_recognition_model-shard1
   - face_recognition_model-shard2

## Structure de dossier

Le dossier doit avoir cette structure:
```
public/
└── models/
    ├── README.md
    ├── tiny_face_detector_model-weights_manifest.json
    ├── tiny_face_detector_model-shard1
    ├── face_landmark_68_model-weights_manifest.json
    ├── face_landmark_68_model-shard1
    ├── face_recognition_model-weights_manifest.json
    ├── face_recognition_model-shard1
    └── face_recognition_model-shard2
``` 