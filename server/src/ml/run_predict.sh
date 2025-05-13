#!/bin/bash

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Path to virtual environment
VENV_DIR="$DIR/venv"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..." >&2
    python3 -m venv "$VENV_DIR"
    
    # Activate virtual environment
    source "$VENV_DIR/bin/activate"
    
    # Install required packages in the virtual environment
    pip install joblib scikit-learn pandas numpy xgboost
else
    # Activate virtual environment
    source "$VENV_DIR/bin/activate"
fi

# Run the prediction script with the input from stdin
cat | python3 "$DIR/predict.py"

# Deactivate virtual environment
deactivate 