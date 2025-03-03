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
      WorkspaceId: null,
    });

    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      WorkspaceId: null,
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
      id: user._id, // Bien converti depuis _id MongoDB
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      role: user.role,
      WorkspaceId: user.WorkspaceId,
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

    // Effacer le refresh token de l'utilisateur
    user.refreshToken = null;
    await user.save();

    console.log(`Utilisateur déconnecté: ${user.email}`);

    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    res.status(500).json({ error: error.message });
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

// Fonction pour envoyer l'email de réinitialisation du mot de passe

// Configuration de Mailtrap
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "lue.rowe@ethereal.email", // Remplace par ton identifiant Mailtrap
    pass: "U71Pn2WhqrChYMPG3Y", // Remplace par ton mot de passe Mailtrap
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

    // Mise à jour du mot de passe (le hook pre-save du modèle User doit gérer le hashage)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
