import express from 'express';
import {
    createWorkspace, getAllUserWorkspaces, getWorkspaceById,
    updateWorkspace, inviteMember, joinWorkspaceWithInviteCode,
    getAllWorkspaceMembers, updateMemberRole, deleteWorkspace,
    removeMemberFromWorkspace, organizeMeeting
} from '../controllers/workspace.controller.js';

const router = express.Router();

// Routes pour les workspaces
router.post('/create/new', createWorkspace);
router.get('/all/', getAllUserWorkspaces);
router.get('/:workspaceId', getWorkspaceById);
router.put('/update/:workspaceId', updateWorkspace);
router.delete('/delete/:workspaceId', deleteWorkspace);

// Routes pour les membres
router.post('/:workspaceId/invite', inviteMember);
router.post('/join/:inviteCode', joinWorkspaceWithInviteCode);
router.get('/members/:workspaceId', getAllWorkspaceMembers);
router.patch('/:workspaceId/member/:userId/role', updateMemberRole);
router.delete('/:workspaceId/member/:memberUserId', removeMemberFromWorkspace);

// Route pour les réunions
router.post('/:workspaceId/meeting', organizeMeeting);

export default router; 