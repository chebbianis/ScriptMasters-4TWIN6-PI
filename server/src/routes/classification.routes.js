import express from "express";
import { classifyUsersSummary } from "../controllers/classification.controller.js";

const router = express.Router();

// On conserve /summary, on passera workspaceId en query param si besoin
router.get("/summary", classifyUsersSummary);

export default router;
