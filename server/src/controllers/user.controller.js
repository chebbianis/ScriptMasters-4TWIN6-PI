import { User } from '../models/user.model.js';

export const createUser = async (req, res) => {
    try {
        const { name, email, password, WorkspaceId } = req.body;

        const newUser = await User.create({
            name,
            email,
            password,
            WorkspaceId
        });

        // Retourne l'utilisateur sans le mot de passe
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Mise à jour de la dernière connexion
        user.lastLogin = Date.now();
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};