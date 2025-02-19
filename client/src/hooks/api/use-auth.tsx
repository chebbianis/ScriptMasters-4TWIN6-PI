import { getCurrentUserQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useAuth = () => {
  // Utilisateur de test simulé
  const mockUser = {
    user: {
      _id: "test-user-id",
      email: "test@example.com",
      name: "Utilisateur Test",
      currentWorkspace: {
        _id: "test-workspace-id",
        name: "Workspace Test",
        role: "ADMIN",
        members: [],
        projects: [],
      },
      permissions: ["CREATE_TASK", "DELETE_TASK", "UPDATE_TASK", "VIEW_TASK"]
    }
  };

  return {
    data: mockUser,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: () => { },
  };
};

export default useAuth;
