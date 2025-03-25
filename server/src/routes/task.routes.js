import express from 'express';
import {
    createTask, getAllTasks, getTaskById,
    updateTask, deleteTask, getRecentTasks
} from '../controllers/task.controller.js';

const router = express.Router();

// Routes pour les tâches
router.post('/create', createTask);
router.get('/all', getAllTasks);
router.get('/recent', getRecentTasks);
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

export default router; 