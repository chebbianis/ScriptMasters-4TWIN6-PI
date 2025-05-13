from flask import Flask, jsonify
from pymongo import MongoClient
import joblib
import pandas as pd

# Load trained multi-label model and vectorizer
model = joblib.load('multi_label_model.pkl')
vectorizer = joblib.load('tfidf_vectorizer.pkl')

# Initialize Flask app
app = Flask(__name__)
app.url_map.strict_slashes = False  # Treat /predict and /predict/ the same

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client['ScriptMasters']
projects_collection = db['projects']

# GET route to make predictions
@app.route('/predict', methods=['GET'])
def predict_from_db():
    try:
        # Fetch projects from MongoDB
        projects = list(projects_collection.find())
        if not projects:
            return jsonify({'error': 'No projects found'}), 400

        # Construct text features
        text_data = [
            f"{proj.get('description', '')} {proj.get('documentationLink', '')} {proj.get('emoji', '')}"
            for proj in projects
        ]

        # Vectorize using the pre-trained vectorizer
        X = vectorizer.transform(text_data)

        # Predict using the multi-label model
        predictions = model.predict(X)

        # Output column names (must match training labels)
        label_names = ['engagement_level', 'has_documentation', 'likely_success']

        # Prepare response
        results = []
        for proj, pred in zip(projects, predictions):
            result = {
                'projectId': str(proj.get('_id')),
                'projectName': proj.get('name')
            }
            for i, label in enumerate(label_names):
                result[label] = int(pred[i])
            results.append(result)

        return jsonify({'predictions': results})

    except Exception as e:
        print("Error:", e)
        return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
