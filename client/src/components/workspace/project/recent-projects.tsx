import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import ProjectAnalytics from "@/components/workspace/project/project-analytics";
import ProjectHeader from "@/components/workspace/project/project-header";
import TaskTable from "@/components/workspace/task/task-table";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";

interface Project {
  _id: string;
  name: string;
}

const ProjectDetails = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { workspaceId } = useParams(); 
  

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!workspaceId) {
          setError("Workspace ID is required");
          setLoading(false);
          return;
        }
        const response = await axios.get(`http://localhost:3000/project/names?workspaceId=${workspaceId}`);
        setProjects(Array.isArray(response.data.projects) ? response.data.projects : []);
      } catch (err) {
        console.error("Erreur API :", err);
        setError("Erreur lors de la récupération des projets");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [workspaceId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) return;
    
    try {
      await axios.delete(`http://localhost:3000/project/${id}`);
      setProjects((prev) => prev.filter((project) => project._id !== id));
    } catch (err) {
      console.error("Erreur de suppression :", err);
      alert("Échec de la suppression du projet.");
    }
  };

  if (loading) return <p>Chargement des projets...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="w-full space-y-6 py-4 md:pt-3">
      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Liste des projets :</h2>
        {projects.length > 0 ? (
          <ul>
            {projects.map((project) => (
              <li
                key={project._id}
                className="py-2 flex justify-between items-center"
              >
                {/* Lien vers la page des détails du projet */}
                <Link
  to={`/workspace/${workspaceId}/project/${project._id}`}
  className="text-blue-600 hover:underline"
>
  {project.name}
</Link>

                <div className="flex gap-2">
                  {/* Bouton Modifier */}
                  <button
    onClick={() => navigate(`/workspace/${workspaceId}/project/${project._id}/edit`)}
    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
  >
    Modifier
  </button>
                  {/* Bouton Supprimer */}
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun projet disponible.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
