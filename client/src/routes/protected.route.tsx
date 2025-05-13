import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAuthContext } from "@/context/auth-provider";

const ProtectedRoute = () => {
  const { data: authData, isLoading, error } = useAuth();
  const { logout } = useAuthContext();
  const user = authData?.user;

  useEffect(() => {
    if (error?.response?.status === 401) {
      logout();
    }
  }, [error, logout]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;