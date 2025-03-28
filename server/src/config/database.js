import mongoose from 'mongoose';
import { User } from '../models/user.model.js';

const DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ScriptMasters";

export const initializeDatabase = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log("✅ Connected to MongoDB");

        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            console.log('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });

        await createDefaultAdmin();

    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

async function createDefaultAdmin() {
    try {
        const adminEmail = "admin@esprit.tn";

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            console.log('🔧 Création de l\'utilisateur admin par défaut...');

            const adminUser = new User({
                name: 'Administrateur',
                email: adminEmail,
                password: 'admin',
                role: 'ADMIN',
                isActive: true,
                profilePicture: '',
                lastLogin: new Date()
            });

            await adminUser.save();
            console.log('✅ Utilisateur admin par défaut créé avec succès');
        } else {
            console.log('ℹ️ L\'utilisateur admin par défaut existe déjà');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin par défaut:', error);
    }
}

export const database = mongoose.connection;