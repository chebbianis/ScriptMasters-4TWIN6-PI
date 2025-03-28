import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import { TaskStatus } from '../models/task.model.js';

// Créer un nouveau projet
/*
Test Postman pour createProject:

1. Méthode: POST
2. URL: http://localhost:3000/api/projects/create
3. Headers:
   - Content-Type: application/json
   - Authorization: Bearer <votre_token_jwt>
4. Body (raw JSON):
   {
       "name": "Projet Test",
       "description": "Description du projet de test",
       "emoji": "🚀",
       "workspaceId": "65f1a2b3c4d5e6f7g8h9i0j1"
   }

5. Réponse attendue (201 Created):
   {
       "success": true,
       "message": "Projet créé avec succès",
       "project": {
           "_id": "65f1a2b3c4d5e6f7g8h9i0j2",
           "name": "Projet Test",
           "description": "Description du projet de test",
           "emoji": "🚀",
           "workspaceId": "65f1a2b3c4d5e6f7g8h9i0j1",
           "createdBy": "65f1a2b3c4d5e6f7g8h9i0j3",
           "createdAt": "2024-03-13T12:00:00.000Z",
           "updatedAt": "2024-03-13T12:00:00.000Z"
       }
   }

6. Erreur possible (500 Internal Server Error):
   {
       "success": false,
       "error": "Erreur serveur lors de la création du projet"
   }
*/

export const createProject = async (req, res) => {
    try {
        const { name, description, emoji, workspaceId, createdBy } = req.body;

        // Créer le projet en utilisant l'ID fourni dans le corps de la requête
        const project = await Project.create({
            name,
            description,
            emoji: emoji || '📊',
            workspaceId,
            createdBy: createdBy // Utiliser l'ID fourni par le client
        });

        res.status(201).json({
            success: true,
            message: 'Projet créé avec succès',
            project
        });
    } catch (error) {
        console.error('Erreur lors de la création du projet:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la création du projet'
        });
    }
};

// Récupérer tous les projets d'un espace de travail
export const getProjectsInWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { pageSize = 10, pageNumber = 1 } = req.query;

        const skip = (parseInt(pageNumber) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);

        // Récupérer les projets
        const projects = await Project.find({ workspaceId })
            .populate('createdBy', 'name profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Compter le nombre total de projets
        const totalCount = await Project.countDocuments({ workspaceId });

        res.status(200).json({
            success: true,
            projects,
            pagination: {
                totalCount,
                pageNumber: parseInt(pageNumber),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(totalCount / parseInt(pageSize))
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des projets:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des projets'
        });
    }
};

// Récupérer un projet spécifique
export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId)
            .populate('createdBy', 'name profilePicture');

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Projet non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du projet:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération du projet'
        });
    }
};

// Mettre à jour un projet
export const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, emoji } = req.body;

        const project = await Project.findByIdAndUpdate(
            projectId,
            { name, description, emoji },
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Projet non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Projet mis à jour avec succès',
            project
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du projet:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la mise à jour du projet'
        });
    }
};

// Supprimer un projet
export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Supprimer le projet
        const project = await Project.findByIdAndDelete(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Projet non trouvé'
            });
        }

        // Supprimer également toutes les tâches associées
        await Task.deleteMany({ project: projectId });

        res.status(200).json({
            success: true,
            message: 'Projet et tâches associées supprimés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du projet:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression du projet'
        });
    }
};

// Obtenir les statistiques d'un projet
export const getProjectAnalytics = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Vérifier que le projet existe
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Projet non trouvé'
            });
        }

        // Calculer les statistiques des tâches
        const totalTasks = await Task.countDocuments({ project: projectId });

        const completedTasks = await Task.countDocuments({
            project: projectId,
            status: TaskStatus.DONE
        });

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const overdueTasks = await Task.countDocuments({
            project: projectId,
            status: { $ne: TaskStatus.DONE },
            dueDate: { $lt: today }
        });

        res.status(200).json({
            success: true,
            analytics: {
                totalTasks,
                completedTasks,
                overdueTasks
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du projet:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des statistiques'
        });
    }
}; 