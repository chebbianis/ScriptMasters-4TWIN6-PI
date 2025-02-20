import express from 'express';
import { createUser, loginUser } from '../controllers/user.controller.js';
import { User } from '../models/user.model.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, } = req.body;

        // Validation basique
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            role: 'DEVELOPER' // Valeur par défaut
        });

        // Ne pas retourner le mot de passe
        const userResponse = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            profilePicture: newUser.profilePicture
        };

        res.status(201).json(userResponse);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Mise à jour de la dernière connexion
        user.lastLogin = new Date();
        await user.save();

        // Création de la réponse
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            WorkspaceId: user.WorkspaceId,
            profilePicture: user.profilePicture,
            lastLogin: user.lastLogin
        };

        res.json(userResponse);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;