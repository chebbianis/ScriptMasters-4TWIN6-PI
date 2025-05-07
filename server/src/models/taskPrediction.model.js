import mongoose from 'mongoose';

const taskPredictionSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    predictedPriority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        required: true
    },
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    features: {
        descriptionLength: Number,
        hasDueDate: Boolean,
        daysUntilDue: Number,
        assignedToWorkload: Number,
        projectProgress: Number,
        taskDependencies: Number
    },
    actualPriority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: null
    },
    isTrainingData: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
taskPredictionSchema.index({ taskId: 1 });
taskPredictionSchema.index({ isTrainingData: 1 });
taskPredictionSchema.index({ createdAt: 1 });

export const TaskPrediction = mongoose.model('TaskPrediction', taskPredictionSchema); 