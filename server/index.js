import express from 'express';
import { initializeDatabase } from './src/config/database.js';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'
// Importation des fichiers de routes
import userRoutes from './src/routes/user.routes.js';
import workspaceRoutes from './src/routes/workspace.routes.js';
import projectRoutes from './src/routes/project.routes.js';
import taskRoutes from './src/routes/task.routes.js';
import authRoutes from './src/routes/authRoutes.js';
import passport from './src/config/passport.js';
import session from 'express-session';

// Configuration des paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chargement des variables d'environnement
dotenv.config();

// Vérification des variables obligatoires
const requiredEnvVars = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
];

// Log des variables d'environnement pour le débogage
console.log('Environment variables loaded:', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing'
});

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

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

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

// Routes principales
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

// Utilisation des fichiers de routes modulaires
// Les préfixes définissent la base de l'URL pour chaque ensemble de routes
router.use('/user', userRoutes);
router.use('/workspace', workspaceRoutes);
router.use('/project', projectRoutes);
router.use('/task', taskRoutes);

// Mount auth routes directly on the app to avoid double prefixing
app.use('/api/auth', authRoutes);

// Middleware d'authentification 
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

// Ajouter le routeur à l'application
app.use(router);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`API disponible sur http://localhost:${PORT}/api`);
});

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});


