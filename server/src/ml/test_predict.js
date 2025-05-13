// Test script for predict.py
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample input data for prediction
const sampleData = {
  Category: 'Work',
  Action: 'Fix errors in code',
  Priority: 'High',
  EstimatedTime: 60,
  ActualTime: 90,
  CompletionPercentage: 0.8,
  TimeSpent: 75,
  Status: 'Over'
};

// Path to predict.py
const pythonScriptPath = path.join(__dirname, 'predict.py');
console.log(`Running Python script: ${pythonScriptPath}`);

// Run the Python script
const pythonProcess = spawn('python3', [pythonScriptPath]);

let stdoutBuffer = '';
let stderrBuffer = '';

// Handle Python script output
pythonProcess.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  console.log('Python stdout:', data.toString());
});

// Handle Python script errors
pythonProcess.stderr.on('data', (data) => {
  stderrBuffer += data.toString();
  console.log('Python stderr:', data.toString());
});

// Handle Python script exit
pythonProcess.on('close', (code) => {
  console.log(`Python process exited with code ${code}`);
  
  if (code === 0) {
    // Try to extract the JSON from the stdout buffer
    try {
      // Look for a valid JSON object in the output
      const jsonMatch = stdoutBuffer.match(/(\{.*\})/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const result = JSON.parse(jsonStr);
        console.log('Parsed prediction result:', result);
        console.log(`Quality: ${result.prediction}, Confidence: ${(result.confidence * 100).toFixed(2)}%`);
      } else {
        console.error('No valid JSON found in the output');
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      console.error('Raw stdout output:', stdoutBuffer);
    }
  } else {
    console.error('Python script failed with exit code:', code);
    console.error('Error output:', stderrBuffer);
  }
});

// Send input data to the Python script
pythonProcess.stdin.write(JSON.stringify(sampleData));
pythonProcess.stdin.end(); 