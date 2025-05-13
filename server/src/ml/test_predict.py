#!/usr/bin/env python3
import os
import sys
import json
import subprocess

# Sample data for prediction
sample_data = {
    "Category": "Work",
    "Action": "Fix errors in code",
    "Priority": "High",
    "EstimatedTime": 60,
    "ActualTime": 90,
    "CompletionPercentage": 0.8,
    "TimeSpent": 75,
    "Status": "Over"
}

# Get the path to the predict.py script
script_dir = os.path.dirname(os.path.abspath(__file__))
predict_script = os.path.join(script_dir, 'predict.py')

print(f"Running predict.py at {predict_script}")

# Run the predict.py script as a subprocess
process = subprocess.Popen(
    [sys.executable, predict_script],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Send the sample data to the script
input_json = json.dumps(sample_data)
stdout, stderr = process.communicate(input_json)

# Print the output
print("\nStandard Output:")
print(stdout)

if stderr:
    print("\nStandard Error:")
    print(stderr)

print(f"\nExit Code: {process.returncode}")

# Try to parse the JSON output
try:
    result = json.loads(stdout)
    print("\nParsed Result:")
    print(f"Prediction: {result.get('prediction')}")
    print(f"Confidence: {result.get('confidence')}")
except json.JSONDecodeError as e:
    print(f"\nError parsing JSON: {e}")
except Exception as e:
    print(f"\nUnexpected error: {e}") 