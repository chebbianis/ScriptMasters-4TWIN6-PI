import mongoose from "mongoose";
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userId: { type: String, required: true },
  projectId: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }, // Nouveau champ
  createdAt: { type: Date, default: Date.now },
});
export const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
