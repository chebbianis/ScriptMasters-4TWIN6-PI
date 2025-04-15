/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState } from "react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { WorkspaceType } from "@/types/api.type";
import useGetWorkspaceQuery from "@/hooks/api/use-get-workspace";
import { useQueryClient } from "@tanstack/react-query";
import { logoutMutationFn } from "@/lib/api";

type AuthResponseType = {
  _id?: string;
  profilePicture?: string;
  currentWorkspace?: string | null;
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: Date;
  WorkspaceId?: string | null;
  accessToken: string;
  refreshToken: string;
};

type AuthContextType = {
  user: AuthResponseType | null;
  workspace?: WorkspaceType;
  hasPermission: (permission: string) => boolean;
  error: any;
  isLoading: boolean;
  isFetching: boolean;
  workspaceLoading: boolean;
  refetchWorkspace: () => void;
  login: (userData: AuthResponseType) => void;
  logout: () => void;
  updateUser: (updatedUser: AuthResponseType) => void;
  hasWorkspaceRole: (workspaceId: string, roles: string[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const [user, setUser] = useState<AuthResponseType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    data: workspaceData,
    isLoading: workspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useGetWorkspaceQuery(workspaceId);

  const workspace = workspaceData?.workspace;

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser) as AuthResponseType;
          setUser(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (workspaceError?.errorCode === "ACCESS_UNAUTHORIZED") {
      logout();
    }
  }, [workspaceError]);

  const login = (userData: AuthResponseType) => {
    localStorage.setItem("accessToken", userData.accessToken);
    localStorage.setItem("refreshToken", userData.refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoading(false);
  };

  // <-- New updateUser function
  const updateUser = (updatedUser: AuthResponseType) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = async () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        throw new Error("Aucun utilisateur connecté");
      }

      const userData: AuthResponseType = JSON.parse(storedUser);
      const email = userData.email;
      console.log("email :" + email);

      if (!email) {
        throw new Error("Email utilisateur non trouvé");
      }

      await logoutMutationFn(email);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      queryClient.clear();
      window.location.href = '/';
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (user?.role === "ADMIN") return true;

    const memberPermissions = workspace?.members?.find(
      (m: any) => m.userId === user?.id
    )?.permissions || [];

    return memberPermissions.includes(permission);
  };

  const hasWorkspaceRole = (
    workspaceId: string,
    roles: string[]
  ): boolean => {
    const membership = workspace?.members?.find(
      (m: { workspaceId: string; role: string }) =>
        m.workspaceId === workspaceId && roles.includes(m.role)
    );
    return !!membership;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        hasPermission,
        error: workspaceError,
        isLoading,
        isFetching: false,
        workspaceLoading,
        refetchWorkspace,
        login,
        logout,
        updateUser, // Added updateUser function here
        hasWorkspaceRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
