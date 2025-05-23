import { Project } from "../models/project.model.js";
import Task, { TaskStatus } from "../models/task.model.js";
import PDFDocument from "pdfkit";
// Créer un nouveau projet
export const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, users, projectManager, languages } = req.body;

    if (!projectManager) {
      return res
        .status(400)
        .json({ message: "Le chef de projet est obligatoire" });
    }

    // Vérifier que le champ languages est bien défini
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return res
        .status(400)
        .json({ message: "Au moins un langage de programmation est requis" });
    }

    const newProject = new Project({
      workspaceId,
      name,
      description,
      users,
      projectManager,
      languages,
    });

    console.log("Création d'un projet avec les langages:", languages);

    await newProject.save();

    res.status(201).json({
      message: "Projet créé avec succès",
      project: newProject,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la création du projet",
      error,
    });
  }
};

// Récupérer tous les projets d'un espace de travail
export const getProjectsInWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { pageSize = 10, pageNumber = 1 } = req.query;

    console.log(
      "getProjectsInWorkspace called with workspaceId:",
      workspaceId,
      "pageSize:",
      pageSize,
      "pageNumber:",
      pageNumber
    );

    const skip = (parseInt(pageNumber) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Log before querying
    console.log("Querying Project.find with:", { workspaceId });
    // const projects = await Project.find({ workspaceId })
    //   .populate("createdBy", "name profilePicture")
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(limit);
    // Remove population for now:
    const projects = await Project.find({ workspaceId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    console.log("Projects found:", projects.length);

    const totalCount = await Project.countDocuments({ workspaceId });
    console.log("Total project count:", totalCount);

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
    console.error("Error in getProjectsInWorkspace:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des projets",
      details: error.message,
    });
  }
};

// Récupérer un projet spécifique
// project.controller.js

// Mettre à jour un projet
export const updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.projectId,
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

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé",
      });
    }

    await Task.deleteMany({ project: projectId });

    res.status(200).json({
      success: true,
      message: "Projet et tâches associées supprimés avec succès",
    });
  } catch (error) {
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

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé",
      });
    }

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
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des statistiques",
    });
  }
};

// Récupérer uniquement les noms de projets
// Dans le contrôleur (project.controller.js)
export const getAllProjectNames = async (req, res) => {
  try {
    const projects = await Project.find({}, "name createdAt"); // Ajouter createdAt
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des projets",
      error,
    });
  }
};

// Récupérer tous les chefs de projet avec détails
export const getAllProjectManagers = async (req, res) => {
  try {
    // Retrieve only the distinct projectManager IDs
    const projectManagers = await Project.aggregate([
      {
        $group: { _id: "$projectManager" }, // Group by project manager
      },
      {
        $lookup: {
          from: "users", // Ensure this is the correct collection for users
          localField: "_id",
          foreignField: "_id",
          as: "managerDetails", // This will store the details of the project manager
        },
      },
      {
        $unwind: {
          path: "$managerDetails",
          preserveNullAndEmptyArrays: true, // If no details are found, it won't break
        },
      },
      {
        $project: {
          managerId: "$_id",
          name: "$managerDetails.name", // Assuming name field exists in users collection
          email: "$managerDetails.email", // Assuming email field exists
          profilePicture: "$managerDetails.profilePicture", // Assuming profilePicture field exists
        },
      },
    ]);

    // If no project managers are found
    if (!projectManagers || projectManagers.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Aucun chef de projet trouvé",
      });
    }

    res.status(200).json({
      success: true,
      projectManagers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des chefs de projet",
    });
  }
};
// Importation du modèle Project

// Recherche de projets par mot-clé (et optionnellement par workspaceId)
export const searchProjects = async (req, res) => {
  try {
    const { keyword, workspaceId } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Mot-clé manquant dans la requête",
      });
    }

    // Définir le filtre pour la recherche en utilisant une expression régulière (insensible à la casse)
    const filter = {
      name: { $regex: keyword, $options: "i" },
    };

    // Si workspaceId est fourni, ajouter ce critère au filtre
    if (workspaceId) {
      filter.workspaceId = workspaceId;
    }

    const projects = await Project.find(filter);

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche des projets :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche des projets",
      error,
    });
  }
};
// Récupérer les détails d'un projet
// Dans project.controller.js - getProjectById
// In getProjectById controller
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate("projectManager", "name email")
      .populate("users", "name")
      .select("+createdAt"); // Sélection explicite du champ createdAt

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      project: {
        ...project._doc,
        // Formatage optionnel de la date si nécessaire
        createdAt: project.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du projet :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du projet",
      error,
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    console.log("Starting getAllProjects...");

    // Check if Project model is defined
    if (!Project) {
      throw new Error("Project model is not defined");
    }
    console.log("Project model is defined");

    // Fetch all projects
    console.log("Fetching projects...");
    const projects = await Project.find({})
      .populate("createdBy", "name profilePicture")
      .sort({ createdAt: -1 });
    console.log("Projects fetched:", projects.length);

    // Total count
    console.log("Counting projects...");
    const totalCount = await Project.countDocuments({});
    console.log("Total count:", totalCount);

    res.status(200).json({
      success: true,
      projects,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching projects:", error.message, error.stack);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération du projet",
    });
  }
};
export const generateProjectPdf = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate("projectManager", "name")
      .populate("users", "name");
    const tasks = await Task.find({ project: projectId }).sort({
      createdAt: 1,
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    const doc = new PDFDocument({ margin: 50, size: "A4", font: "Helvetica" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="project-${projectId}.pdf"`
    );
    doc.pipe(res);

    // Header
    doc
      .fillColor("#2c3e50")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(project.name.toUpperCase(), 50, 50);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated on: ${new Date().toLocaleDateString("en-US")}`, 50, 80);

    // Main section
    let y = 120;
    const meta = { x1: 50, x2: 300, lineHeight: 20 };

    doc.font("Helvetica-Bold").text("Project Manager:", meta.x1, y);
    doc.font("Helvetica").text(project.projectManager.name, meta.x1 + 120, y);

    doc.font("Helvetica-Bold").text("Creation Date:", meta.x2, y);
    doc
      .font("Helvetica")
      .text(project.createdAt.toLocaleDateString("en-US"), meta.x2 + 120, y);

    y += meta.lineHeight * 2;

    doc.font("Helvetica-Bold").text("Description:", 50, y);
    y += 20;
    doc.font("Helvetica").text(project.description || "No description", {
      width: 500,
      indent: 10,
      align: "justify",
    });
    y = doc.y + 30;

    // Team Members
    if (project.users.length) {
      doc.font("Helvetica-Bold").fontSize(14).text("Team Members", 50, y);
      y += 30;
      project.users.forEach((u, i) => {
        doc
          .fillColor("#2c3e50")
          .circle(50, y + 5, 3)
          .fill();
        doc
          .font("Helvetica")
          .fillColor("#000")
          .text(`${i + 1}. ${u.name}`, 60, y);
        y += 25;
      });
      y += 20;
    }

    // Project Tasks
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#2c3e50")
      .text("Project Tasks", 50, y);
    y += 30;

    if (tasks.length) {
      // Column headers
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#2c3e50")
        .text("Task", 55, y)
        .text("Status", 250, y)
        .text("Priority", 350, y)
        .text("Due Date", 450, y);
      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke("#cccccc");
      y += 10;

      // Rows
      tasks.forEach((t) => {
        const statusColor =
          {
            Completed: "#27ae60",
            "In Progress": "#f1c40f",
            Pending: "#e74c3c",
          }[t.status] || "#95a5a6";
        const priorityColor =
          {
            High: "#e74c3c",
            Medium: "#f39c12",
            Low: "#2ecc71",
          }[t.priority] || "#95a5a6";

        // Task row
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#000")
          .text(t.title, 55, y, { width: 180 });
        doc.fillColor(statusColor).text(t.status, 250, y);
        doc.fillColor(priorityColor).text(t.priority || "-", 350, y);
        doc
          .fillColor("#000")
          .text(
            t.dueDate ? t.dueDate.toLocaleDateString("en-US") : "-",
            450,
            y
          );
        y += 20;

        // Description label and text
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#2c3e50")
          .text("Description:", 55, y);
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#555")
          .text(t.description || "No description", 120, y, { width: 385 });
        y = doc.y + 15;

        // Separator line between tasks
        doc.moveTo(50, y).lineTo(550, y).stroke("#eeeeee");
        y += 20;
      });
    } else {
      doc
        .font("Helvetica-Oblique")
        .fontSize(12)
        .fillColor("#666")
        .text("No tasks found", 50, y);
    }

    // Footer
    doc.on("pageAdded", () => {
      doc
        .fillColor("#666666")
        .fontSize(10)
        .text("Generated by Project Manager App", 50, doc.page.height - 50);
    });
    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
