#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p client/public/models

# Base URL for models
BASE_URL="https://github.com/vladmandic/face-api/raw/master/model"

# Face detection models
echo "Downloading face detection models..."

# SSD MobileNet model
echo "Downloading SSD MobileNet model..."
curl -s -L $BASE_URL/ssd_mobilenetv1_model-weights_manifest.json > client/public/models/ssd_mobilenetv1_model-weights_manifest.json
curl -s -L $BASE_URL/ssd_mobilenetv1_model.bin > client/public/models/ssd_mobilenetv1_model.bin

# Tiny Face Detector model
echo "Downloading Tiny Face Detector model..."
curl -s -L $BASE_URL/tiny_face_detector_model-weights_manifest.json > client/public/models/tiny_face_detector_model-weights_manifest.json
curl -s -L $BASE_URL/tiny_face_detector_model.bin > client/public/models/tiny_face_detector_model.bin

# Face landmark models
echo "Downloading face landmark models..."

# 68 point face landmarks model
echo "Downloading 68 point face landmark model..."
curl -s -L $BASE_URL/face_landmark_68_model-weights_manifest.json > client/public/models/face_landmark_68_model-weights_manifest.json
curl -s -L $BASE_URL/face_landmark_68_model.bin > client/public/models/face_landmark_68_model.bin

# Face recognition model
echo "Downloading face recognition model..."
curl -s -L $BASE_URL/face_recognition_model-weights_manifest.json > client/public/models/face_recognition_model-weights_manifest.json
curl -s -L $BASE_URL/face_recognition_model.bin > client/public/models/face_recognition_model.bin

# Face expression model
echo "Downloading face expression model..."
curl -s -L $BASE_URL/face_expression_model-weights_manifest.json > client/public/models/face_expression_model-weights_manifest.json
curl -s -L $BASE_URL/face_expression_model.bin > client/public/models/face_expression_model.bin

# Age and gender model
echo "Downloading age and gender model..."
curl -s -L $BASE_URL/age_gender_model-weights_manifest.json > client/public/models/age_gender_model-weights_manifest.json
curl -s -L $BASE_URL/age_gender_model.bin > client/public/models/age_gender_model.bin

echo "All face-api.js models downloaded successfully to client/public/models/" 