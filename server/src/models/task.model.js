import mongoose from 'mongoose';

export const TaskStatus = {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE'
};

export const TaskPriority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
};

async function generateTaskCode(projectId, retryCount = 0) {
    const maxRetries = 5; // Prevent infinite loops
    try {
        const count = await mongoose.model('Task').countDocuments({ project: projectId });
        const proposedCode = `TSK-${(count + 1 + retryCount).toString().padStart(3, '0')}`;

        // Check if the code already exists
        const exists = await mongoose.model('Task').exists({ taskCode: proposedCode });
        if (exists) {
            throw new Error("Duplicate task code"); // Force a retry
        }
        return proposedCode;
    } catch (error) {
        if (error.message === "Duplicate task code" && retryCount < maxRetries) {
            return generateTaskCode(projectId, retryCount + 1); // Retry with +1
        }
        throw error; // Re-throw if max retries reached or another error occurs
    }
}

const taskSchema = new mongoose.Schema({
    taskCode: {
        type: String,
        unique: true
    },
    title: {
        type: String,
        required: [true, 'Le titre de la tâche est requis'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: Object.values(TaskStatus),
        default: TaskStatus.TODO
    },
    priority: {
        type: String,
        enum: Object.values(TaskPriority),
        default: TaskPriority.MEDIUM
    },
    dueDate: {
        type: Date,
        default: null
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'L\'identifiant du projet est requis']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        default: null
    }
    // Removed createdBy completely
}, { timestamps: true });

taskSchema.pre('save', async function (next) {
    if (!this.taskCode) {
        this.taskCode = await generateTaskCode(this.project);
    }
    next();
});

taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ workspaceId: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;