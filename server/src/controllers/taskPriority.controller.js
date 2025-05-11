import Task from '../models/task.model.js';
import { spawn } from 'child_process';

export const predictTaskPriority = async (req, res) => {
    try {
        console.log('Received task priority prediction request:', req.body);
        const {
            descriptionLength,
            hasDueDate,
            daysUntilDue,
            assignedToWorkload,
            projectProgress,
            taskDependencies,
            Category = 'General',
            Action = 'Update',
            Priority = 'MEDIUM',
            EstimatedTime = 60,
            ActualTime = 0,
            CompletionPercentage = 0,
            TimeSpent = 0,
            Status = 'TODO'
        } = req.body;

        // Prepare input for Python script
        const pyInput = {
            Category,
            Action,
            Priority,
            EstimatedTime,
            ActualTime,
            CompletionPercentage,
            TimeSpent,
            Status
        };

        // Call Python script for ML prediction
        const py = spawn('python3', ['server/src/ml/predict.py']);
        let pyData = '';
        let pyErr = '';
        py.stdin.write(JSON.stringify(pyInput));
        py.stdin.end();
        py.stdout.on('data', (data) => {
            pyData += data.toString();
        });
        py.stderr.on('data', (data) => {
            pyErr += data.toString();
        });
        py.on('close', (code) => {
            if (code === 0 && pyData) {
                try {
                    const result = JSON.parse(pyData);
                    res.json({
                        priority: result.prediction,
                        confidence: result.confidence,
                        status: 'success',
                        source: 'ml-model'
                    });
                } catch (e) {
                    // Fallback to rule-based if JSON parse fails
                    fallbackRuleBased();
                }
            } else {
                // Fallback to rule-based if Python fails
                fallbackRuleBased();
            }
        });

        function fallbackRuleBased() {
            // Simple rule-based priority prediction
            let priority = 'MEDIUM';
            let confidence = 0.5;
            if (hasDueDate) {
                if (daysUntilDue <= 2) {
                    priority = 'HIGH';
                    confidence = 0.8;
                } else if (daysUntilDue <= 7) {
                    priority = 'MEDIUM';
                    confidence = 0.6;
                }
            }
            if (descriptionLength > 200) {
                priority = 'HIGH';
                confidence = Math.max(confidence, 0.7);
            }
            if (taskDependencies > 2) {
                priority = 'HIGH';
                confidence = Math.max(confidence, 0.75);
            }
            if (projectProgress > 0.8) {
                priority = 'HIGH';
                confidence = Math.max(confidence, 0.7);
            }
            if (assignedToWorkload > 3) {
                priority = 'LOW';
                confidence = Math.max(confidence, 0.65);
            }
            res.json({
                priority,
                confidence,
                status: 'success',
                source: 'rule-based',
                error: pyErr || 'Fallback: Error occurred, returning default priority.'
            });
        }
    } catch (error) {
        console.error('Error predicting task priority:', error);
        res.json({
            priority: 'MEDIUM',
            confidence: 0.5,
            status: 'success',
            error: 'Fallback: Error occurred, returning default priority.'
        });
    }
}; 