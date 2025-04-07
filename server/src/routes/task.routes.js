import express from 'express';
import {
    createTask, getAllTasks, getTaskById, bottleneck,
    updateTask, deleteTask, getRecentTasks,
    getAllWorkspaces,
    reminder
} from '../controllers/task.controller.js';
import { getProjects } from '../controllers/project.controller.js';

const router = express.Router();

// Routes pour les tâches
router.post('/create', createTask);
router.get('/all', getAllTasks);
router.get('/reminder', reminder);
router.get('/allworkspaces', getAllWorkspaces);
router.get('/recent', getRecentTasks);
router.get('/all-projects', getProjects);  // Moved this BEFORE the dynamic route
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);
router.get('/:workspaceId/bottlenecks', bottleneck);

export default router;