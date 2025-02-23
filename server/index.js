import express from 'express';
import { initializeDatabase } from './src/config/database.js';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRouter from './src/routes/authRoutes.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'
import { loginUser, createUser, logoutUser } from './src/controllers/user.controller.js';

// Configuration des paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chargement des variables d'environnement
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ Fichier .env introuvable !');
    process.exit(1);
}
dotenv.config({ path: envPath });

// Vérification des variables obligatoires
const requiredEnvVars = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Variable manquante dans .env : ${varName}`);
        process.exit(1);
    }
});

const app = express();
const port = 3000;

// Configuration de base

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// Initialisation de la base de données
initializeDatabase().then(() => {
    console.log("Database initialization complete");
});

// Configuration WebSocket
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Routes
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.get("/test", (req, res) => {
    res.json({
        message: "API connectée avec succès",
        timestamp: new Date().toISOString()
    });
});

//http://localhost:3000/login
// {
//     "email": "anis@esprit.tn",
//     "password":"anis"
// }
router.post('/login', loginUser);

router.post('/logout', logoutUser);

router.post('/register', createUser);


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token non fourni' });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ error: 'Token expiré' });
            }
            return res.status(403).json({ error: 'Token invalide' });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };

        next();
    });
}
// POST /api/auth/register
app.use(router);

// Démarrage du serveur
httpServer.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
});

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});


