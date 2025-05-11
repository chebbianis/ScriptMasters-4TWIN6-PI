import express from "express";
import {
    predictProjects
} from "../controllers/predict.controller.js";
import {
    predictTaskPriority
} from "../controllers/taskPriority.controller.js";
import { spawn } from 'child_process';
import path from 'path';

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
router.post('/', (req, res) => {
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
    if (code === 0 && pyData) {
      try {
        const result = JSON.parse(pyData);
        res.json(result);
      } catch (e) {
        res.status(500).json({ error: 'Python returned invalid JSON', details: pyData });
      }
    } else {
      res.status(500).json({ error: pyErr || 'Prediction failed' });
    }
  });
});

export default router;
