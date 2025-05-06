import Task from '../models/task.model.js';
import Project from '../models/project.model.js';
import mongoose from 'mongoose';
import { Workspace } from '../models/workspace.model.js';
import { ResourceType } from '../models/resourceType.model.js';


export const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }
        if (!projectId) {
            return res.status(400).json({ success: false, error: 'Project ID is required' });
        }

        // Verify project exists
        const projectExists = await mongoose.model('Project').findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Verify assignedTo exists if provided
        if (assignedTo) {
            const userExists = await mongoose.model('User').findById(assignedTo);
            if (!userExists) {
                return res.status(404).json({ success: false, error: 'Assigned user not found' });
            }
        }

        // Generate unique task code with a loop
        const Task = mongoose.model('Task');
        let taskCode;
        let nextNumber = 1; // Start with 1 if no tasks exist

        while (!taskCode) {
            // Find the highest existing task code for this project
            const lastTask = await Task.findOne({ project: projectId })
                .sort({ taskCode: -1 }) // Sort descending by taskCode
                .select('taskCode');

            if (lastTask && lastTask.taskCode) {
                const lastNumber = parseInt(lastTask.taskCode.replace('TSK-', ''), 10);
                nextNumber = lastNumber + 1; // Increment the highest found number
            }

            const proposedCode = `TSK-${nextNumber.toString().padStart(3, '0')}`;
            const exists = await Task.exists({ taskCode: proposedCode });

            if (!exists) {
                taskCode = proposedCode; // Found a unique code, exit the loop
            } else {
                nextNumber++; // Increment and keep looping if the code exists
            }
        }

        // Create task with the generated taskCode
        const task = await Task.create({
            taskCode,
            title,
            description: description || '',
            status: status || Task.TaskStatus.TODO,
            priority: priority || Task.TaskPriority.MEDIUM,
            dueDate: dueDate ? new Date(dueDate) : null,
            project: projectId,
            assignedTo: assignedTo || null,
            createdBy: req.body.createdBy
        });

        // Populate references
        await task.populate([
            { path: 'project', select: 'name emoji' },
            { path: 'assignedTo', select: 'name profilePicture' }
        ]);

        res.status(201).json({
            success: true,
            task
        });
        
    } catch (error) {
        console.error('Task creation error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                error: 'Validation failed',
                details: error.errors 
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                error: 'Duplicate task code detected' 
            });
        }
        res.status(500).json({ 
            success: false,
            error: 'Failed to create task',
            details: error.message
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

        // First, get the current task to preserve attachments
        const currentTask = await Task.findById(taskId);
        if (!currentTask) {
            return res.status(404).json({
                success: false,
                error: 'Tâche non trouvée'
            });
        }

        // Update the task while preserving attachments
        const task = await Task.findByIdAndUpdate(
            taskId,
            {
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedTo: assignedTo || null,
                attachments: currentTask.attachments // Preserve attachments
            },
            { new: true, runValidators: true }
        ).populate('project', 'name emoji')
            .populate('assignedTo', 'name profilePicture')
            .populate('attachments.addedBy', 'name profilePicture');

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

}

////metier 1 
export const bottleneck = async (req, res) => {
    try {
        // 1. Get all projects in the workspace
        const projects = await Project.find({ 
            workspaceId: req.params.workspaceId 
        }).lean();

        if (!projects.length) {
            return res.json({
                workspaceId: req.params.workspaceId,
                totalTasks: 0,
                totalHighPriority: 0,
                projects: []
            });
        }

        // 2. Get all tasks for these projects
        const tasks = await Task.find({
            project: { $in: projects.map(p => p._id) }
        }).lean();

        // 3. Calculate workspace totals
        const totalTasks = tasks.length;
        const totalHighPriority = tasks.filter(t => t.priority === 'HIGH').length;

        // 4. Analyze each project
        const analysis = projects.map(project => {
            const projectTasks = tasks.filter(t => 
                t.project && t.project.toString() === project._id.toString()
            );
            
            const highPriorityTasks = projectTasks.filter(t => t.priority === 'HIGH').length;
            const inProgressTasks = projectTasks.filter(t => t.status === 'IN_PROGRESS');
            const doneTasks = projectTasks.filter(t => t.status === 'DONE').length;

            // New metrics as percentages
            const priorityPressure = parseFloat((
                (highPriorityTasks / Math.max(1, projectTasks.length)) * 100
            ).toFixed(2));

            const progressMomentum = parseFloat((
                ((inProgressTasks.length + doneTasks) / Math.max(1, projectTasks.length)) * 100
            ).toFixed(2));

            const activity = parseFloat((
                (doneTasks / Math.max(1, (projectTasks.length - doneTasks))) * 100
            ).toFixed(2));

            return {
                projectId: project._id,
                name: project.name,
                emoji: project.emoji,
                metrics: { 
                    priorityPressure: isNaN(priorityPressure) ? "0.00%" : priorityPressure + "%",
                    progressMomentum: isNaN(progressMomentum) ? "0.00%" : progressMomentum + "%",
                    activity: isNaN(activity) ? "0.00%" : activity + "%"
                },
                counts: {
                    total: projectTasks.length,
                    highPriority: highPriorityTasks,
                    inProgress: inProgressTasks.length,
                    done: doneTasks
                }
            };
        });

        res.json({
            workspaceId: req.params.workspaceId,
            totalTasks,
            totalHighPriority,
            projects: analysis
        });

    } catch (err) {
        console.error('Bottleneck analysis error:', err);
        res.status(500).json({ 
            message: 'Failed to analyze bottlenecks',
            error: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }

}


/////////////////get all workspaces for metier 1 

export const getAllWorkspaces = async (req, res) => {
    try {
      console.log('Attempting to fetch all workspaces...'); // Debug log
      
      const workspaces = await Workspace.find({})
        .select('_id name description owner inviteCode members createdAt updatedAt')
        .lean(); // Convert to plain JS objects
  
      if (!workspaces || workspaces.length === 0) {
        console.warn('No workspaces found in database');
        return res.status(404).json({
          success: false,
          error: 'No workspaces found',
          count: 0
        });
      }
  
      console.log(`Successfully fetched ${workspaces.length} workspaces`);
      
      res.status(200).json({
        success: true,
        message: 'All workspaces retrieved successfully',
        count: workspaces.length,
        workspaces
      });
  
    } catch (error) {
      console.error('Database error:', error.message);
      console.error('Full error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workspaces',
        systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

}
/////////////////metier 2 
export const reminder = async (req, res) => {
    try {
        const {
            workspaceId, projectId, keyword, status, priority, assignedTo,
            pageNumber = 1, pageSize = 10, daysThreshold = 2
        } = req.query;

        const skip = (parseInt(pageNumber) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);

        // Build the base query
        const query = {};

        // Filter by project if specified
        if (projectId) {
            query.project = projectId;
        } else if (workspaceId) {
            // If no project specified but workspace is, find all projects in this workspace
            const projects = await Project.find({ workspaceId }).select('_id');
            query.project = { $in: projects.map(p => p._id) };
        }

        // Filter by keyword
        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { taskCode: { $regex: keyword, $options: 'i' } }
            ];
        }

        // Filter by status
        if (status) {
            query.status = { $in: status.split(',') };
        }

        // Filter by priority
        if (priority) {
            query.priority = { $in: priority.split(',') };
        }

        // Filter by assignedTo
        if (assignedTo) {
            query.assignedTo = { $in: assignedTo.split(',') };
        }

        // Get current date (start of day for comparison)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get tasks with additional fields for date comparison
        const tasks = await Task.find(query)
            .populate('project', 'name emoji')
            .populate('assignedTo', 'name profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Add reminder flag and filter to keep only tasks with reminder = 1
        const tasksWithReminder = tasks
            .map(task => {
                const taskObj = task.toObject();
                
                if (taskObj.dueDate) {
                    const dueDate = new Date(taskObj.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    
                    // Calculate difference in days
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    // Set reminder = 1 only if due today or in the next X days (not overdue)
                    taskObj.reminder = (diffDays >= 0 && diffDays <= parseInt(daysThreshold)) ? 1 : 0;
                    return taskObj;
                } else {
                    taskObj.reminder = 0;
                    return taskObj;
                }
            })
            .filter(task => task.reminder === 1); // Only keep tasks with reminder = 1

        // Count total number of tasks (only those with reminder = 1)
        const totalCount = tasksWithReminder.length;

        res.status(200).json({
            success: true,
            tasks: tasksWithReminder,
            pagination: {
                totalCount,
                pageNumber: parseInt(pageNumber),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(totalCount / parseInt(pageSize))
            }
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching tasks'
        });
    }
};

export const clearReminder = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        // Vérifier si la tâche existe
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Tâche non trouvée'
            });
        }

        // Mettre à jour la date d'échéance pour supprimer le rappel
        // En ajoutant suffisamment de jours pour que le rappel ne soit plus actif
        const newDueDate = new Date(task.dueDate);
        newDueDate.setDate(newDueDate.getDate() + 3); // Ajoute 3 jours à la date d'échéance

        task.dueDate = newDueDate;
        await task.save();

        res.status(200).json({
            success: true,
            message: 'Rappel supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du rappel:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression du rappel'
        });
    }
};

// Ajouter un attachement à une tâche
export const addAttachment = async (req, res) => {
    try {
        console.log('Received attachment request:', {
            taskId: req.params.taskId,
            file: req.file,
            body: req.body,
            headers: req.headers
        });

        const { taskId } = req.params;
        const { type, name, url } = req.body;
        const addedBy = req.body.userId;

        // Si c'est un fichier uploadé
        if (req.file) {
            console.log('Processing file upload:', {
                originalname: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype,
                path: req.file.path
            });

            const attachment = {
                name: req.file.originalname,
                type: 'FILE',
                url: `/uploads/${req.file.filename}`,
                size: req.file.size,
                mimeType: req.file.mimetype || 'application/octet-stream',
                addedBy,
                addedAt: new Date()
            };

            console.log('Created attachment object:', attachment);

            // First, find the task to ensure it exists
            const task = await Task.findById(taskId);
            if (!task) {
                console.error('Task not found:', taskId);
                return res.status(404).json({
                    success: false,
                    error: 'Tâche non trouvée'
                });
            }

            console.log('Found task:', {
                _id: task._id,
                title: task.title,
                currentAttachments: task.attachments
            });

            // Initialize attachments array if it doesn't exist
            if (!task.attachments) {
                task.attachments = [];
            }

            // Add the attachment to the task
            task.attachments.push(attachment);
            const savedTask = await task.save();

            console.log('Saved task with new attachment:', {
                _id: savedTask._id,
                attachments: savedTask.attachments
            });

            // Populate the addedBy field
            await task.populate('attachments.addedBy', 'name profilePicture');

            console.log('Successfully added attachment to task:', task._id);
            return res.status(200).json({
                success: true,
                message: 'Fichier ajouté avec succès',
                attachment: task.attachments[task.attachments.length - 1]
            });
        }

        // Si c'est un lien externe
        const attachment = {
            name,
            type,
            url,
            addedBy,
            addedAt: new Date()
        };

        // First, find the task to ensure it exists
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Tâche non trouvée'
            });
        }

        // Initialize attachments array if it doesn't exist
        if (!task.attachments) {
            task.attachments = [];
        }

        // Add the attachment to the task
        task.attachments.push(attachment);
        await task.save();

        // Populate the addedBy field
        await task.populate('attachments.addedBy', 'name profilePicture');

        res.status(200).json({
            success: true,
            message: 'Lien ajouté avec succès',
            attachment: task.attachments[task.attachments.length - 1]
        });

    } catch (error) {
        console.error('Error in addAttachment:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'ajout de l\'attachement'
        });
    }
};

// Supprimer un attachement
export const removeAttachment = async (req, res) => {
    try {
        const { taskId, attachmentId } = req.params;

        const task = await Task.findByIdAndUpdate(
            taskId,
            { $pull: { attachments: { _id: attachmentId } } },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Tâche non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Attachement supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'attachement:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression de l\'attachement'
        });
    }
};

// Récupérer tous les attachements d'une tâche
export const getTaskAttachments = async (req, res) => {
    try {
        const { taskId } = req.params;
        console.log('Fetching attachments for task:', taskId);

        const task = await Task.findById(taskId)
            .populate('attachments.addedBy', 'name profilePicture');

        if (!task) {
            console.error('Task not found:', taskId);
            return res.status(404).json({
                success: false,
                error: 'Tâche non trouvée'
            });
        }

        console.log('Found attachments:', task.attachments);
        res.status(200).json({
            success: true,
            attachments: task.attachments
        });

    } catch (error) {
        console.error('Error in getTaskAttachments:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des attachements'
        });
    }
};