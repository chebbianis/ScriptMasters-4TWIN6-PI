import mongoose from 'mongoose';

const DB_URI = "mongodb://localhost:27017/ScriptMasters";

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

    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

export const database = mongoose.connection;