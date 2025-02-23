import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';



export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const newUser = await User.create({
            name,
            email,
            password,
            WorkspaceId: null
        });

        const userResponse = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            WorkspaceId: null
        };

        res.status(201).json(userResponse);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Debug: Vérification des entrées
        console.log('Login attempt for:', email);

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Debug: Vérification du mot de passe
        console.log('Stored hash:', user.password?.slice(0, 10) + '...');

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Génération des tokens
        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        // Debug: Vérification des tokens
        console.log('Generated accessToken:', accessToken?.slice(0, 20) + '...');
        console.log('Generated refreshToken:', refreshToken?.slice(0, 20) + '...');

        // Mise à jour utilisateur
        user.lastLogin = Date.now();
        user.refreshToken = refreshToken;
        await user.save();

        // Construction réponse
        const responseData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            WorkspaceId: user.WorkspaceId,
            accessToken,
            refreshToken
        };

        console.log('Sending response:', JSON.stringify(responseData, null, 2));
        res.json(responseData);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ error: 'Refresh token requis' });

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ error: 'Refresh token invalide' });
        }

        // Générer un nouveau access token
        const newAccessToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken: newAccessToken });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const logoutUser = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email requis pour la déconnexion' });
        }

        // Trouver l'utilisateur avec cet email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Effacer le refresh token de l'utilisateur
        user.refreshToken = null;
        await user.save();

        console.log(`Utilisateur déconnecté: ${user.email}`);

        res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        res.status(500).json({ error: error.message });
    }
};


// export const logoutUser = async (req, res) => {
//     try {
//         const { refreshToken } = req.body;
//         if (!refreshToken) {
//             return res.status(400).json({ error: 'Token de rafraîchissement requis' });
//         }

//         // Trouver l'utilisateur avec ce refresh token
//         const user = await User.findOne({ refreshToken });
//         if (!user) {
//             return res.status(404).json({ error: 'Utilisateur non trouvé' });
//         }

//         // Effacer le refresh token de l'utilisateur
//         user.refreshToken = null;
//         await user.save();

//         console.log(`Utilisateur déconnecté: ${user.email}`);

//         res.status(200).json({ message: 'Déconnexion réussie' });
//     } catch (error) {
//         console.error('Erreur de déconnexion:', error);
//         res.status(500).json({ error: error.message });
//     }
// };

