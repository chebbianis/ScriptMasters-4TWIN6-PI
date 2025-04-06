import express from 'express';
import {
    createProject, getProjectsInWorkspace, getProjectById,
    updateProject, deleteProject, getProjectAnalytics,
    getProjects
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes pour les projets
router.post('/create',authenticate,createProject);
router.post('/workspace-projects', getProjectsInWorkspace);
router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.get('/:projectId/analytics', getProjectAnalytics);

export default router; 