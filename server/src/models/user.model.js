import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
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
    faceImagePath: {
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
    },
    // New fields for recommendation system
    skills: [{
        type: String,
        default: []
    }],
    experience: {
        type: Number,
        default: 0,
        min: 0
    },
    performanceRating: {
        type: Number,
        default: 3.0,
        min: 0,
        max: 5
    },
    currentWorkload: {
        type: Number,
        default: 0,
        min: 0,
        max: 40
    },
    googleId: {
        type: String,
        sparse: true
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
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

// Method to generate access token
UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );
};

// Method to generate refresh token
UserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};

export const User = mongoose.model('User', UserSchema);