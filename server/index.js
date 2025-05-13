import express from "express";
import { initializeDatabase } from "./src/config/database.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
// Importation des fichiers de routes
import userRoutes from "./src/routes/user.routes.js";
import workspaceRoutes from "./src/routes/workspace.routes.js";
import projectRoutes from "./src/routes/project.routes.js";
import taskRoutes from "./src/routes/task.routes.js";
import authRoutes from "./src/routes/authRoutes.js";
import passport from "./src/config/passport.js";
import notificationRoutes from "./src/routes/notificationroutes.js";
import predictRoutes from "./src/routes/predict.routes.js";
import session from "express-session";
import { initializeDeveloperSkills } from './src/controllers/user.controller.js';
import { initializeModelFiles } from './src/ml/initialize_model.js';

// Configuration des paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chargement des variables d'environnement
dotenv.config();

// Définition du port
const port = process.env.PORT || 3000;

// Vérification des variables obligatoires
const requiredEnvVars = [
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

// Log des variables d'environnement pour le débogage
console.log("Environment variables loaded:", {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Present" : "Missing",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
    ? "Present"
    : "Missing",
});

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Variable manquante dans .env : ${varName}`);
    process.exit(1);
  }
});

const app = express();

// Configuration de base
app.use(express.json());
app.use(express.static("public"));

// Serve uploaded files
const uploadsPath = path.join(__dirname, "uploads");
// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));
console.log("Serving uploads from:", uploadsPath);

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Création du serveur HTTP
const httpServer = http.createServer(app);

// Configuration WebSocket
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Connexion Socket.IO
io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.IO:', socket.id);

  socket.on('disconnect', () => {
    console.log('Connexion fermée:', socket.id);
  });
});

// Routes principales
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.get("/test", (req, res) => {
  res.json({
    message: "API connectée avec succès",
    timestamp: new Date().toISOString(),
  });
});

// Utilisation des fichiers de routes modulaires
// Les préfixes définissent la base de l'URL pour chaque ensemble de routes
router.use("/user", userRoutes);
router.use("/workspace", workspaceRoutes);
router.use("/project", projectRoutes);
router.use("/api/task", taskRoutes);
router.use("/task", taskRoutes);
router.use("/notifications", notificationRoutes);
router.use("/predict", predictRoutes);

// Mount auth routes directly on the app to avoid double prefixing
app.use("/api/auth", authRoutes);

// Middleware d'authentification
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token non fourni" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ error: "Token expiré" });
      }
      return res.status(403).json({ error: "Token invalide" });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  });
}

// Ajouter le routeur à l'application
app.use(router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// Gestion des erreurs globales
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Initialisation de la base de données
const startServer = async () => {
  try {
    await initializeDatabase();
    await initializeDeveloperSkills();
    await initializeModelFiles();

    // Démarrer le serveur HTTP (qui inclut Express et Socket.IO)
    httpServer.listen(port, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
      console.log(`API disponible sur http://localhost:${port}/api`);
      console.log(`Socket.IO disponible sur ws://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
