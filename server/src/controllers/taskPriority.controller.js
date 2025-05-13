import Task from '../models/task.model.js';

export const predictTaskPriority = async (req, res) => {
    try {
        console.log('Received task priority prediction request:', req.body);
        const {
            descriptionLength,
            hasDueDate,
            daysUntilDue,
            assignedToWorkload,
            projectProgress,
            taskDependencies
        } = req.body;

        // Simple rule-based priority prediction
        let priority = 'MEDIUM';
        let confidence = 0.5;

        // Rule 1: Due date urgency
        if (hasDueDate) {
            if (daysUntilDue <= 2) {
                priority = 'HIGH';
                confidence = 0.8;
            } else if (daysUntilDue <= 7) {
                priority = 'MEDIUM';
                confidence = 0.6;
            }
        }

        // Rule 2: Description complexity
        if (descriptionLength > 200) {
            priority = 'HIGH';
            confidence = Math.max(confidence, 0.7);
        }

        // Rule 3: Task dependencies
        if (taskDependencies > 2) {
            priority = 'HIGH';
            confidence = Math.max(confidence, 0.75);
        }

        // Rule 4: Project progress
        if (projectProgress > 0.8) {
            priority = 'HIGH';
            confidence = Math.max(confidence, 0.7);
        }

        // Rule 5: Workload consideration
        if (assignedToWorkload > 3) {
            priority = 'LOW';
            confidence = Math.max(confidence, 0.65);
        }

        res.json({
            priority,
            confidence,
            status: 'success'
        });

    } catch (error) {
        console.error('Error predicting task priority:', error);
        // Always return a valid response, never status 500
        res.json({
            priority: 'MEDIUM',
            confidence: 0.5,
            status: 'success',
            error: 'Fallback: Error occurred, returning default priority.'
        });
    }
}; 