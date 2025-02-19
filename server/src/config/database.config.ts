import mongoose from "mongoose";
import { config } from "./app.config";

const DB_URI = "mongodb://localhost:27017/ScriptMasters";

const connectDatabase = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

export default connectDatabase;
