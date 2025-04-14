import { Request, Response } from 'express';
const express = require("express");
const router = express.Router();
const Project = require("../models/Project");


// Route pour créer un projet
router.post("/create", async (req: Request, res: Response) => {
    try {
    const { name, description, workspaceId, createdBy } = req.body;

    // Vérification des champs obligatoires
    if (!name || !workspaceId || !createdBy) {
      return res.status(400).json({ success: false, message: "Tous les champs obligatoires doivent être remplis." });
    }

    // Création du projet
    const newProject = new Project({
      name,
      description,
      workspaceId,
      createdBy,
    
    });

    // Sauvegarde dans MongoDB
    await newProject.save();

    res.status(201).json({ success: true, message: "Projet créé avec succès", project: newProject });
  }
  catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
    } else {
      // Handle other types of errors
    }
  }
});

module.exports = router;
