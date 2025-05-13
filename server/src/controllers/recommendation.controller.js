import { recommendDevelopers } from "../ml/skill_recommendation.js";
import { Project } from "../models/project.model.js";

export const getDeveloperRecommendations = async (req, res) => {
    try {
        console.log("Début de la récupération des recommandations pour le projet:", req.params.projectId);

        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: "ID du projet non spécifié"
            });
        }

        // Vérifier que le projet existe
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Projet non trouvé"
            });
        }

        // Générer les recommandations
        const recommendations = await recommendDevelopers(projectId);

        console.log("Recommandations générées avec succès:", recommendations);

        res.status(200).json(recommendations);
    } catch (error) {
        console.error("Erreur lors de la récupération des recommandations:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la génération des recommandations",
            error: error.message
        });
    }
}; 