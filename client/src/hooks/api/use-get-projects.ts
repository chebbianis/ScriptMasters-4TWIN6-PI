import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const useGetProjectsInWorkspaceQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { projects: [] };

      const response = await axios.get(`http://localhost:3000/project/workspaces/${workspaceId}/all`);
      
      console.log("🔍 Données brutes reçues pour workspace:", response.data); // Ajoute ce log
      
      return response.data;
    },
    enabled: !!workspaceId, // Exécuter seulement si workspaceId est valide
  });
};

export default useGetProjectsInWorkspaceQuery;
