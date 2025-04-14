import Task from '../models/task.model.js';
import Project from '../models/project.model.js';

// Créer une nouvelle tâche
export const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;

        // Vérifier que le projet existe
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Projet non trouvé'
            });
        }

        // Créer la tâche
        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            project: projectId,
            assignedTo: assignedTo || null,
            createdBy: req.user.id
        });

        // Peupler les références
        await task.populate([
            { path: 'project', select: 'name emoji' },
            { path: 'assignedTo', select: 'name profilePicture' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tâche créée avec succès',
            task
        });
    } catch (error) {
        console.error('Erreur lors de la création de la tâche:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la création de la tâche'
        });
    }
};

// Récupérer toutes les tâches avec filtrage
export const getAllTasks = async (req, res) => {
    try {
        const {
            workspaceId, projectId, keyword, status, priority, assignedTo,
            pageNumber = 1, pageSize = 10
        } = req.query;

        const skip = (parseInt(pageNumber) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);

        // Construire la requête
        const query = {};

        // Filtrer par projet si spécifié
        if (projectId) {
            query.project = projectId;
        } else if (workspaceId) {
            // Si pas de projet spécifié mais workspace oui, trouver tous les projets dans ce workspace
            const projects = await Project.find({ workspaceId }).select('_id');
            query.project = { $in: projects.map(p => p._id) };
        }

        // Filtrer par mot-clé
        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { taskCode: { $regex: keyword, $options: 'i' } }
            ];
        }

        // Filtrer par statut
        if (status) {
            query.status = { $in: status.split(',') };
        }

        // Filtrer par priorité
        if (priority) {
            query.priority = { $in: priority.split(',') };
        }

        // Filtrer par assigné
        if (assignedTo) {
            query.assignedTo = { $in: assignedTo.split(',') };
        }

        // Récupérer les tâches
        const tasks = await Task.find(query)
            .populate('project', 'name emoji')
            .populate('assignedTo', 'name profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Compter le nombre total de tâches
        const totalCount = await Task.countDocuments(query);

        res.status(200).json({
            success: true,
            tasks,
            pagination: {
                totalCount,
                pageNumber: parseInt(pageNumber),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(totalCount / parseInt(pageSize))
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des tâches'
        });
    }
};

// Récupérer une tâche spécifique
export const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId)
            .populate('project', 'name emoji')
            .populate('assignedTo', 'name profilePicture')
            .populate('createdBy', 'name profilePicture');

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Tâche non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la tâche:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération de la tâche'
        });
    }
};

// Mettre à jour une tâche
export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, status, priority, dueDate, assignedTo } = req.body;

        const task = await Task.findByIdAndUpdate(
            taskId,
            {
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedTo: assignedTo || null
            },
            { new: true, runValidators: true }
        ).populate('project', 'name emoji')
            .populate('assignedTo', 'name profilePicture');

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Tâche non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tâche mise à jour avec succès',
            task
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la mise à jour de la tâche'
        });
    }
};

// Supprimer une tâche
export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findByIdAndDelete(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Tâche non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tâche supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression de la tâche'
        });
    }
};

// Récupérer les tâches récentes (utile pour le tableau de bord)
export const getRecentTasks = async (req, res) => {
    try {
        const { workspaceId, limit = 5 } = req.query;

        // Trouver tous les projets dans l'espace de travail
        const projects = await Project.find({ workspaceId }).select('_id');
        const projectIds = projects.map(p => p._id);

        // Récupérer les tâches récentes
        const tasks = await Task.find({ project: { $in: projectIds } })
            .populate('project', 'name emoji')
            .populate('assignedTo', 'name profilePicture')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            tasks
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches récentes:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des tâches récentes'
        });
    }
}; 