import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import taskRoutes from './routes/task.routes.js';
import projectRoutes from './routes/project.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import userRoutes from './routes/user.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques depuis le dossier uploads
const uploadsPath = path.join(__dirname, '..', 'uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/task', taskRoutes);
app.use('/project', projectRoutes);
app.use('/workspace', workspaceRoutes);
app.use('/user', userRoutes);

export default app; 