export const isAuthRoute = (pathname: string): boolean => {
  return Object.values(AUTH_ROUTES).includes(pathname);
};

export const AUTH_ROUTES = {
  SIGN_IN: "/",
  SIGN_UP: "/sign-up",
  GOOGLE_OAUTH_CALLBACK: "/google/oauth/callback",
  AUTH_CALLBACK: "/auth/callback",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
};

export const PROTECTED_ROUTES = {
  WORKSPACE: "/workspace/:workspaceId",
  TASKS: "/workspace/:workspaceId/tasks",
  MEMBERS: "/workspace/:workspaceId/members",
  SETTINGS: "/workspace/:workspaceId/settings",
  PROJECT_DETAILS: "/project/workspace/:workspaceId/project/:projectId",
  PROFIL: "/workspace/:workspaceId/profil",
  PROJECT_EDIT: "/workspace/:workspaceId/project/:projectId/edit",
  PROJECT_QR: "/workspace/:workspaceId/project/:projectId/qr", 
  CLASSIFICATION: "/workspace/:workspaceId/classification",

};

export const BASE_ROUTE = {
  INVITE_URL: "/invite/workspace/:inviteCode/join",
};
