import { verifyToken } from '../services/jwt.service.js';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};