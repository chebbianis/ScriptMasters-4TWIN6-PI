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

        // Mise à jour de lastLogin
        user.lastLogin = Date.now();

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
            isActive: user.isActive,
            lastLogin: user.lastLogin,
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

        // mise a jour de la connexion et refresh token de l'utilisateur
        user.refreshToken = null;

        await user.save();

        console.log(`Utilisateur déconnecté: ${user.email}`);

        res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        res.status(500).json({ error: error.message });
    }
};


export const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            isActive: false
        }).select([
            'name',
            'email',
            'role',
            'createdAt',
            'profilePicture'
        ]).sort({
            createdAt: -1  // Trier par date de création, plus récent en premier
        });

        // Formater la réponse
        const formattedUsers = pendingUsers.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            requestedRole: user.role,
            requestedAt: user.createdAt,
            avatar: user.profilePicture || null
        }));

        res.status(200).json({
            success: true,
            count: formattedUsers.length,
            data: formattedUsers
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs en attente:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des utilisateurs en attente'
        });
    }
};

export const activateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { approved } = req.body;

        if (approved) {
            // Activer l'utilisateur
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    isActive: true,
                    updatedAt: Date.now()
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Utilisateur activé avec succès',
                data: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role
                }
            });
        } else {
            // Supprimer l'utilisateur si la demande est rejetée
            await User.findByIdAndDelete(userId);

            res.status(200).json({
                success: true,
                message: 'Demande d\'utilisateur rejetée'
            });
        }

    } catch (error) {
        console.error('Erreur lors de l\'activation/rejet de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du traitement de la demande'
        });
    }
};

/**
 * Exemple de requête Postman pour tester l'activation d'un utilisateur:
 * 
 * Méthode: PATCH
 * URL: http://localhost:3000/users/activate/65a123b456c789d012e34f56
 * 
 * Body (JSON):
 * {
 *   "approved": true
 * }
 * 
 * Pour rejeter un utilisateur, utilisez la même URL mais avec:
 * {
 *   "approved": false
 * }
 */

export const getUserStats = async (req, res) => {
    try {
        // Récupérer le nombre total d'utilisateurs
        const totalUsers = await User.countDocuments();

        // Récupérer les utilisateurs actifs aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeToday = await User.countDocuments({
            lastLogin: { $gte: today }
        });

        // Statistiques par rôle
        const roleStats = {};
        const roles = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'];

        for (const role of roles) {
            const count = await User.countDocuments({ role });
            const active = await User.countDocuments({
                role,
                lastLogin: { $gte: today }
            });

            roleStats[role] = { count, active };
        }

        // Récupérer les dernières connexions (top 5)
        const recentLogins = await User.find({
            lastLogin: { $ne: null }
        })
            .select('name role lastLogin')
            .sort({ lastLogin: -1 })
            .limit(5);

        // Formater les données de connexion récentes
        const formattedRecentLogins = recentLogins.map(user => ({
            id: user._id,
            name: user.name,
            role: user.role,
            lastLogin: user.lastLogin
        }));

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeToday,
                roleStats,
                recentLogins: formattedRecentLogins
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques utilisateur'
        });
    }
};

// Nouvelle fonction pour rechercher des utilisateurs
export const searchUsers = async (req, res) => {
    try {
        const { query, role, status, limit = 10 } = req.query;

        // Construire les critères de recherche
        const searchCriteria = {};

        if (query) {
            searchCriteria.$or = [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }

        if (role && ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'].includes(role)) {
            searchCriteria.role = role;
        }

        if (status === 'active') {
            searchCriteria.isActive = true;
        } else if (status === 'inactive') {
            searchCriteria.isActive = false;
        }

        // Exécuter la recherche
        const users = await User.find(searchCriteria)
            .limit(parseInt(limit))
            .select('name email role isActive lastLogin profilePicture')
            .sort({ name: 1 });

        // Formater la réponse
        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            profilePicture: user.profilePicture
        }));

        res.status(200).json({
            success: true,
            count: formattedUsers.length,
            data: formattedUsers
        });

    } catch (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche d\'utilisateurs'
        });
    }
};

// Nouvelle fonction pour exporter les données utilisateurs
export const exportUsers = async (req, res) => {
    try {
        const { format = 'csv' } = req.query;

        // Récupérer tous les utilisateurs
        const users = await User.find()
            .select('name email role isActive lastLogin createdAt')
            .sort({ name: 1 });

        if (format === 'csv') {
            // Générer les en-têtes CSV
            let csvContent = 'Nom,Email,Rôle,Statut,Dernière Connexion,Date de Création\n';

            // Ajouter les données utilisateurs
            users.forEach(user => {
                const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais';
                const createdAt = new Date(user.createdAt).toLocaleString('fr-FR');
                const status = user.isActive ? 'Actif' : 'Inactif';

                csvContent += `"${user.name}","${user.email}","${user.role}","${status}","${lastLogin}","${createdAt}"\n`;
            });

            // Configurer les en-têtes de réponse pour le téléchargement
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=utilisateurs.csv');

            return res.send(csvContent);
        }

        // Format JSON par défaut
        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        }));

        res.status(200).json({
            success: true,
            count: formattedUsers.length,
            data: formattedUsers
        });

    } catch (error) {
        console.error('Erreur lors de l\'exportation des utilisateurs:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'exportation des utilisateurs'
        });
    }
};

// Nouvelle fonction pour modifier le rôle d'un utilisateur
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Vérifier que le rôle est valide
        const validRoles = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Rôle invalide'
            });
        }

        // Trouver et mettre à jour l'utilisateur
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour le rôle
        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Rôle de l\'utilisateur mis à jour avec succès',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Erreur lors de la modification du rôle:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la modification du rôle'
        });
    }
};

