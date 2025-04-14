import mongoose from 'mongoose';

// Définir des constantes pour les valeurs enum
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

// Fonction pour générer un code de tâche unique
async function generateTaskCode(projectId) {
    const count = await mongoose.model('Task').countDocuments({ project: projectId });
    return `TSK-${(count + 1).toString().padStart(3, '0')}`;
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'identifiant du créateur est requis']
    }
}, { timestamps: true });

// Middleware pour générer automatiquement le taskCode
taskSchema.pre('save', async function (next) {
    if (!this.taskCode) {
        this.taskCode = await generateTaskCode(this.project);
    }
    next();
});

// Ajouter des index pour accélérer les recherches
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task; 