import { Workspace } from '../models/workspace.model.js';
import { User } from '../models/user.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'testesenpfe@gmail.com',
        pass: process.env.EMAIL_PASS || 'jonc fdgd iuda pnzu'
    }
});

// Fonction pour envoyer un email d'invitation
const sendInvitationEmail = async (email, workspaceName, inviteCode) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'votre_email@gmail.com',
            to: email,
            subject: `Invitation à rejoindre le workspace ${workspaceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333; text-align: center;">Invitation à rejoindre un workspace</h2>
                    <p>Vous avez été invité(e) à rejoindre le workspace <strong>${workspaceName}</strong>.</p>
                    <p>Voici votre code d'invitation: <strong>${inviteCode}</strong></p>
                    <p>Pour rejoindre le workspace, cliquez sur le lien ci-dessous :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/join-workspace/${inviteCode}" 
                           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                           Rejoindre le workspace
                        </a>
                    </div>
                    <p style="color: #777; font-size: 14px;">Si vous n'avez pas demandé cette invitation, veuillez ignorer cet email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email d'invitation envoyé à ${email}`);
    } catch (error) {
        console.error(`Erreur lors de l'envoi de l'email d'invitation: ${error.message}`);
        // On ne bloque pas le flux d'exécution en cas d'échec d'envoi d'email
    }
};

// Générer un code d'invitation unique
const generateInviteCode = () => {
    return crypto.randomBytes(4).toString('hex');
};

// Créer un nouveau workspace
export const createWorkspace = async (req, res) => {
    try {
        const { name, description, userId } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Le nom du workspace est obligatoire'
            });
        }

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Générer un code d'invitation
        const inviteCode = generateInviteCode();

        // Créer le workspace
        const workspace = new Workspace({
            name,
            description: description || '',
            owner: userId,
            members: [{
                userId: userId,
                role: 'ADMIN',
                permissions: ['VIEW_MEMBERS', 'INVITE_MEMBER', 'REMOVE_MEMBER', 'EDIT_WORKSPACE', 'EDIT_MEMBER_ROLE'],
                joinedAt: new Date()
            }],
            inviteCode
        });

        await workspace.save();

        // Mettre à jour le workspace de l'utilisateur
        user.WorkspaceId = workspace._id;
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Workspace créé avec succès',
            workspace: {
                _id: workspace._id,
                name: workspace.name,
                description: workspace.description,
                owner: workspace.owner,
                inviteCode: workspace.inviteCode
            }
        });

    } catch (error) {
        console.error('Erreur lors de la création du workspace:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du workspace'
        });
    }
};

// Obtenir tous les workspaces d'un utilisateur
export const getAllUserWorkspaces = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'ID utilisateur requis'
            });
        }

        // Trouver tous les workspaces où l'utilisateur est membre
        const workspaces = await Workspace.find({
            'members.userId': userId
        }).select('_id name description owner inviteCode');

        res.status(200).json({
            success: true,
            message: 'Workspaces récupérés avec succès',
            workspaces
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des workspaces:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des workspaces'
        });
    }
};

// Obtenir les détails d'un workspace
export const getWorkspaceById = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'ID utilisateur requis'
            });
        }

        if (!workspaceId || workspaceId === 'undefined') {
            return res.status(400).json({
                success: false,
                error: 'ID de workspace invalide'
            });
        }

        // Récupérer le workspace
        const workspace = await Workspace.findById(workspaceId)
            .populate('owner', 'name email')
            .populate('members.userId', 'name email profilePicture');

        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace non trouvé'
            });
        }

        // Vérifier si l'utilisateur est membre
        const isMember = workspace.members.some(member =>
            member.userId && member.userId._id &&
            member.userId._id.toString() === userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                error: 'Vous n\'avez pas accès à ce workspace'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Détails du workspace récupérés avec succès',
            workspace
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des détails du workspace:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des détails du workspace'
        });
    }
};

// Modifier un workspace
export const updateWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, description, userId } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Le nom du workspace est obligatoire'
            });
        }

        // Récupérer le workspace
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace non trouvé'
            });
        }

        // Vérifier si l'utilisateur est admin
        const memberInfo = workspace.members.find(member =>
            member.userId.toString() === userId && member.role === 'ADMIN'
        );

        if (!memberInfo && workspace.owner.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Vous n\'avez pas les droits pour modifier ce workspace'
            });
        }

        // Mettre à jour le workspace
        workspace.name = name;
        workspace.description = description || workspace.description;
        await workspace.save();

        res.status(200).json({
            success: true,
            message: 'Workspace mis à jour avec succès',
            workspace: {
                _id: workspace._id,
                name: workspace.name,
                description: workspace.description,
                owner: workspace.owner,
                inviteCode: workspace.inviteCode
            }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du workspace:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du workspace'
        });
    }
};

// Inviter un membre dans un workspace
export const inviteMember = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { email, role, userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "ID utilisateur requis"
            });
        }

        // Trouver le workspace et vérifier s'il existe
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ success: false, error: "Workspace non trouvé" });
        }

        // Vérifier si l'utilisateur est membre du workspace
        const membership = workspace.members.find(
            member => member.userId.toString() === userId
        );

        if (!membership) {
            return res.status(403).json({
                success: false,
                error: "Vous n'êtes pas autorisé à accéder à ce workspace"
            });
        }

        // Vérifier si l'utilisateur a le rôle approprié pour inviter
        if (membership.role !== 'ADMIN' && membership.role !== 'PROJECT_MANAGER') {
            return res.status(403).json({
                success: false,
                error: "Vous n'avez pas les permissions nécessaires pour inviter des membres"
            });
        }

        // Vérifier si l'utilisateur existe
        let user = await User.findOne({ email });

        if (!user) {
            // Créer l'utilisateur s'il n'existe pas
            user = new User({
                email,
                name: email.split('@')[0], // Nom par défaut basé sur l'email
                role: role,
                isActive: false, // L'utilisateur doit activer son compte
                password: Math.random().toString(36).slice(-8) // Mot de passe temporaire
            });

            await user.save();
        }

        // Vérifier si l'utilisateur est déjà membre
        const isAlreadyMember = workspace.members.some(
            member => member.userId.toString() === user._id.toString()
        );

        if (isAlreadyMember) {
            return res.status(400).json({
                success: false,
                error: 'L\'utilisateur est déjà membre de ce workspace'
            });
        }

        // Ajouter l'utilisateur comme membre
        workspace.members.push({
            userId: user._id,
            role: role,
            permissions: ['VIEW_MEMBERS', 'INVITE_MEMBER', 'REMOVE_MEMBER', 'EDIT_WORKSPACE', 'EDIT_MEMBER_ROLE'],
            joinedAt: new Date()
        });

        await workspace.save();

        // Envoyer un email d'invitation
        await sendInvitationEmail(email, workspace.name, workspace.inviteCode);

        res.status(200).json({
            success: true,
            message: 'Invitation envoyée avec succès',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                },
                role: role
            }
        });

    } catch (error) {
        console.error("Erreur lors de l'invitation d'un membre:", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'invitation"
        });
    }
};

// Rejoindre un workspace avec un code d'invitation
export const joinWorkspaceWithInviteCode = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const { userId } = req.body;

        if (!inviteCode || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Code d\'invitation et ID utilisateur sont obligatoires'
            });
        }

        // Vérifier si le workspace existe
        const workspace = await Workspace.findOne({ inviteCode });
        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace non trouvé ou code d\'invitation invalide'
            });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Vérifier si l'utilisateur est déjà membre
        const isAlreadyMember = workspace.members.some(
            member => member.userId.toString() === userId
        );

        if (isAlreadyMember) {
            return res.status(400).json({
                success: false,
                error: 'Vous êtes déjà membre de ce workspace'
            });
        }

        // Ajouter l'utilisateur comme membre
        workspace.members.push({
            userId: userId,
            role: 'DEVELOPER', // Rôle par défaut
            joinedAt: new Date()
        });

        await workspace.save();

        // Mettre à jour le workspace actuel de l'utilisateur
        user.WorkspaceId = workspace._id;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Vous avez rejoint le workspace avec succès',
            workspace: {
                _id: workspace._id,
                name: workspace.name,
                description: workspace.description
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'adhésion au workspace:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'adhésion au workspace'
        });
    }
};

// Obtenir tous les membres d'un workspace
export const getAllWorkspaceMembers = async (req, res) => {
    try {
        console.log("Requête reçue pour les membres:", req.params, req.query);
        const { workspaceId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId est requis comme paramètre de requête'
            });
        }

        // Pour déboguer les permissions
        const workspace = await Workspace.findById(workspaceId);
        console.log("Utilisateur:", userId);
        console.log("Workspace trouvé:", !!workspace);

        if (workspace) {
            const member = workspace.members.find(m =>
                m.userId.toString() === userId
            );
            console.log("Membre trouvé:", !!member);
            console.log("Rôle:", member?.role);
            console.log("Permissions:", member?.permissions);
        }

        // Désactiver temporairement la vérification des permissions pour déboguer
        // Commenter ces vérifications pour tester
        /*
        if (!member) {
            return res.status(403).json({...});
        }
        if (!hasPermission) {
            return res.status(403).json({...});
        }
        */

        // Récupérer tous les membres
        const members = await Promise.all(
            workspace.members.map(async (member) => {
                const user = await User.findById(member.userId, 'name email profilePicture');
                return {
                    userId: member.userId,
                    role: member.role,
                    joinedAt: member.joinedAt,
                    user: user || { name: 'Utilisateur inconnu' }
                };
            })
        );

        res.status(200).json({
            success: true,
            members
        });
    } catch (error) {
        console.error('Erreur détaillée:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
};

// Mettre à jour le rôle d'un membre dans un workspace
export const updateMemberRole = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;
        const { role } = req.body;

        // Récupérer l'ID de l'utilisateur faisant la requête
        const requestingUserId = req.user?._id || req.query.userId;

        console.log("Debug updateMemberRole:");
        console.log("- workspaceId:", workspaceId);
        console.log("- userId à modifier:", userId);
        console.log("- requestingUserId:", requestingUserId);
        console.log("- Nouveau rôle:", role);

        // Convertir en chaînes pour la comparaison
        if (String(requestingUserId) === String(userId)) {
            return res.status(403).json({
                success: false,
                error: 'Vous ne pouvez pas modifier votre propre rôle'
            });
        }

        // Vérifier que le rôle est valide
        const validRoles = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Rôle invalide'
            });
        }

        // Récupérer le workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace non trouvé'
            });
        }

        // Vérifier que l'utilisateur faisant la requête est admin du workspace
        const requesterInfo = workspace.members.find(member =>
            String(member.userId) === String(requestingUserId)
        );

        console.log("- Infos du demandeur trouvées:", !!requesterInfo);
        console.log("- Rôle du demandeur:", requesterInfo?.role);
        console.log("- Owner du workspace:", workspace.owner);

        const isAdmin = requesterInfo?.role === 'ADMIN' ||
            String(workspace.owner) === String(requestingUserId);

        console.log("- Est admin:", isAdmin);

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Vous n\'avez pas les droits pour modifier les rôles'
            });
        }

        // Vérifier que le membre existe dans le workspace
        const memberIndex = workspace.members.findIndex(member =>
            member.userId.toString() === userId
        );

        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Membre non trouvé dans ce workspace'
            });
        }

        // Empêcher la modification du rôle du propriétaire
        if (workspace.owner.toString() === userId) {
            return res.status(403).json({
                success: false,
                error: 'Impossible de modifier le rôle du propriétaire du workspace'
            });
        }

        // Mettre à jour le rôle
        workspace.members[memberIndex].role = role;

        // Ajuster les permissions en fonction du rôle
        if (role === 'ADMIN') {
            workspace.members[memberIndex].permissions = [
                'VIEW_MEMBERS', 'INVITE_MEMBER', 'REMOVE_MEMBER',
                'EDIT_WORKSPACE', 'EDIT_MEMBER_ROLE',
                'CREATE_PROJECT', 'EDIT_PROJECT', 'DELETE_PROJECT',
                'CREATE_TASK', 'EDIT_TASK', 'DELETE_TASK'
            ];
        } else if (role === 'PROJECT_MANAGER') {
            workspace.members[memberIndex].permissions = [
                'VIEW_MEMBERS', 'INVITE_MEMBER',
                'CREATE_PROJECT', 'EDIT_PROJECT',
                'CREATE_TASK', 'EDIT_TASK', 'DELETE_TASK'
            ];
        } else {
            workspace.members[memberIndex].permissions = [
                'VIEW_MEMBERS',
                'CREATE_TASK', 'EDIT_TASK'
            ];
        }

        await workspace.save();

        res.status(200).json({
            success: true,
            message: 'Rôle du membre mis à jour avec succès',
            member: {
                userId: workspace.members[memberIndex].userId,
                role: workspace.members[memberIndex].role,
                permissions: workspace.members[memberIndex].permissions
            }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la mise à jour du rôle'
        });
    }
};

// Supprimer un workspace
export const deleteWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { userId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                error: 'ID du workspace requis'
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'ID utilisateur requis'
            });
        }

        // Récupérer le workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace non trouvé'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire ou admin
        const member = workspace.members.find(m =>
            m.userId.toString() === userId &&
            (m.role === 'ADMIN' || workspace.owner.toString() === userId)
        );

        if (!member) {
            return res.status(403).json({
                success: false,
                error: 'Vous n\'avez pas la permission de supprimer ce workspace'
            });
        }

        // Trouver un autre workspace pour les membres
        const otherWorkspace = await Workspace.findOne({
            _id: { $ne: workspaceId },
            'members.userId': userId
        });

        // Supprimer le workspace
        await Workspace.findByIdAndDelete(workspaceId);

        res.status(200).json({
            success: true,
            message: 'Workspace supprimé avec succès',
            currentWorkspace: otherWorkspace ? otherWorkspace._id : null
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du workspace:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression du workspace'
        });
    }
};

// Supprimer un membre du workspace
export const removeMemberFromWorkspace = async (req, res) => {
    try {
        const { workspaceId, memberUserId } = req.params;
        const { userId } = req.query; // ID de l'utilisateur effectuant la suppression

        if (!workspaceId || !memberUserId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Identifiants manquants'
            });
        }

        // Récupérer le workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace non trouvé'
            });
        }

        // Vérifier que l'utilisateur a les droits (admin ou propriétaire)
        const requestingMember = workspace.members.find(m =>
            m.userId.toString() === userId &&
            (m.role === 'ADMIN' || workspace.owner.toString() === userId)
        );

        if (!requestingMember) {
            return res.status(403).json({
                success: false,
                error: 'Vous n\'avez pas les droits pour supprimer un membre'
            });
        }

        // Empêcher la suppression du propriétaire
        if (workspace.owner.toString() === memberUserId) {
            return res.status(403).json({
                success: false,
                error: 'Impossible de supprimer le propriétaire du workspace'
            });
        }

        // Supprimer le membre
        workspace.members = workspace.members.filter(
            m => m.userId.toString() !== memberUserId
        );

        await workspace.save();

        res.status(200).json({
            success: true,
            message: 'Membre supprimé avec succès',
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du membre:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression du membre'
        });
    }
};