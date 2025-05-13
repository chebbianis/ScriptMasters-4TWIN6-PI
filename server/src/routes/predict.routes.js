import express from "express";
import {
    predictProjects
} from "../controllers/predict.controller.js";
import {
    predictTaskPriority
} from "../controllers/taskPriority.controller.js";
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Temporary in-memory storage for predictions until we move to database
const predictionHistory = [];
// Separate storage for priority predictions
const priorityPredictionHistory = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    priority: 'HIGH',
    confidence: 0.8,
    taskDescription: 'Implement user authentication'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    priority: 'HIGH',
    confidence: 0.8,
    taskDescription: 'Fix security vulnerability'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    priority: 'MEDIUM',
    confidence: 0.7,
    taskDescription: 'Update API documentation'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    priority: 'LOW',
    confidence: 0.6,
    taskDescription: 'Minor UI improvements'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    priority: 'HIGH',
    confidence: 0.8,
    taskDescription: 'Optimize database queries'
  }
];

// Project prediction route
router.get('/predict', predictProjects);

// Task priority prediction route with history
router.post('/task-priority', async (req, res) => {
  try {
    // Call the original controller
    const result = await predictTaskPriority(req, res);
    
    // If the controller handled the response, we don't need to do anything
    if (res.headersSent) return;
    
    // Otherwise, store the prediction in history
    const predictionRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      priority: req.body.priority || result?.priority || 'MEDIUM',
      confidence: result?.confidence || 0.6,
      taskDescription: req.body.description || req.body.descriptionLength + ' chars' || 'Task description',
      features: req.body
    };
    
    priorityPredictionHistory.unshift(predictionRecord);
    
    // Keep only the last 20 predictions
    if (priorityPredictionHistory.length > 20) {
      priorityPredictionHistory.pop();
    }
    
    // Return the original response
    return res.json(result);
  } catch (error) {
    console.error('Error in task priority prediction:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message || 'Failed to predict task priority' 
    });
  }
});

// Get all priority predictions
router.get('/task-priority/history', (req, res) => {
  try {
    // Filter out sensitive data
    const simplifiedHistory = priorityPredictionHistory.map(({ id, timestamp, priority, confidence, taskDescription }) => ({
      id, timestamp, priority, confidence, taskDescription
    }));
    
    res.json({ predictions: simplifiedHistory });
  } catch (error) {
    console.error('Error fetching priority prediction history:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message || 'Failed to fetch priority prediction history' 
    });
  }
});

// Get specific number of priority predictions
router.get('/task-priority/history/:count', (req, res) => {
  try {
    const count = parseInt(req.params.count) || 5;
    
    // Filter out sensitive data and limit to requested count
    const simplifiedHistory = priorityPredictionHistory
      .slice(0, count)
      .map(({ id, timestamp, priority, confidence, taskDescription }) => ({
        id, timestamp, priority, confidence, taskDescription
      }));
    
    res.json({ predictions: simplifiedHistory });
  } catch (error) {
    console.error('Error fetching priority prediction history:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message || 'Failed to fetch priority prediction history' 
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: "Test route works!" });
});

// Helper to run the Python prediction script
const predictWithPython = (inputData) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'ml', 'run_predict.sh');
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Script not found at ${scriptPath}`));
    }
    
    console.log(`Running script: ${scriptPath}`);
    console.log('Input data:', JSON.stringify(inputData));
    
    // Make script executable
    fs.chmodSync(scriptPath, '755');
    
    // Run the script in bash
    const process = spawn('/bin/bash', [scriptPath]);
    
    let result = '';
    let error = '';

    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log('Script stdout:', chunk);
      result += chunk;
    });

    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.log('Script stderr:', chunk);
      error += chunk;
    });

    process.on('close', (code) => {
      console.log(`Script process exited with code ${code}`);
      
      if (code !== 0) {
        reject(new Error(`Script process exited with code ${code}: ${error}`));
      } else {
        try {
          // The JSON should be the last line of output
          const lines = result.trim().split('\n');
          const jsonLine = lines[lines.length - 1];
          
          const parsed = JSON.parse(jsonLine);
          console.log('Parsed result:', parsed);
          resolve(parsed);
        } catch (e) {
          console.error('Failed to parse script output:', e);
          console.error('Raw output:', result);
          reject(new Error(`Failed to parse script output: ${e.message}`));
        }
      }
    });

    // Send input data to the script
    process.stdin.write(JSON.stringify(inputData));
    process.stdin.end();
  });
};

// Predict task quality
router.post('/predict', async (req, res) => {
  try {
    console.log('Received prediction request:', req.body);
    const result = await predictWithPython(req.body);
    
    // Store prediction in history
    const predictionRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      quality: result.prediction,
      confidence: result.confidence,
      taskDescription: req.body.Action || 'Unknown task',
      taskData: req.body
    };
    
    predictionHistory.unshift(predictionRecord); // Add to beginning of array
    
    // Keep only the last 20 predictions
    if (predictionHistory.length > 20) {
      predictionHistory.pop();
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in task quality prediction:', error);
    res.status(500).json({ error: error.message || 'Failed to predict task quality' });
  }
});

// Get all predictions in history
router.get('/predict/history', (req, res) => {
  try {
    // Return predictions without the full taskData to reduce payload size
    const simplifiedHistory = predictionHistory.map(({ id, timestamp, quality, confidence, taskDescription }) => ({
      id, timestamp, quality, confidence, taskDescription
    }));
    
    res.json({ predictions: simplifiedHistory });
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch prediction history' });
  }
});

// Get predictions for a specific task (placeholder)
router.get('/predict/history/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    
    // This is a placeholder - in a real implementation, we would filter by taskId
    // For demo purposes, just return the general history
    const simplifiedHistory = predictionHistory.map(({ id, timestamp, quality, confidence, taskDescription }) => ({
      id, timestamp, quality, confidence, taskDescription
    }));
    
    res.json({ 
      taskId,
      predictions: simplifiedHistory.slice(0, 5) // Limit to 5 most recent
    });
  } catch (error) {
    console.error('Error fetching task prediction history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch task prediction history' });
  }
});

// Test POST route for debugging
router.post('/predict/test', (req, res) => {
  res.json({ message: "Test route works!" });
});

export default router;
