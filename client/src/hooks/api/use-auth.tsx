import { useAuthContext } from "@/context/auth-provider";

// Nouvelle implémentation utilisant le contexte plutôt que l'API
const useAuth = () => {
  const { user, isLoading, error } = useAuthContext();

  return {
    data: user ? { user } : undefined,
    error,
    isLoading,
    isFetching: false,
    refetch: () => { }
  };
};

export default useAuth;