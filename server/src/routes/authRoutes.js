import express from 'express';
import { createUser, loginUser } from '../controllers/user.controller.js';
import { User } from '../models/user.model.js';
import { refreshToken } from '../controllers/user.controller.js';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const router = express.Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/google/oauth/callback' }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Find user's workspace if available
      let workspaceId = null;
      if (user.WorkspaceId) {
        workspaceId = user.WorkspaceId;
      } else {
        // Try to find a workspace where the user is a member
        const workspace = await mongoose.model('Workspace').findOne({
          'members.userId': user._id
        });
        if (workspace) {
          workspaceId = workspace._id;
          // Update user's WorkspaceId
          user.WorkspaceId = workspaceId;
          await user.save();
        }
      }
      
      // Generate tokens with complete user information
      const accessToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          profilePicture: user.profilePicture,
          isActive: user.isActive,
          WorkspaceId: workspaceId
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      );
      
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Redirect to frontend with tokens
      res.redirect(`http://localhost:5173/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('http://localhost:5173/auth/error');
    }
  }
);

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

router.post('/refresh-token', refreshToken);

export default router;