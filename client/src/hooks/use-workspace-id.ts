import { useParams } from "react-router-dom";

/**
 * Hook pour récupérer l'ID du workspace depuis les paramètres de route
 * @returns {string} ID du workspace ou une chaîne vide si non disponible
 */
const useWorkspaceId = (): string => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  // Vérifier si l'ID est défini et non vide
  if (!workspaceId) {
    // Log plus discret ou simplement retourner une chaîne vide
    console.debug("ID de workspace non disponible dans la route actuelle");
    return "";
  }

  return workspaceId;
};

export default useWorkspaceId;
