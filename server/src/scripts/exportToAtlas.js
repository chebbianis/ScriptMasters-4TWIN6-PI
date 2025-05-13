import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TaskPrediction } from '../models/taskPrediction.model.js';

dotenv.config();

const LOCAL_DB_URI = "mongodb://localhost:27017/ScriptMasters";
const ATLAS_DB_URI = process.env.MONGODB_ATLAS_URI; // You'll need to add this to your .env file

async function exportData() {
    try {
        // Connect to local database
        await mongoose.connect(LOCAL_DB_URI);
        console.log("Connected to local MongoDB");

        // Get all predictions
        const predictions = await TaskPrediction.find({});
        console.log(`Found ${predictions.length} predictions to export`);

        // Connect to Atlas
        await mongoose.disconnect();
        await mongoose.connect(ATLAS_DB_URI);
        console.log("Connected to MongoDB Atlas");

        // Export data
        for (const prediction of predictions) {
            const newPrediction = new TaskPrediction(prediction.toObject());
            await newPrediction.save();
        }

        console.log("Data export completed successfully");
    } catch (error) {
        console.error("Error during export:", error);
    } finally {
        await mongoose.disconnect();
    }
}

exportData(); 