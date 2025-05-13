import express from "express";
const router = express.Router();
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
} from "../controllers/notification.js";
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token non fourni" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ error: "Token expiré" });
      }
      return res.status(403).json({ error: "Token invalide" });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  });
}
// vos routes ici
router.post("/", createNotification);
router.get("/", getNotifications);
// Dans notificationroutes.js
router.patch(
  "/:notificationId/read",
  authenticateToken,
  markNotificationAsRead
);

export default router;
