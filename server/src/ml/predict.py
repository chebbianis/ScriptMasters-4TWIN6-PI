import sys
import json
import joblib
import numpy as np
import pandas as pd
import traceback
import os

def main():
    try:
        # Use absolute paths for model and encoders
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        model = joblib.load(os.path.join(BASE_DIR, 'xgboost_quality_model.pkl'))
        label_encoders = joblib.load(os.path.join(BASE_DIR, 'label_encoders.pkl'))
        scaler = joblib.load(os.path.join(BASE_DIR, 'scaler.pkl'))

        # Read input from stdin
        input_json = sys.stdin.read()
        if not input_json:
            raise ValueError("No input data received")

        data = json.loads(input_json)

        # Validate required fields
        required_fields = ['Category', 'Action', 'Priority', 'EstimatedTime', 
                         'ActualTime', 'CompletionPercentage', 'TimeSpent', 'Status']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

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
        }], columns=['Category', 'Action', 'Priority', 'Estimated Time (mins)', 
                    'Actual Time (mins)', 'Completion Percentage', 'Time Spent (mins)', 'Status'])

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
        sys.exit(0)

    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON input: {str(e)}'}))
        sys.exit(1)
    except ValueError as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'error': 'An unexpected error occurred',
            'details': str(e),
            'traceback': traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 