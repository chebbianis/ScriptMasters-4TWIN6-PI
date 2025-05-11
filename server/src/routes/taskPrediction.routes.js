import express from 'express';
import {
    predictTaskPriority,
    getTaskPredictionHistory,
    updatePredictionWithActual
} from '../controllers/taskPrediction.controller.js';

const router = express.Router();

// Predict priority for a task
router.get('/predict/:taskId', predictTaskPriority);

// Get prediction history for a task
router.get('/history/:taskId', getTaskPredictionHistory);

// Update prediction with actual priority
router.put('/update/:predictionId', updatePredictionWithActual);

export default router; 