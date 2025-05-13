// Test script for prediction using the shell script
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

// Path to shell script
const shellScriptPath = path.join(__dirname, 'run_predict.sh');
console.log(`Running shell script: ${shellScriptPath}`);

// Ensure the shell script is executable
const chmodProcess = spawn('chmod', ['+x', shellScriptPath]);
chmodProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`chmod process exited with code ${code}`);
    return;
  }
  
  // Run the shell script
  const shellProcess = spawn(shellScriptPath, [], {
    shell: true
  });
  
  let stdoutBuffer = '';
  let stderrBuffer = '';
  
  // Handle shell script output
  shellProcess.stdout.on('data', (data) => {
    stdoutBuffer += data.toString();
    console.log('Shell stdout:', data.toString().trim());
  });
  
  // Handle shell script errors
  shellProcess.stderr.on('data', (data) => {
    stderrBuffer += data.toString();
    console.log('Shell stderr:', data.toString().trim());
  });
  
  // Handle shell script exit
  shellProcess.on('close', (code) => {
    console.log(`Shell process exited with code ${code}`);
    
    if (code === 0) {
      // Try to extract the JSON from the stdout buffer
      try {
        // The last line should be the JSON output
        const lines = stdoutBuffer.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        
        const result = JSON.parse(lastLine);
        console.log('Parsed prediction result:', result);
        console.log(`Quality: ${result.prediction}, Confidence: ${(result.confidence * 100).toFixed(2)}%`);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        console.error('Raw stdout output:', stdoutBuffer);
      }
    } else {
      console.error('Shell script failed with exit code:', code);
      console.error('Error output:', stderrBuffer);
    }
  });
  
  // Send input data to the shell script
  shellProcess.stdin.write(JSON.stringify(sampleData));
  shellProcess.stdin.end();
}); 