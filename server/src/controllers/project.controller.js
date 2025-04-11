import { Project } from "../models/project.model.js";
import Task from "../models/task.model.js";
import { TaskStatus } from "../models/task.model.js";

// Créer un nouveau projet
export const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params; // récupère l'ID du workspace depuis l'URL
    const { name, description, users, projectManager } = req.body;

    if (!projectManager) {
      return res
        .status(400)
        .json({ message: "Le chef de projet est obligatoire" });
    }

    const newProject = new Project({
      workspaceId, // ici workspaceId provient de req.params
      name,
      description,
      users,
      projectManager,
    });

    await newProject.save();

    res
      .status(201)
      .json({ message: "Projet créé avec succès", project: newProject });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création du projet", error });
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
      .populate("createdBy", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (!projects || projects.length === 0) {
      console.log("⚠️ Aucun projet trouvé pour workspaceId:", workspaceId);
    }

    // Compter le nombre total de projets
    const totalCount = await Project.countDocuments({ workspaceId });

    res.status(200).json({
      success: true,
      projects,
      pagination: {
        totalCount,
        pageNumber: parseInt(pageNumber),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / parseInt(pageSize)),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des projets",
    });
  }
};

// Récupérer un projet spécifique
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate(
      "createdBy",
      "name profilePicture"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération du projet",
    });
  }
};

// Mettre à jour un projet
export const updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProject)
      return res.status(404).json({ message: "Projet non trouvé" });
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
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
        error: "Projet non trouvé",
      });
    }

    // Supprimer également toutes les tâches associées
    await Task.deleteMany({ project: projectId });

    res.status(200).json({
      success: true,
      message: "Projet et tâches associées supprimés avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression du projet",
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
        error: "Projet non trouvé",
      });
    }

    // Calculer les statistiques des tâches
    const totalTasks = await Task.countDocuments({ project: projectId });

    const completedTasks = await Task.countDocuments({
      project: projectId,
      status: TaskStatus.DONE,
    });

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const overdueTasks = await Task.countDocuments({
      project: projectId,
      status: { $ne: TaskStatus.DONE },
      dueDate: { $lt: today },
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalTasks,
        completedTasks,
        overdueTasks,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques du projet:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des statistiques",
    });
  }
};

export const getAllProjectNames = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ 
        message: "Workspace ID is required",
        projects: [] 
      });
    }
    
    console.log(`Fetching projects for workspace: ${workspaceId}`);
    
    // Récupère tous les projets du workspace spécifié
    const projects = await Project.find({ workspaceId }, "_id name");
    
    console.log(`Found ${projects.length} projects for workspace ${workspaceId}`);
    
    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching project names:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des projets",
      error: error.message,
      projects: []
    });
  }
};

export const getProjects = async (req, res) => {
    try {
        console.log('Starting getAllProjects...');

        // Check if Project model is defined
        if (!Project) {
            throw new Error('Project model is not defined');
        }
        console.log('Project model is defined');

        // Fetch all projects
        console.log('Fetching projects...');
        const projects = await Project.find({})
            .populate('createdBy', 'name profilePicture')
            .sort({ createdAt: -1 });
        console.log('Projects fetched:', projects.length);

        // Total count
        console.log('Counting projects...');
        const totalCount = await Project.countDocuments({});
        console.log('Total count:', totalCount);

        res.status(200).json({
            success: true,
            projects,
            totalCount
        });
    } catch (error) {
        console.error('Error fetching projects:', error.message, error.stack);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération du projet'
        });
    }
};
