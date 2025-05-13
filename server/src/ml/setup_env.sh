#!/bin/bash

# Script to set up a Python virtual environment for ML predictions

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Create a virtual environment if it doesn't exist
VENV_DIR="$DIR/venv"
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

# Activate the virtual environment
source "$VENV_DIR/bin/activate"

# Install required packages
echo "Installing required Python packages..."
pip install joblib scikit-learn pandas numpy xgboost

echo "Environment setup complete. You can activate it with: source $VENV_DIR/bin/activate"

# Create a simple test script
cat > "$DIR/test_env.py" << 'EOL'
import joblib
import numpy as np
import pandas as pd
import sklearn
import xgboost

print("All required packages imported successfully!")
print(f"scikit-learn version: {sklearn.__version__}")
print(f"XGBoost version: {xgboost.__version__}")
print(f"NumPy version: {np.__version__}")
print(f"Pandas version: {pd.__version__}")
print(f"Joblib version: {joblib.__version__}")
EOL

# Run the test script
echo "Testing the environment..."
python "$DIR/test_env.py"

# Deactivate the virtual environment
deactivate 