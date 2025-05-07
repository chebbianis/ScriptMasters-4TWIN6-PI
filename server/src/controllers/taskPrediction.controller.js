import { TaskPrediction } from '../models/taskPrediction.model.js';
import Task from '../models/task.model.js';
import Project from '../models/project.model.js';

// Function to extract features from a task
const extractFeatures = async (task) => {
    const features = {
        descriptionLength: task.description ? task.description.length : 0,
        hasDueDate: !!task.dueDate,
        daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
        assignedToWorkload: 0,
        projectProgress: 0,
        taskDependencies: 0
    };

    // Calculate assigned user's workload
    if (task.assignedTo) {
        const userTasks = await Task.countDocuments({
            assignedTo: task.assignedTo,
            status: { $ne: 'DONE' }
        });
        features.assignedToWorkload = userTasks;
    }

    // Calculate project progress
    const project = await Project.findById(task.project);
    if (project) {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const completedTasks = await Task.countDocuments({
            project: project._id,
            status: 'DONE'
        });
        features.projectProgress = totalTasks > 0 ? completedTasks / totalTasks : 0;
    }

    return features;
};

// Predict task priority
export const predictTaskPriority = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Extract features
        const features = await extractFeatures(task);

        // TODO: Replace this with actual ML model prediction
        // This is a simple rule-based prediction for demonstration
        let predictedPriority = 'MEDIUM';
        let confidence = 0.7;

        if (features.daysUntilDue < 3 && features.daysUntilDue > 0) {
            predictedPriority = 'HIGH';
            confidence = 0.9;
        } else if (features.daysUntilDue > 7) {
            predictedPriority = 'LOW';
            confidence = 0.8;
        }

        // Create prediction record
        const prediction = new TaskPrediction({
            taskId: task._id,
            predictedPriority,
            confidence,
            features,
            isTrainingData: true
        });

        await prediction.save();

        res.status(200).json({
            success: true,
            prediction: {
                priority: predictedPriority,
                confidence,
                features
            }
        });
    } catch (error) {
        console.error('Error predicting task priority:', error);
        res.status(500).json({
            success: false,
            message: 'Error predicting task priority',
            error: error.message
        });
    }
};

// Get prediction history for a task
export const getTaskPredictionHistory = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        const predictions = await TaskPrediction.find({ taskId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            predictions
        });
    } catch (error) {
        console.error('Error fetching prediction history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching prediction history',
            error: error.message
        });
    }
};

// Update prediction with actual priority (for training)
export const updatePredictionWithActual = async (req, res) => {
    try {
        const { predictionId } = req.params;
        const { actualPriority } = req.body;

        const prediction = await TaskPrediction.findById(predictionId);
        if (!prediction) {
            return res.status(404).json({
                success: false,
                message: 'Prediction not found'
            });
        }

        prediction.actualPriority = actualPriority;
        prediction.isTrainingData = true;
        await prediction.save();

        res.status(200).json({
            success: true,
            prediction
        });
    } catch (error) {
        console.error('Error updating prediction:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating prediction',
            error: error.message
        });
    }
}; 