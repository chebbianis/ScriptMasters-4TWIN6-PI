import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Trash2, Pencil, FolderX, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProjectDetails = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);

  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:3000/project/names");
        setProjects(Array.isArray(response.data.projects) ? response.data.projects : []);
      } catch (err) {
        console.error("Erreur API :", err);
        setError("Erreur lors de la récupération des projets");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/project/${id}`);
      setProjects((prev) => prev.filter((project) => project._id !== id));
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès",
        variant: "default",
      });
    } catch (err) {
      console.error("Erreur de suppression :", err);
      toast({
        title: "Erreur",
        description: "Échec de la suppression du projet",
        variant: "destructive",
      });
    }
  };

  const handlePredict = async () => {
    try {
      const response = await axios.get("http://localhost:3000/predict/predict");
      setPredictions(response.data.predictions || []);
      setShowPredictions(true);
    } catch (error) {
      console.error("Erreur lors de la prédiction :", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les prédictions.",
        variant: "destructive",
      });
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex justify-center my-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );

  if (error)
    return (
      <div className="text-center py-10 text-red-500">
        <Trash2 className="w-10 h-10 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Liste des projets</h2>
          <AlertDialog open={showPredictions} onOpenChange={setShowPredictions}>
            <Button
              onClick={handlePredict}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Prédire l’activité
            </Button>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Résultat des prédictions</AlertDialogTitle>
                <AlertDialogDescription>
                  Voici l’état d’activité des projets détecté par le modèle.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="max-h-60 overflow-y-auto mt-4 space-y-2">
  {predictions.length > 0 ? (
    predictions.map((prediction) => (
      <div
        key={prediction.projectId}
        className="flex justify-between items-center border-b pb-1"
      >
        <span className="font-medium">{prediction.projectName}</span>
        <div className="flex items-center space-x-2">
          <span
            className={
              prediction.engagementLevel === 1 ? "text-green-600" : "text-gray-500"
            }
          >
            {prediction.engagementLevel === 1 ? "Active" : "Inactive"}
          </span>
          <span
            className={
              prediction.hasDocumentation === 1 ? "text-blue-600" : "text-red-600"
            }
          >
            {prediction.hasDocumentation === 1 ? "Has Documentation" : "No Documentation"}
          </span>
          <span
            className={
              prediction.likelySuccess === 1 ? "text-green-600" : "text-yellow-500"
            }
          >
            {prediction.likelySuccess === 1 ? "Likely to Succeed" : "Likely to Fail"}
          </span>
        </div>
      </div>
    ))
  ) : (
    <p className="text-gray-500 text-sm">Aucune prédiction disponible</p>
  )}
</div>

              <AlertDialogFooter>
                <AlertDialogCancel>Fermer</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </span>
            <Input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead className="text-right">Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project._id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {project.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <a
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/project/workspace/${workspaceId}/project/${project._id}`);
                        }}
                        className="font-medium hover:underline cursor-pointer"
                      >
                        {project.name}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {project.createdAt &&
                      new Date(project.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(`/workspace/${workspaceId}/project/${project._id}/edit`)
                        }
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera définitivement le projet "
                              {project.name}" et toutes ses données associées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(project._id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <FolderX className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p>Aucun projet trouvé</p>
            <p className="text-sm">
              Essayez une autre recherche ou créez un nouveau projet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDetails;
