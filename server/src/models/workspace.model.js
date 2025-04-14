import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const WorkspaceSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    members: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'],
            default: 'DEVELOPER'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    inviteCode: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

export const Workspace = mongoose.model('Workspace', WorkspaceSchema);