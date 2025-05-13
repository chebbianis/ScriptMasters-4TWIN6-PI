import express from "express";
import {
  createProject,
  getProjectsInWorkspace,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectAnalytics,
  getAllProjectNames,
  getAllProjectManagers,
  searchProjects,
} from "../controllers/project.controller.js";
import { getDeveloperRecommendations } from "../controllers/recommendation.controller.js";

const router = express.Router();

// Routes pour les projets
router.post("/workspace/:workspaceId/create", createProject);
router.get("/workspace/:workspaceId/all", getProjectsInWorkspace);
router.get("/names", getAllProjectNames);

// New route that accepts both workspaceId and projectId
router.get("/workspace/:workspaceId/project/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);
router.get("/:projectId/analytics", getProjectAnalytics);
router.get("/manager/", getAllProjectManagers);
router.get("/search", searchProjects);

// Route pour les recommandations de développeurs
router.get("/:projectId/recommendations", getDeveloperRecommendations);

export default router;
