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
import notificationRoutes from "./src/routes/notificationroutes.js";

// Configuration des paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chargement des variables d'environnement
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ Fichier .env introuvable !");
  process.exit(1);
}
dotenv.config({ path: envPath });

// Vérification des variables obligatoires
const requiredEnvVars = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Variable manquante dans .env : ${varName}`);
    process.exit(1);
  }
});

const app = express();
const port = 3000;

// Configuration de base
app.use(express.json());
app.use(express.static("public"));
app.use(cors());

// Initialisation de la base de données
initializeDatabase().then(() => {
  console.log("Database initialization complete");
});

// Création du serveur HTTP
const httpServer = http.createServer(app);

// Configuration de Socket.IO (une seule instance)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Stocker l'instance de Socket.IO globalement
global.io = io;

// Lorsqu'un client se connecte, il rejoint une room correspondant à son userId
io.on("connection", (socket) => {
  console.log("Nouvelle connexion", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} a rejoint la room ${userId}`);
  });

  // Ajouter une gestion d'erreur
  socket.on("error", (error) => {
    console.error("Erreur Socket.IO:", error);
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

// Utilisation des routes modulaires
router.use("/user", userRoutes);
router.use("/workspace", workspaceRoutes);
router.use("/project", projectRoutes);
router.use("/task", taskRoutes);
router.use("/notifications", notificationRoutes);

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

app.use(router);

// Démarrage du serveur
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Serveur démarré sur http://0.0.0.0:${port}`);
});

// Gestion des erreurs globales
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
