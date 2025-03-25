import express from 'express';
import {
    createProject, getProjectsInWorkspace, getProjectById,
    updateProject, deleteProject, getProjectAnalytics
} from '../controllers/project.controller.js';

const router = express.Router();

// Routes pour les projets
router.post('/create', createProject);
router.get('/workspace/:workspaceId/all', getProjectsInWorkspace);
router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.get('/:projectId/analytics', getProjectAnalytics);

export default router; 