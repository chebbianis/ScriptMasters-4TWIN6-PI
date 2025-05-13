// Définition des types de ressources pour les attachements
export const ResourceType = {
    FILE: 'FILE',
    GOOGLE_DRIVE: 'GOOGLE_DRIVE',
    DROPBOX: 'DROPBOX',
    EXTERNAL_LINK: 'EXTERNAL_LINK'
};

// Schéma pour les attachements
import mongoose from 'mongoose';

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

export { attachmentSchema }; 