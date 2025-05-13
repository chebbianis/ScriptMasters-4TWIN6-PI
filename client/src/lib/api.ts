import API from "./axios-client";
import {
  AllProjectPayloadType,
  AllProjectResponseType,
  AllTaskPayloadType,
  AllTaskResponseType,
  AnalyticsResponseType,
  ChangeWorkspaceMemberRoleType,
  CreateProjectPayloadType,
  CreateTaskPayloadType,
  CreateWorkspaceResponseType,
  EditProjectPayloadType,
  ProjectByIdPayloadType,
  ProjectResponseType,
} from "../types/api.type";
import {
  AllWorkspaceResponseType,
  CreateWorkspaceType,
  LoginResponseType,
  loginType,
  registerType,
  WorkspaceByIdResponseType,
  EditWorkspaceType,
} from "@/types/api.type";
import axios from "axios";

export const loginMutationFn = async (
  data: loginType
): Promise<LoginResponseType> => {
  const response = await API.post("user/login", data);
  return response.data;
};

export const registerMutationFn = async (data: registerType) =>
  await API.post("user/register", data);

export const logoutMutationFn = async (email: string) => {
  if (!email) {
    throw new Error("Email manquant");
  }
  return await API.post("user/logout", { email });
};

// export const getCurrentUserQueryFn =
//   async (): Promise<CurrentUserResponseType> => {
//     const response = await API.get(`/user/current`);
//     return response.data;
//   };

//********* WORKSPACE ****************
//************* */

export const createWorkspaceMutationFn = async (
  data: CreateWorkspaceType & { userId: string }
): Promise<CreateWorkspaceResponseType> => {
  const response = await API.post(`/workspace/create/new`, data);
  return response.data;
};

export const editWorkspaceMutationFn = async ({
  workspaceId,
  data,
}: EditWorkspaceType) => {
  // Récupérer l'ID de l'utilisateur actuel
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  const payload = {
    ...data,
    userId
  };

  const response = await API.put(`/workspace/update/${workspaceId}`, payload);
  return response.data;
};

export const getAllWorkspacesUserIsMemberQueryFn =
  async (): Promise<AllWorkspaceResponseType> => {
    // Récupérer l'ID de l'utilisateur actuel
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;

    const response = await API.get(`/workspace/all?userId=${userId}`);
    return response.data;
  };

export const getWorkspaceByIdQueryFn = async (
  workspaceId: string
): Promise<WorkspaceByIdResponseType> => {
  // Vérifier que l'ID du workspace est valide
  if (!workspaceId) {
    throw new Error('ID de workspace non défini');
  }

  // Récupérer l'ID de l'utilisateur actuel
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  const response = await API.get(`/workspace/${workspaceId}?userId=${userId}`);
  return response.data;
};

export const getMembersInWorkspaceQueryFn = async (workspaceId: string) => {
  // Récupérer l'ID de l'utilisateur connecté
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  // Ajouter l'userId comme paramètre de requête
  const response = await API.get(`/workspace/members/${workspaceId}?userId=${userId}`);
  return response.data;
};

export const getWorkspaceAnalyticsQueryFn = async (
  workspaceId: string
): Promise<AnalyticsResponseType> => {
  const response = await API.get(`/workspace/analytics/${workspaceId}`);
  return response.data;
};

export const changeWorkspaceMemberRoleMutationFn = async ({
  workspaceId,
  data,
}: ChangeWorkspaceMemberRoleType) => {
  const response = await API.put(
    `/workspace/change/member/role/${workspaceId}`,
    data
  );
  return response.data;
};

export const deleteWorkspaceMutationFn = async (
  workspaceId: string
): Promise<{
  message: string;
  currentWorkspace: string;
}> => {
  // Récupérer l'ID de l'utilisateur actuel
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  console.log("Tentative de suppression du workspace:", workspaceId);
  console.log("UserId:", userId);

  try {
    const response = await API.delete(`/workspace/delete/${workspaceId}?userId=${userId}`);
    console.log("Réponse de suppression:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    throw error;
  }
};

//*******MEMBER ****************

export const invitedUserJoinWorkspaceMutationFn = async (
  inviteCode: string
): Promise<{
  message: string;
  workspaceId: string;
}> => {
  // Récupérer l'ID de l'utilisateur actuel
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  // Corriger l'URL pour qu'elle corresponde à la route du serveur 
  const response = await API.post(`/workspace/join/${inviteCode}`, { userId });
  return response.data;
};

//********* */
//********* PROJECTS
export const createProjectMutationFn = async ({
  workspaceId,
  data,
}: CreateProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.post(
    `/project/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const editProjectMutationFn = async ({
  projectId,
  workspaceId,
  data,
}: EditProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.put(
    `/project/${projectId}/workspace/${workspaceId}/update`,
    data
  );
  return response.data;
};

export const getProjectsInWorkspaceQueryFn = async ({
  workspaceId,
  pageSize = 10,
  pageNumber = 1,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const response = await API.get(
    `/project/workspace/${workspaceId}/all?pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
  return response.data;
};


export const getProjectAnalyticsQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<AnalyticsResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/analytics`
  );
  return response.data;
};

export const deleteProjectMutationFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/project/${projectId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

//*******TASKS ********************************
//************************* */

export const createTaskMutationFn = async ({
  workspaceId,
  projectId,
  data,
}: CreateTaskPayloadType) => {
  const response = await API.post(
    `/task/project/${projectId}/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const getAllTasksQueryFn = async ({
  workspaceId,
  keyword,
  projectId,
  assignedTo,
  priority,
  status,
  dueDate,
  pageNumber,
  pageSize,
}: AllTaskPayloadType): Promise<AllTaskResponseType> => {
  const baseUrl = `/task/workspace/${workspaceId}/all`;

  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (projectId) queryParams.append("projectId", projectId);
  if (assignedTo) queryParams.append("assignedTo", assignedTo);
  if (priority) queryParams.append("priority", priority);
  if (status) queryParams.append("status", status);
  if (dueDate) queryParams.append("dueDate", dueDate);
  if (pageNumber) queryParams.append("pageNumber", pageNumber?.toString());
  if (pageSize) queryParams.append("pageSize", pageSize?.toString());

  const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
  const response = await API.get(url);
  return response.data;
};

export const deleteTaskMutationFn = async ({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `task/${taskId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

//********* UTILISATEURS EN ATTENTE ****************

export const getPendingUsersQueryFn = async (): Promise<{
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    name: string;
    email: string;
    requestedRole: string;
    requestedAt: string;
    avatar: string | null;
  }>;
}> => {
  const response = await API.get("/user/pending-user-list");
  return response.data;
};

export const activateUserMutationFn = async ({
  userId,
  approved,
}: {
  userId: string;
  approved: boolean;
}): Promise<{
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}> => {
  const response = await API.patch(`/user/activate/${userId}`, { approved });
  return response.data;
};

//********* STATISTIQUES UTILISATEURS ****************

export const getUserStatsQueryFn = async (): Promise<{
  success: boolean;
  data: {
    totalUsers: number;
    activeToday: number;
    roleStats: Record<string, { count: number; active: number }>;
    recentLogins: Array<{
      id: string;
      name: string;
      role: string;
      lastLogin: string;
    }>;
  };
}> => {
  const response = await API.get("/user/stats");
  return response.data;
};

// Restaurer la fonction de recherche avancée (avec objet de paramètres)
export const searchUsersQueryFn = async ({
  query,
  role,
  status,
  limit
}: {
  query?: string;
  role?: 'all' | 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
  status?: 'all' | 'active' | 'inactive';
  limit?: number;
}): Promise<{
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin: string | null;
    profilePicture: string | null;
  }>;
}> => {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (role && role !== 'all') params.append('role', role);
  if (status && status !== 'all') params.append('status', status);
  if (limit) params.append('limit', limit.toString());

  const url = `/user/search?${params.toString()}`;
  const response = await API.get(url);
  return response.data;
};

// Créer une nouvelle fonction pour la recherche simple
export const searchUsersByKeywordQueryFn = async (
  keyword: string
): Promise<{
  users: {
    _id: string;
    name: string;
    email: string;
  }[];
}> => {
  const response = await API.get(`/user/search/simple?keyword=${keyword}`);
  return response.data;
};

// Fonction pour exporter les utilisateurs
export const exportUsersQueryFn = async (format: 'csv' | 'json' = 'csv'): Promise<void> => {
  try {
    // Utiliser l'URL complète du backend au lieu d'une URL relative
    const baseURL = API.defaults.baseURL || 'http://localhost:3000'; // Récupérer l'URL de base d'Axios ou utiliser celle par défaut
    const url = `${baseURL}/user/export?format=${format}`;

    // Approche 1: Ouvrir dans un nouvel onglet
    const newWindow = window.open(url, '_blank');

    // Si la fenêtre est bloquée
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Approche 2: Utiliser un lien temporaire
      const link = document.createElement('a');
      link.href = url;
      link.download = `utilisateurs.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error("Erreur lors de l'exportation:", error);
    throw new Error("Échec de l'exportation des utilisateurs");
  }
};

// Fonction pour mettre à jour le rôle d'un utilisateur
export const updateUserRoleMutationFn = async ({
  userId,
  role
}: {
  userId: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
}): Promise<{
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}> => {
  const response = await API.patch(`/user/${userId}/role`, { role });
  return response.data;
};

// Inviter un membre dans un workspace
export const inviteMemberToWorkspaceMutationFn = async ({
  workspaceId,
  email,
  role
}: {
  workspaceId: string;
  email: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
}): Promise<{
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    role: string;
  };
}> => {
  // Récupérer l'ID de l'utilisateur actuel
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  const payload = {
    email,
    role,
    userId
  };

  const response = await API.post(`/workspace/${workspaceId}/invite`, payload);
  return response.data;
};

// Rejoindre un workspace avec un code d'invitation
export const joinWorkspaceWithInviteCodeMutationFn = async (
  inviteCode: string
): Promise<{
  success: boolean;
  message: string;
  workspace?: {
    _id: string;
    name: string;
    description: string;
  };
}> => {
  // Récupérer l'ID de l'utilisateur actuel
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  const response = await API.post(`/workspace/join/${inviteCode}`, { userId });
  return response.data;
};

// Fonction pour mettre à jour le rôle d'un membre dans un workspace
export const updateWorkspaceMemberRoleMutationFn = async ({
  workspaceId,
  userId,
  role
}: {
  workspaceId: string;
  userId: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
}) => {
  // Ajouter l'ID de l'utilisateur connecté comme paramètre de requête
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const requestingUserId = currentUser?.id;

  const response = await API.patch(
    `/workspace/${workspaceId}/member/${userId}/role?userId=${requestingUserId}`,
    { role }
  );
  return response.data;
};

// Fonction pour supprimer un membre d'un workspace
export const removeMemberFromWorkspaceMutationFn = async ({
  workspaceId,
  memberUserId
}: {
  workspaceId: string;
  memberUserId: string;
}) => {
  // Récupérer l'ID de l'utilisateur actuel
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  console.log("Tentative de suppression du membre:", memberUserId, "du workspace:", workspaceId);

  try {
    const response = await API.delete(
      `/workspace/${workspaceId}/member/${memberUserId}?userId=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la suppression du membre:", error);
    throw error;
  }
};
export const getDevelopersQueryFn = async (): Promise<{ developers: any[] }> => {
  const response = await API.get("/user/developers");
  return response.data;
};
export const getProjectNamesQueryFn = async (): Promise<{
  projects: { _id: string; name: string }[];
}> => {
  const response = await API.get("/project/names");
  return response.data;
};
// Créer une notification

const API_URL = "http://localhost:3000";

export const createNotification = async (notificationData: {
  userId: string;
  projectId: string;
  message: string;
}) => {
  const response = await axios.post(`${API_URL}/notifications`, notificationData);
  return response.data;
};
export const getNotificationsQueryFn = async (userId: string): Promise<{ notifications: any[] }> => {
  const response = await axios.get(`${API_URL}/notifications?userId=${userId}`);
  return response.data;
};
export const markNotificationAsRead = async (notificationId: string) => {
  const response = await axios.patch(
    `${API_URL}/notifications/${notificationId}/read`
  );
  return response.data;
};

export const updateProfileMutationFn = async (data: {
  currentEmail: string;
  name: string;
  newEmail: string;
}) => {
  const response = await API.post("/user/updateProfile", data);
  return response.data;
};



export const updatePasswordMutationFn = async (data: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  const response = await API.post("/user/updatePassword", data);
  return response.data;
};

//a
export const forgotPasswordMutationFn = async (email: string) => {
  const response = await API.post("/user/forgot-password", { email });
  return response.data;
};

// Pour réinitialiser le mot de passe via le token
export const sendPasswordResetEmail = async ({ resetToken, newPassword }: { resetToken: string, newPassword: string }) => {
  const response = await API.post(`/user/reset-password/${resetToken}`, { newPassword });
  return response.data;
};
export const resetPasswordMutationFn = async ({
  resetToken,
  newPassword
}: {
  resetToken: string;
  newPassword: string
}) => {
  const response = await API.post(`/user/reset-password/${resetToken}`, { newPassword });
  return response.data;
};

// Récupérer un projet par ID
// Fonction pour récupérer les détails d'un projet
export const getProjectByIdQueryFn = async ({
  projectId,
  workspaceId
}: {
  projectId: string;
  workspaceId: string;
}): Promise<ProjectResponseType> => {
  console.log(`Fetching project with ID ${projectId} from workspace ${workspaceId}`);

  try {
    const response = await API.get(
      `/project/workspace/${workspaceId}/project/${projectId}`
    );
    console.log("Project data received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};



// Mettre à jour un projet
export const updateProjectMutationFn = async ({
  workspaceId,
  projectId,
  data,
}: {
  workspaceId: string;
  projectId: string;
  data: any;
}): Promise<{ project: { _id: string; name: string; description: string } }> => {
  console.log(`Updating project with ID ${projectId}`, data);

  try {
    const response = await API.put(
      `/project/${projectId}`,
      data
    );
    console.log("Project update response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

//export const getProjectByIdQueryFn = async ({
//  workspaceId,
//  projectId,
//}: ProjectByIdPayloadType): Promise<ProjectResponseType> => {
//  const response = await API.get(
//   `/project/${projectId}/workspace/${workspaceId}`
// );
// return response.data;
//};
export const searchProjectsQueryFn = async (
  keyword: string,
  workspaceId?: string
): Promise<{ projects: { _id: string; name: string }[] }> => {
  let url = `/project/search?keyword=${encodeURIComponent(keyword)}`;
  if (workspaceId) {
    url += `&workspaceId=${workspaceId}`;
  }
  const response = await API.get(url);
  return response.data;
};

// Fonction pour organiser une réunion et envoyer des invitations
export const organizeMeetingMutationFn = async ({
  workspaceId,
  data
}: {
  workspaceId: string;
  data: {
    title: string;
    date: string;
    time: string;
    duration: number;
    description?: string;
    timezone: string;
  }
}) => {
  const response = await API.post(`/workspace/${workspaceId}/meeting`, data);
  return response.data;
};

export const getDeveloperRecommendationsQueryFn = async (projectId: string) => {
  try {
    const response = await API.get(`/project/${projectId}/recommendations`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des recommandations:", error);
    throw new Error("Erreur lors de la récupération des recommandations");
  }
};
export const getProjectPdfUrl = (projectId: string): string => {
  return `${API.defaults.baseURL}/project/${projectId}/pdf`;
};

export interface SummaryWithNames {
  total: number;
  summary: Record<string, number>;
  names: Record<string, string[]>;
}

export const fetchSummaryWithNames = async (): Promise<SummaryWithNames> => {
  const { data } = await axios.get<SummaryWithNames>('http://localhost:3000/api/summary');
  return data;
};