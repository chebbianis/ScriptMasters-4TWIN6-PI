from flask import Flask, jsonify
from pymongo import MongoClient
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

# Load trained model
model = joblib.load('random_forest_model.pkl')

# Initialize Flask app
app = Flask(__name__)
app.url_map.strict_slashes = False  # Treat /predict and /predict/ the same

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")  # Adjust if you use auth or different host
db = client['ScriptMasters']  # Replace with your actual DB name
projects_collection = db['projects']

# GET route to make prediction from MongoDB data
@app.route('/predict', methods=['GET'])
def predict_from_db():
    try:
        # Fetch all projects
        projects_cursor = projects_collection.find()
        projects = list(projects_cursor)

        if not projects:
            return jsonify({'error': 'No projects found'}), 400

        # Extract text features (adjust fields as needed)
        text_data = [
            f"{proj.get('description', '')} {proj.get('documentationLink', '')} {proj.get('emoji', '')}"
            for proj in projects
        ]

        # Vectorize with TF-IDF (must match the model training setup)
        vectorizer = TfidfVectorizer(max_features=500)
        X = vectorizer.fit_transform(text_data)

        # Predict
        predictions = model.predict(X)

        # Combine prediction with project info
        result = []
        for proj, pred in zip(projects, predictions):
            result.append({
                'projectId': str(proj.get('_id')),
                'projectName': proj.get('name'),
                'prediction': int(pred)  # 0 or 1
            })

        return jsonify({'predictions': result})

    except Exception as e:
        print("Error:", e)
        return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
