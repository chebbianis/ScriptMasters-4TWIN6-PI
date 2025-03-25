import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import { TaskStatus } from '../models/task.model.js';

// Créer un nouveau projet
export const createProject = async (req, res) => {
    try {
        const { name, description, emoji, workspaceId } = req.body;

        // Vérifier que l'utilisateur a accès à cet espace de travail
        // Cette vérification pourrait être implémentée selon la logique de votre application

        // Créer le projet
        const project = await Project.create({
            name,
            description,
            emoji: emoji || '📊',
            workspaceId,
            createdBy: req.user.id
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