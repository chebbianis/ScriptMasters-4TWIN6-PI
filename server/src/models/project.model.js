import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ProjectSchema = new Schema(
  {
    workspaceId: {
      type: String,
      required: [true, "Le workspaceId est obligatoire"],
    },
    name: {
      type: String,
      required: [true, "Le nom du projet est obligatoire"],
    },
    description: {
      type: String,
    },

    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    projectManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Le chef de projet est obligatoire"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assure-toi que ce nom correspond au modèle User
    },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model("Project", ProjectSchema);
export default Project;
