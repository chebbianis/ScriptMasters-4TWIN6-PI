# Task Quality Predictor Web App

This web application uses machine learning to predict the quality of tasks based on various input parameters.

## Features

- Predict task quality (Poor, Fair, Good, Excellent)
- Input parameters include:
  - Category (Development, Design, Testing, Documentation)
  - Action (Create, Update, Review, Delete)
  - Priority (High, Medium, Low)
  - Status (Not Started, In Progress, Completed)
  - Time Spent (in minutes)
- Shows prediction confidence
- Modern, responsive UI

## Setup Instructions

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure you have the trained model file (`xgboost_quality_model.pkl`) in the root directory.

3. Run the Flask application:
```bash
python app.py
```

4. Open your web browser and navigate to:
```
http://localhost:5000
```

## Usage

1. Fill in the form with the task details
2. Click "Predict Quality"
3. View the predicted quality and confidence score

## Technical Details

- Built with Flask
- Uses XGBoost for predictions
- Bootstrap 5 for UI
- Responsive design
- Async API calls 