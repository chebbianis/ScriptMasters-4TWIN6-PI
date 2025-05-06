
import express from "express";
import {
    predictProjects
} from "../controllers/predict.controller.js";

const router = express.Router();

// Change this from POST to GET
router.get('/predict', predictProjects);


export default router;
