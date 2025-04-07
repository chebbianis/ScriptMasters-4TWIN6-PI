import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Le nom du projet est requis'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    emoji: {
        type: String,
        default: '📊'
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: [true, 'L\'identifiant de l\'espace de travail est requis']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'identifiant du créateur est requis']
    }
}, { timestamps: true });

// Ajouter un index pour accélérer les recherches
projectSchema.index({ workspaceId: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project; 