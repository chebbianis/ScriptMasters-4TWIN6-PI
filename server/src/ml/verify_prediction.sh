#!/bin/bash

# Simple test script to verify that our prediction pipeline works

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Make sure the run_predict.sh script is executable
chmod +x "$DIR/run_predict.sh"

# Test data
TEST_DATA='{"Category":"Work","Action":"Fix errors in code","Priority":"High","EstimatedTime":60,"ActualTime":90,"CompletionPercentage":0.8,"TimeSpent":75,"Status":"Over"}'

# Print test data
echo "Testing with data:"
echo "$TEST_DATA"
echo "------------------------"

# Run the prediction script
echo "Running prediction..."
echo "$TEST_DATA" | "$DIR/run_predict.sh"

# Exit with the status of the last command
exit $? 