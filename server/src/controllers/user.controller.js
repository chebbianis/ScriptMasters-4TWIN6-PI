import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = await User.create({
      name,
      email,
      password,
    });

    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
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
    console.log("Login attempt for:", email);

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // Mise à jour de lastLogin
    user.lastLogin = Date.now();

    // Debug: Vérification du mot de passe
    console.log("Stored hash:", user.password?.slice(0, 10) + "...");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // Génération des tokens
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Debug: Vérification des tokens
    console.log("Generated accessToken:", accessToken?.slice(0, 20) + "...");
    console.log("Generated refreshToken:", refreshToken?.slice(0, 20) + "...");

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
      refreshToken,
    };

    console.log("Sending response:", JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ error: "Refresh token requis" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Refresh token invalide" });
    }

    // Générer un nouveau access token
    const newAccessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
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
      return res
        .status(400)
        .json({ error: "Email requis pour la déconnexion" });
    }

    // Trouver l'utilisateur avec cet email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // mise a jour de la connexion et refresh token de l'utilisateur
    user.refreshToken = null;

    await user.save();

    console.log(`Utilisateur déconnecté: ${user.email}`);

    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      isActive: false,
    })
      .select(["name", "email", "role", "createdAt", "profilePicture"])
      .sort({
        createdAt: -1, // Trier par date de création, plus récent en premier
      });

    // Formater la réponse
    const formattedUsers = pendingUsers.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      requestedRole: user.role,
      requestedAt: user.createdAt,
      avatar: user.profilePicture || null,
    }));

    res.status(200).json({
      success: true,
      count: formattedUsers.length,
      data: formattedUsers,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des utilisateurs en attente:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des utilisateurs en attente",
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
          updatedAt: Date.now(),
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: "Utilisateur non trouvé",
        });
      }

      res.status(200).json({
        success: true,
        message: "Utilisateur activé avec succès",
        data: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } else {
      // Supprimer l'utilisateur si la demande est rejetée
      await User.findByIdAndDelete(userId);

      res.status(200).json({
        success: true,
        message: "Demande d'utilisateur rejetée",
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'activation/rejet de l'utilisateur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du traitement de la demande",
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
      lastLogin: { $gte: today },
    });

    // Statistiques par rôle
    const roleStats = {};
    const roles = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"];

    for (const role of roles) {
      const count = await User.countDocuments({ role });
      const active = await User.countDocuments({
        role,
        lastLogin: { $gte: today },
      });

      roleStats[role] = { count, active };
    }

    // Récupérer les dernières connexions (top 5)
    const recentLogins = await User.find({
      lastLogin: { $ne: null },
    })
      .select("name role lastLogin")
      .sort({ lastLogin: -1 })
      .limit(5);

    // Formater les données de connexion récentes
    const formattedRecentLogins = recentLogins.map((user) => ({
      id: user._id,
      name: user.name,
      role: user.role,
      lastLogin: user.lastLogin,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeToday,
        roleStats,
        recentLogins: formattedRecentLogins,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques utilisateur:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques utilisateur",
    });
  }
};

// Modifions la fonction searchUsers pour prendre en compte les filtres de rôle et statut
export const searchUsers = async (req, res) => {
  try {
    const { keyword = "", role, status, limit = 50 } = req.query;

    console.log("Recherche d'utilisateurs avec les paramètres:", {
      keyword,
      role,
      status,
      limit,
    });

    // Construire la requête
    let query = {};

    // Si un mot-clé est fourni, filtrer par ce mot-clé
    if (keyword && keyword.trim() !== "") {
      query.$or = [
        { email: { $regex: keyword, $options: "i" } },
        { name: { $regex: keyword, $options: "i" } },
      ];
    }

    // Filtrer par rôle si spécifié
    if (role && role !== "all") {
      query.role = role;
    }

    // Filtrer par statut si spécifié
    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    console.log("Requête MongoDB:", JSON.stringify(query, null, 2));

    // Récupérer les utilisateurs
    const users = await User.find(query)
      .select("_id name email role isActive lastLogin")
      .limit(parseInt(limit))
      .sort({ name: 1 });

    console.log(`Trouvé ${users.length} utilisateurs`);

    res.status(200).json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la recherche des utilisateurs:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la recherche des utilisateurs",
    });
  }
};

// Nouvelle fonction pour exporter les données utilisateurs
export const exportUsers = async (req, res) => {
  try {
    const { format = "csv" } = req.query;

    // Récupérer tous les utilisateurs
    const users = await User.find()
      .select("name email role isActive lastLogin createdAt")
      .sort({ name: 1 });

    if (format === "csv") {
      // Générer les en-têtes CSV
      let csvContent =
        "Nom,Email,Rôle,Statut,Dernière Connexion,Date de Création\n";

      // Ajouter les données utilisateurs
      users.forEach((user) => {
        const lastLogin = user.lastLogin
          ? new Date(user.lastLogin).toLocaleString("fr-FR")
          : "Jamais";
        const createdAt = new Date(user.createdAt).toLocaleString("fr-FR");
        const status = user.isActive ? "Actif" : "Inactif";

        csvContent += `"${user.name}","${user.email}","${user.role}","${status}","${lastLogin}","${createdAt}"\n`;
      });

      // Configurer les en-têtes de réponse pour le téléchargement
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=utilisateurs.csv"
      );

      return res.send(csvContent);
    }

    // Format JSON par défaut
    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedUsers.length,
      data: formattedUsers,
    });
  } catch (error) {
    console.error("Erreur lors de l'exportation des utilisateurs:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'exportation des utilisateurs",
    });
  }
};

// Nouvelle fonction pour modifier le rôle d'un utilisateur
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Vérifier que le rôle est valide
    const validRoles = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Rôle invalide",
      });
    }

    // Trouver et mettre à jour l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    // Mettre à jour le rôle
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Rôle de l'utilisateur mis à jour avec succès",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la modification du rôle:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification du rôle",
    });
  }
};

// Ajouter cette nouvelle fonction pour la recherche simple d'utilisateurs
export const searchUsersSimple = async (req, res) => {
  try {
    const { keyword = "" } = req.query;

    console.log("Recherche simple d'utilisateurs avec le mot-clé:", keyword);

    // Construire la requête pour chercher par email ou nom
    let query = {};

    // Si un mot-clé est fourni, filtrer par ce mot-clé
    if (keyword && keyword.trim() !== "") {
      query = {
        $or: [
          { email: { $regex: keyword, $options: "i" } },
          { name: { $regex: keyword, $options: "i" } },
        ],
      };
    }

    // Récupérer les utilisateurs avec plus de champs
    const users = await User.find(query)
      .select("_id name email role isActive lastLogin")
      .limit(50)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        id: user._id, // Ajouter id pour compatibilité
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      })),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la recherche simple des utilisateurs:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la recherche des utilisateurs",
    });
  }
};

// Fonction pour supprimer un utilisateur
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`Tentative de suppression de l'utilisateur avec ID: ${userId}`);

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    // Vérifier si l'utilisateur qui fait la demande est un admin
    // Cette vérification est optionnelle mais recommandée pour la sécurité
    const requestingUser = req.user;
    if (requestingUser && requestingUser.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error:
          "Permission refusée. Seuls les administrateurs peuvent supprimer des utilisateurs",
      });
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    // Retourner une réponse réussie
    res.status(200).json({
      success: true,
      message: `L'utilisateur ${user.name} a été supprimé avec succès`,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression de l'utilisateur",
    });
  }
};
//getuserpourproject
export const getAllUsers = async (req, res) => {
  try {
    const developers = await User.find({ role: "DEVELOPER" }, "name role"); // Sélectionne uniquement `name` et `role`
    res.status(200).json({ developers });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des développeurs",
      error,
    });
  }
};

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "lew12@ethereal.email",
    pass: "zyZK65n7MqNk5uHHfm",
  },
});

// Fonction pour envoyer un email de réinitialisation de mot de passe
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Générer un token sécurisé et fixer son expiration (1 heure)
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 heure
    await user.save();

    // Création d'un compte de test Ethereal
    let testAccount = await nodemailer.createTestAccount();

    // Création du transporteur SMTP avec Ethereal
    let transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // URL de réinitialisation à envoyer
    const resetUrl = `http://localhost:5173/reset-password/${token}`;

    // Configuration de l'email
    let mailOptions = {
      from: '"Support" <support@example.com>',
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: `<p>Vous avez demandé à réinitialiser votre mot de passe.<br>
        <a href="http://localhost:5173/reset-password/${token}">Cliquez ici pour réinitialiser</a></p>`,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Email envoyé: %s", info.messageId);
    console.log(
      "Prévisualisation (Ethereal): %s",
      nodemailer.getTestMessageUrl(info)
    );

    res.json({
      message: "Email de réinitialisation envoyé.",
      previewUrl: nodemailer.getTestMessageUrl(info),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Vérification du token de réinitialisation (pour afficher le formulaire côté client)
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }
    res.json({ message: "Token valide." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Vérifier le token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const updateProfile = async (req, res) => {
  const { currentEmail, name, newEmail } = req.body;

  try {
    if (!currentEmail) {
      return res.status(400).json({ error: "Utilisateur non authentifié" });
    }

    const user = await User.findOne({ email: currentEmail });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    user.name = name;
    user.email = newEmail;
    await user.save();

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du profil" });
  }
};
export const updatePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Vérifier que tous les champs requis sont présents
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        error:
          "Tous les champs (email, mot de passe actuel et nouveau mot de passe) sont requis.",
      });
    }

    // Recherche de l'utilisateur par email en incluant le champ password (souvent exclu par défaut)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Vérifier si le mot de passe actuel est correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    // Mettre à jour le mot de passe (les hooks pre-save dans le modèle User peuvent gérer le hashage)
    user.password = newPassword;
    await user.save();
    console.log("mot de passe de " + email + " est changé");

    res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fonctions pour la reconnaissance faciale
export const registerFace = async (req, res) => {
  try {
    console.log("Face registration request received");
    const { userId } = req.body;

    // Debug request
    console.log("Request body:", req.body);
    console.log("UserId from request:", userId);
    console.log("File in request:", req.file ? "Present" : "Not present");

    if (!userId) {
      console.log("UserId missing in request");
      return res.status(400).json({
        success: false,
        message: "ID utilisateur requis"
      });
    }

    if (!req.file) {
      console.log("No face image file in request");
      return res.status(400).json({
        success: false,
        message: "Aucune image de visage fournie"
      });
    }

    console.log("Face image received:", req.file.path);

    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found with ID:", userId);
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Enregistrer le chemin de l'image faciale
    const facePath = req.file.path;
    console.log("Saving face image path:", facePath);

    // Mettre à jour l'utilisateur avec le chemin de l'image faciale
    user.faceImagePath = facePath;
    await user.save();

    console.log("Face registration successful for user:", user.email);

    return res.status(200).json({
      success: true,
      message: "Visage enregistré avec succès",
      data: {
        userId: user._id,
        faceRegistered: true
      }
    });

  } catch (error) {
    console.error("Erreur d'enregistrement facial:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du visage",
      error: error.message
    });
  }
};

export const verifyFace = async (req, res) => {
  try {
    console.log("Face verification request received");
    const { email } = req.body;

    // Debug request
    console.log("Request body:", req.body);
    console.log("Email from request:", email);
    console.log("File in request:", req.file ? "Present" : "Not present");
    
    if (!email) {
      console.log("Email missing in request");
      return res.status(400).json({
        success: false,
        message: "Email de l'utilisateur requis"
      });
    }

    if (!req.file) {
      console.log("No face image file in request");
      return res.status(400).json({
        success: false,
        message: "Aucune image de visage fournie"
      });
    }

    console.log("Face image received:", req.file.path);

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // For development purposes, we'll bypass face verification
    // In production, this would compare the uploaded face with the stored face
    
    // Mise à jour de lastLogin
    user.lastLogin = Date.now();

    // Génération des tokens
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Mise à jour utilisateur
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
      refreshToken,
    };

    console.log("Face verification successful for user:", user.email);
    
    return res.status(200).json({
      success: true,
      message: "Authentification faciale réussie",
      user: responseData
    });

  } catch (error) {
    console.error("Erreur de vérification faciale:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du visage",
      error: error.message
    });
  }
};

// Fonction pour initialiser les compétences des développeurs
export const initializeDeveloperSkills = async () => {
  try {
    const defaultSkills = [
      "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Ruby", "PHP",
      "Go", "Rust", "Swift", "Kotlin", "Scala", "R", "MATLAB", "SQL", "HTML",
      "CSS", "Dart", "Elixir", "Haskell", "Perl", "Shell", "PowerShell"
    ];

    const developers = await User.find({ role: 'DEVELOPER' });
    console.log(`Found ${developers.length} developers to update`);

    for (const developer of developers) {
      if (!developer.skills || developer.skills.length === 0) {
        // Sélectionner aléatoirement 3-5 compétences
        const numSkills = Math.floor(Math.random() * 3) + 3;
        const randomSkills = defaultSkills
          .sort(() => 0.5 - Math.random())
          .slice(0, numSkills);

        developer.skills = randomSkills;
        developer.experience = Math.floor(Math.random() * 5) + 1; // 1-5 ans d'expérience
        developer.performanceRating = (Math.random() * 2 + 3).toFixed(1); // Note entre 3.0 et 5.0
        developer.currentWorkload = Math.floor(Math.random() * 20); // Charge de travail 0-20

        await developer.save();
        console.log(`Updated developer ${developer.name} with skills:`, randomSkills);
      }
    }

    console.log('Developer skills initialization complete');
  } catch (error) {
    console.error('Error initializing developer skills:', error);
  }
};

// Appeler cette fonction lors du démarrage du serveur
initializeDeveloperSkills();
