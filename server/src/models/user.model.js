import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'L\'email est obligatoire'],
        unique: true,
        lowercase: true,
        trim: true
        // match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    password: {
        type: String,
        select: false
    },
    profilePicture: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: false,
        index: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String,
        select: false
    },
    WorkspaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace',
        required: false
    },
    role: {
        type: String,
        enum: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'],
        default: 'DEVELOPER'
    }

}, {
    timestamps: true
});

// Middleware pour le hashage du mot de passe
UserSchema.pre('save', async function (next) {
    try {
        if (this.isModified('password') && this.password) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', UserSchema);