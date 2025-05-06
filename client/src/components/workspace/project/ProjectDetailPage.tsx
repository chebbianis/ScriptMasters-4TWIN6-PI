// ProjectDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProjectByIdQueryFn } from "@/lib/api";

const ProjectDetailPage = () => {
  const { projectId, workspaceId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectDetail = async () => {
      try {
        const data = await getProjectByIdQueryFn({ projectId, workspaceId });
        setProject(data.project);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Erreur lors du chargement du projet");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetail();
  }, [projectId, workspaceId]);

  // Composants réutilisables
  const SectionHeader = ({ children }) => (
    <h2 className="mb-3 text-xs font-semibold uppercase text-gray-500 tracking-wide border-b border-gray-200 pb-2">
      {children}
    </h2>
  );

  const DetailItem = ({ label, value, className }) => (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            {error ? "Erreur de chargement" : "Projet non trouvé"}
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "Le projet demandé n'existe pas ou a été supprimé"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux projets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-start mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 010-1.414l7-7A1 1 0 0111.414 3.293L5.828 8.88H18a1 1 0 110 2H5.828l5.586 5.586A1 1 0 0110 18z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Retour aux projets</span>
          </button>
          
          {project.status && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {project.status === 'active' ? 'Actif' : 'Archivé'}
            </span>
          )}
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.name}
              </h1>
              
              {project.description && (
                <p className="text-gray-600 mb-6">
                  {project.description}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem 
                  label="Date de création" 
                  value={new Date(project.createdAt).toLocaleDateString('fr-FR')} 
                />
                {project.startDate && (
                  <DetailItem
                    label="Date de début"
                    value={new Date(project.startDate).toLocaleDateString('fr-FR')}
                  />
                )}
                {project.deadline && (
                  <DetailItem
                    label="Échéance"
                    value={new Date(project.deadline).toLocaleDateString('fr-FR')}
                    className="text-red-600"
                  />
                )}
              </div>
            </div>

            {/* Équipe */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader>Équipe du projet</SectionHeader>
              <div className="space-y-4">
                {project.projectManager && (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      {project.projectManager.name}
                    </p>
                    <p className="text-sm text-gray-500">Chef de projet</p>
                  </div>
                )}

                {project.users?.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Development Team ({project.users.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {project.users.map((user) => (
                        <div key={user._id} className="space-y-1">
                          <p className="text-gray-900">{user.name}</p>
                          {user.role && (
                            <p className="text-sm text-gray-500">{user.role}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader>Détails supplémentaires</SectionHeader>
              <div className="space-y-4">
                {project.createdBy && (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      Créé par {project.createdBy.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}

                {project.tags?.length > 0 && (
                  <div className="pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;