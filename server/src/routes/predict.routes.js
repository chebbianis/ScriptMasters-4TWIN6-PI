import express from "express";
import {
    predictProjects
} from "../controllers/predict.controller.js";
import {
    predictTaskPriority
} from "../controllers/taskPriority.controller.js";

const router = express.Router();

// Project prediction route
router.get('/predict', predictProjects);

// Task priority prediction route
router.post('/task-priority', predictTaskPriority);

export default router;
