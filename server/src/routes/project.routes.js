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
} from "../controllers/project.controller.js";

const router = express.Router();

// Routes pour les projets
router.post("/workspace/:workspaceId/create", createProject);
router.get("/workspace/:workspaceId/all", getProjectsInWorkspace);
router.get("/names", getAllProjectNames);

router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);
router.get("/:projectId/analytics", getProjectAnalytics);
router.get("/manager/", getAllProjectManagers);

export default router;
