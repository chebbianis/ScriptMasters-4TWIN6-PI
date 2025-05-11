import { useAuthContext } from "@/context/auth-provider";

export const useUser = () => {
    const { user } = useAuthContext();

    if (!user) {
        throw new Error("User must be authenticated to use this hook");
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.WorkspaceId
    };
};