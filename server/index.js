import express from 'express';
import { initializeDatabase } from './src/config/database.js';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRouter from './src/routes/authRoutes.js';


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

// POST /api/auth/register
// POST /api/auth/login
app.use('/api/auth', authRouter);


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