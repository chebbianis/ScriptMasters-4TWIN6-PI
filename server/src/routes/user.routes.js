import express from 'express';
import {
    loginUser, createUser, logoutUser, getPendingUsers,
    activateUser, getUserStats, searchUsers, exportUsers,
    updateUserRole, searchUsersSimple, deleteUser
} from '../controllers/user.controller.js';

const router = express.Router();

// Routes utilisateur
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/register', createUser);
router.get('/pending-user-list', getPendingUsers);
router.patch('/activate/:userId', activateUser);
router.get('/stats', getUserStats);
router.get('/search', searchUsers);
router.get('/search/simple', searchUsersSimple);
router.get('/export', exportUsers);
router.patch('/:userId/role', updateUserRole);
router.delete('/:userId', deleteUser);

export default router;