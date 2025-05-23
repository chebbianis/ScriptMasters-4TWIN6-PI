import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ProjectSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      required: [true, "Le workspaceId est obligatoire"],
      ref: "Workspace"
    },
    name: {
      type: String,
      required: [true, "Le nom du projet est obligatoire"],
    },
    description: {
      type: String,
    },
    languages: [{
      type: String,
      required: [true, "Au moins un langage est requis"]
    }],
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
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model("Project", ProjectSchema);
export default Project;
