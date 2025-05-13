import Notification from "../models/notification.js";

// Créer une notification
// Dans notificationroutes.js (backend)
export const createNotification = async (req, res) => {
  try {
    const { userId, projectId, message } = req.body;
    const notification = new Notification({ userId, projectId, message });
    await notification.save();

    if (global.io) {
      console.log(`Émission vers l'utilisateur ${userId}`);
      global.io.to(userId).emit("notification", notification);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error("Erreur lors de la création de la notification :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les notifications pour un utilisateur
export const getNotifications = async (req, res) => {
  try {
    // On attend que l'ID de l'utilisateur soit passé en query ?userId=...
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId est requis" });
    }
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    res.json({ notifications });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des notifications" });
  }
};
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
