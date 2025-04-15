import express from 'express';
import {
    createTask, getAllTasks, getTaskById, bottleneck,
    updateTask, deleteTask, getRecentTasks,
    getAllWorkspaces,
    reminder,
    clearReminder,
    addAttachment,
    removeAttachment,
    getTaskAttachments
} from '../controllers/task.controller.js';
import { getProjects } from '../controllers/project.controller.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { default as multerDefault } from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        // Get correct extension based on MIME type
        let ext = '';
        switch (file.mimetype) {
            case 'image/jpeg':
                ext = '.jpg';
                break;
            case 'image/png':
                ext = '.png';
                break;
            case 'image/gif':
                ext = '.gif';
                break;
            case 'image/webp':
                ext = '.webp';
                break;
            default:
                ext = path.extname(file.originalname).toLowerCase();
        }
        const fileName = `${timestamp}${ext}`;
        cb(null, fileName);
    }
});

// File filter to accept only certain file types
const fileFilter = (req, file, cb) => {
    console.log('Processing file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });
    
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        console.log('Rejected file type:', file.mimetype);
        cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
};

const upload = multerDefault({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    console.error('File upload error:', err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size exceeds 5MB limit'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next();
};

// Routes pour les tâches
router.post('/create', createTask);
router.get('/all', getAllTasks);
router.get('/reminder', reminder);
router.delete('/:taskId/reminder', clearReminder);
router.get('/allworkspaces', getAllWorkspaces);
router.get('/recent', getRecentTasks);
router.get('/all-projects', getProjects);

// Routes pour les attachements
router.post('/:taskId/attachments/file', upload.single('file'), handleMulterError, addAttachment);
router.post('/:taskId/attachments/link', addAttachment);
router.get('/:taskId/attachments', getTaskAttachments);
router.delete('/:taskId/attachments/:attachmentId', removeAttachment);

// Routes existantes
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);
router.get('/:workspaceId/bottlenecks', bottleneck);

export default router;