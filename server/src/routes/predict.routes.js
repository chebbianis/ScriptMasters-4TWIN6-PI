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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

console.log("Predict routes loaded");

// Project prediction route
router.get('/predict', predictProjects);

// Task priority prediction route
router.post('/task-priority', predictTaskPriority);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: "Test route works!" });
});

// POST /predict (for ML model)
router.post('/predict', (req, res) => {
  console.log('Received /predict POST with body:', req.body);
  const scriptPath = path.resolve(__dirname, '../ml/predict.py');
  const py = spawn('python3', [scriptPath]);
  let pyData = '';
  let pyErr = '';

  py.stdin.write(JSON.stringify(req.body));
  py.stdin.end();

  py.stdout.on('data', (data) => {
    pyData += data.toString();
  });
  py.stderr.on('data', (data) => {
    pyErr += data.toString();
  });
  py.on('close', (code) => {
    console.log('Python process closed with code:', code);
    console.log('Python stdout:', pyData);
    console.log('Python stderr:', pyErr);
    if (code === 0 && pyData) {
      try {
        const result = JSON.parse(pyData);
        res.json(result);
      } catch (e) {
        res.status(500).json({ error: 'Python returned invalid JSON', details: pyData });
      }
    } else {
      res.status(500).json({ error: pyErr || 'Prediction failed', details: pyData });
    }
  });
});

// Test POST route for debugging
router.post('/predict/test', (req, res) => {
  res.json({ message: "Test route works!" });
});

export default router;
