import sys
import json
import traceback
import os

# Redirect debug information to stderr, keeping stdout clean for results only
print("Starting predict.py script...", file=sys.stderr)

try:
    # Import required packages
    print("Importing required packages...", file=sys.stderr)
    import joblib
    import numpy as np
    import pandas as pd
    print("Packages imported successfully", file=sys.stderr)
except ImportError as e:
    print(f"Error importing packages: {str(e)}", file=sys.stderr)
    print(json.dumps({'error': f'Missing required package: {str(e)}'}))
    sys.exit(1)

def main():
    try:
        print("Inside main() function", file=sys.stderr)
        # Use absolute paths for model and encoders
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        print(f"Base directory: {BASE_DIR}", file=sys.stderr)
        
        model_path = os.path.join(BASE_DIR, 'xgboost_quality_model.pkl')
        encoders_path = os.path.join(BASE_DIR, 'label_encoders.pkl')
        scaler_path = os.path.join(BASE_DIR, 'scaler.pkl')
        
        print(f"Loading model from: {model_path}", file=sys.stderr)
        print(f"Loading encoders from: {encoders_path}", file=sys.stderr)
        print(f"Loading scaler from: {scaler_path}", file=sys.stderr)
        
        # Check if the files exist
        if not os.path.exists(model_path):
            raise ValueError(f"Model file not found: {model_path}")
        if not os.path.exists(encoders_path):
            raise ValueError(f"Encoders file not found: {encoders_path}")
        if not os.path.exists(scaler_path):
            raise ValueError(f"Scaler file not found: {scaler_path}")
            
        model = joblib.load(model_path)
        label_encoders = joblib.load(encoders_path)
        scaler = joblib.load(scaler_path)
        
        print("Models loaded successfully", file=sys.stderr)

        # Read input from stdin
        print("Reading input from stdin...", file=sys.stderr)
        input_json = sys.stdin.read().strip()
        print(f"Received input: {input_json}", file=sys.stderr)
        
        if not input_json:
            raise ValueError("No input data received")

        # Parse JSON data
        try:
            data = json.loads(input_json)
            print(f"Parsed input data: {data}", file=sys.stderr)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)}", file=sys.stderr)
            raise ValueError(f"Invalid JSON input: {str(e)}")

        # Validate required fields
        required_fields = ['Category', 'Action', 'Priority', 'EstimatedTime', 
                         'ActualTime', 'CompletionPercentage', 'TimeSpent', 'Status']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Prepare DataFrame
        print("Preparing input dataframe...", file=sys.stderr)
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
        
        print(f"Input DataFrame: {input_data}", file=sys.stderr)

        # Encode categorical variables
        print("Encoding categorical variables...", file=sys.stderr)
        for col in ['Category', 'Action', 'Priority', 'Status']:
            print(f"Encoding {col} with values: {data[col]}", file=sys.stderr)
            input_data[col] = label_encoders[col].transform([data[col]])

        print("Scaling numerical features...", file=sys.stderr)
        # Scale numerical features
        input_data_scaled = scaler.transform(input_data)
        print(f"Scaled input data shape: {input_data_scaled.shape}", file=sys.stderr)

        print("Making prediction...", file=sys.stderr)
        # Predict
        prediction = model.predict(input_data_scaled)
        quality_mapping = {0: 'Poor', 1: 'Fair', 2: 'Good', 3: 'Excellent'}
        quality = quality_mapping.get(prediction[0], 'Unknown')
        confidence = float(model.predict_proba(input_data_scaled).max())
        print(f"Prediction result: {quality}, confidence: {confidence}", file=sys.stderr)

        # Output result as JSON to stdout, making sure nothing else gets written to stdout
        result = json.dumps({'prediction': quality, 'confidence': confidence})
        # Make sure to clean any previous stdout content
        sys.stdout.flush()
        print(result)
        sys.exit(0)

    except json.JSONDecodeError as e:
        error_response = json.dumps({'error': f'Invalid JSON input: {str(e)}'})
        print(error_response)
        sys.exit(1)
    except ValueError as e:
        error_response = json.dumps({'error': str(e)})
        print(error_response)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        error_response = json.dumps({
            'error': 'An unexpected error occurred',
            'details': str(e)
        })
        print(error_response)
        sys.exit(1)

if __name__ == "__main__":
    print("Script starting execution...", file=sys.stderr)
    main()
    print("Script completed successfully", file=sys.stderr) 