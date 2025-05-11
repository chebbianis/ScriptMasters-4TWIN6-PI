import sys
import json
import joblib
import numpy as np
import pandas as pd

# Load model and encoders
model = joblib.load('server/src/ml/xgboost_quality_model.pkl')
label_encoders = joblib.load('server/src/ml/label_encoders.pkl')
scaler = joblib.load('server/src/ml/scaler.pkl')

# Read input from stdin
input_json = sys.stdin.read()
data = json.loads(input_json)

# Prepare DataFrame
input_data = pd.DataFrame([{
    'Category': data['Category'],
    'Action': data['Action'],
    'Priority': data['Priority'],
    'Estimated Time (mins)': float(data['EstimatedTime']),
    'Actual Time (mins)': float(data['ActualTime']),
    'Completion Percentage': float(data['CompletionPercentage']),
    'Time Spent (mins)': float(data['TimeSpent']),
    'Status': data['Status']
}], columns=['Category', 'Action', 'Priority', 'Estimated Time (mins)', 'Actual Time (mins)', 'Completion Percentage', 'Time Spent (mins)', 'Status'])

# Encode categorical variables
for col in ['Category', 'Action', 'Priority', 'Status']:
    input_data[col] = label_encoders[col].transform([data[col]])

# Scale numerical features
input_data_scaled = scaler.transform(input_data)

# Predict
prediction = model.predict(input_data_scaled)
quality_mapping = {0: 'Poor', 1: 'Fair', 2: 'Good', 3: 'Excellent'}
quality = quality_mapping.get(prediction[0], 'Unknown')
confidence = float(model.predict_proba(input_data_scaled).max())

# Output result as JSON
print(json.dumps({'prediction': quality, 'confidence': confidence})) 