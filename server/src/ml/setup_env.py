#!/usr/bin/env python3
"""
This script checks if required ML libraries are installed
and attempts to install them if they're not found.
"""
import sys
import subprocess
import os
import importlib

def check_and_install(package_name):
    try:
        importlib.import_module(package_name)
        print(f"✅ {package_name} is already installed")
        return True
    except ImportError:
        print(f"❌ {package_name} is not installed, attempting to install...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", package_name])
            print(f"✅ Successfully installed {package_name}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package_name}: {e}")
            print(f"You may need to manually install {package_name} with: pip install --user {package_name}")
            return False

def main():
    print("Checking required ML libraries...")
    
    # List of required packages
    required_packages = [
        "joblib",
        "scikit-learn",
        "pandas",
        "numpy",
        "xgboost"
    ]
    
    # Check and install each package
    all_installed = True
    for package in required_packages:
        if not check_and_install(package):
            all_installed = False
    
    # Check the actual versions
    if all_installed:
        print("\nVerifying installed versions:")
        try:
            import joblib
            import numpy as np
            import pandas as pd
            import sklearn
            import xgboost
            
            print(f"scikit-learn version: {sklearn.__version__}")
            print(f"XGBoost version: {xgboost.__version__}")
            print(f"NumPy version: {np.__version__}")
            print(f"Pandas version: {pd.__version__}")
            print(f"Joblib version: {joblib.__version__}")
            
            print("\n✅ All required packages installed successfully!")
        except ImportError as e:
            print(f"\n❌ Error importing libraries: {e}")
            return 1
    else:
        print("\n❌ Some packages failed to install. Please install them manually.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 