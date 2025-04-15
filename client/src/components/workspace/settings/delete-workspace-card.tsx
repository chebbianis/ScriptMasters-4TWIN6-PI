import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Button } from "@/components/ui/button";
import { Permissions } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import useConfirmDialog from "@/hooks/use-confirm-dialog";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { deleteWorkspaceMutationFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DeleteWorkspaceCard = () => {
  const { workspace } = useAuthContext();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { open, onOpenDialog, onCloseDialog } = useConfirmDialog();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteWorkspaceMutationFn,
  });

  const handleConfirm = () => {
    toast({
      title: "Suppression en cours",
      description: "Veuillez patienter pendant que nous supprimons le workspace...",
    });

    mutate(workspaceId, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["userWorkspaces"],
        });

        toast({
          title: "Workspace supprimé",
          description: "Le workspace a été supprimé avec succès",
          variant: "success",
        });

        setTimeout(() => {
          onCloseDialog();
          if (data.currentWorkspace) {
            navigate(`/workspace/${data.currentWorkspace}`);
          } else {
            // Si aucun autre workspace n'est disponible
            navigate('/');
          }
        }, 100);
      },
      onError: (error) => {
        toast({
          title: "Erreur de suppression",
          description: error.message || "Impossible de supprimer le workspace",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      <div className="w-full">
        <div className="mb-5 border-b">
          <h1
            className="text-[17px] tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1.5
           text-center sm:text-left"
          >
            Supprimer le Workspace
          </h1>
        </div>

        <PermissionsGuard
          showMessage
          requiredPermission={Permissions.DELETE_WORKSPACE}
        >
          <div className="flex flex-col items-start justify-between py-0">
            <div className="flex-1 mb-2">
              <p className="text-muted-foreground">
                La suppression d'un workspace est une action permanente et ne peut pas être annulée.
                Une fois que vous supprimez un workspace, toutes les données associées, y compris
                les projets, les tâches et les rôles des membres, seront définitivement supprimées.
                Veuillez procéder avec prudence.
              </p>
            </div>
            <Button
              className="shrink-0 flex place-self-end h-[40px] mt-4"
              variant="destructive"
              onClick={onOpenDialog}
              disabled={isPending}
            >
              {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer le Workspace
            </Button>
          </div>
        </PermissionsGuard>
      </div>

      <ConfirmDialog
        isOpen={open}
        isLoading={isPending}
        onClose={onCloseDialog}
        onConfirm={handleConfirm}
        title={`Supprimer ${workspace?.name}`}
        description={`Êtes-vous sûr de vouloir supprimer ce workspace ? Cette action ne peut pas être annulée et toutes les données seront perdues.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </>
  );
};

export default DeleteWorkspaceCard;
