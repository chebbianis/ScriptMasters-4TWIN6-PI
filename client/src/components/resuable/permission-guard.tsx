import { FC, ReactNode } from "react";
import { useAuthContext } from "@/context/auth-provider";

interface PermissionsGuardProps {
  children: ReactNode;
  permissions?: string[];
  requiredPermission?: string;
  showMessage?: boolean;
}

const PermissionsGuard: FC<PermissionsGuardProps> = ({
  children,
  permissions = [],
  requiredPermission,
  showMessage = false
}) => {
  const { hasPermission } = useAuthContext();

  // Support pour les deux façons de passer les permissions
  const permissionArray = requiredPermission
    ? [requiredPermission]
    : (Array.isArray(permissions) ? permissions : []);

  // Vérifie si l'utilisateur a au moins une des permissions requises
  const hasRequiredPermission = permissionArray.some(permission =>
    hasPermission(permission)
  );

  if (!hasRequiredPermission) {
    return showMessage ? (
      <div className="text-center p-4 text-muted-foreground">
        Vous n'avez pas les permissions nécessaires.
      </div>
    ) : null;
  }

  return <>{children}</>;
};

export default PermissionsGuard;
