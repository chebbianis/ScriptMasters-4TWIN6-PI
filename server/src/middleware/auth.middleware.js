// import { verifyToken } from '../services/jwt.service.js';
// export const authenticate = (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader?.startsWith('Bearer ')) {
//         console.log('No Bearer token provided');
//         return res.status(401).json({ error: 'Unauthorized' });
//     }

//     const token = authHeader.split(' ')[1];
//     console.log('Token received:', token);

//     try {
//         const decoded = verifyToken(token);
//         console.log('Decoded token:', decoded);

//         if (!decoded || !decoded.id) {
//             throw new Error('Token decoded but no id found');
//         }

//         req.user = { id: decoded.id };
//         console.log('req.user set:', req.user);
//         next();
//     } catch (error) {
//         console.error('Token verification failed:', error.message);
//         res.status(403).json({ error: 'Invalid token' });
//     }
// };




import jwt from 'jsonwebtoken';
import 'dotenv/config';

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
if (!accessTokenSecret) {
    throw new Error('ACCESS_TOKEN_SECRET is not configured');
}

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, accessTokenSecret);
        if (!decoded?.id) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        res.status(403).json({ error: 'Invalid token' });
    }
};