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

// Ensure the enum values are properly exported
export const TaskPriorityEnum = Object.values(TaskPriority);

// Définir les types de ressources
export const ResourceType = {
    FILE: 'FILE',
    GOOGLE_DRIVE: 'GOOGLE_DRIVE',
    DROPBOX: 'DROPBOX',
    EXTERNAL_LINK: 'EXTERNAL_LINK'
};

// Fonction pour générer un code de tâche unique
async function generateTaskCode(projectId) {
    const count = await mongoose.model('Task').countDocuments({ project: projectId });
    return `TSK-${(count + 1).toString().padStart(3, '0')}`;
}

// Schéma pour les attachements
const attachmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(ResourceType),
        required: true
    },
    url: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        default: 0 // Taille en bytes pour les fichiers
    },
    mimeType: String,
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema({
    taskCode: {
        type: String
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
    },
    attachments: [attachmentSchema] // Ajout du champ attachements
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
taskSchema.index({ project: 1, taskCode: 1 }, { unique: true });

const Task = mongoose.model('Task', taskSchema);

export default Task; 