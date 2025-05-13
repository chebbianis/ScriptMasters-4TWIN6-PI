import express from "express";
import {
  loginUser,
  createUser,
  logoutUser,
  getPendingUsers,
  activateUser,
  getUserStats,
  searchUsers,
  exportUsers,
  updateUserRole,
  searchUsersSimple,
  deleteUser,
  getAllUsers,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  updatePassword,
  updateProfile,
  registerFace,
  verifyFace,
} from "../controllers/user.controller.js";
import { User } from "../models/user.model.js";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/faces');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created faces upload directory:', uploadsDir);
}

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = '.jpg';
    const fileName = `face_${timestamp}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

const router = express.Router();

// Routes utilisateur
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/register", createUser);
router.get("/pending-user-list", getPendingUsers);
router.patch("/activate/:userId", activateUser);
router.get("/stats", getUserStats);
router.get("/search", searchUsers);
router.get("/search/simple", searchUsersSimple);
router.get("/export", exportUsers);
router.patch("/:userId/role", updateUserRole);
router.delete("/:userId", deleteUser);
router.get("/", getAllUsers);
router.get("/developers", async (req, res) => {
  try {
    const developers = await User.find({ role: "DEVELOPER" });
    return res.status(200).json({ developers });
  } catch (error) {
    console.error("Erreur lors de la récupération des développeurs :", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});
router.post("/updatePassword", updatePassword);
router.post("/updateProfile", updateProfile);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", verifyResetToken);
router.post("/reset-password/:token", resetPassword);

// Routes pour la reconnaissance faciale
router.post("/register-face", upload.single('faceImage'), registerFace);
router.post("/verify-face", upload.single('faceImage'), verifyFace);

export default router;
