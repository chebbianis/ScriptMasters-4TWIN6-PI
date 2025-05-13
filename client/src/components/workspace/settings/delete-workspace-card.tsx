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
      title: "Deletion in progress",
      description: "Please wait while we delete the workspace...",
    });

    mutate(workspaceId, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["userWorkspaces"],
        });

        toast({
          title: "Workspace deleted",
          description: "The workspace has been successfully deleted",
          variant: "success",
        });

        setTimeout(() => {
          onCloseDialog();
          if (data.currentWorkspace) {
            navigate(`/workspace/${data.currentWorkspace}`);
          } else {
            // If no other workspace is available
            navigate('/');
          }
        }, 100);
      },
      onError: (error) => {
        toast({
          title: "Deletion error",
          description: error.message || "Unable to delete the workspace",
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
            Delete Workspace
          </h1>
        </div>

        <PermissionsGuard
          showMessage
          requiredPermission={Permissions.DELETE_WORKSPACE}
        >
          <div className="flex flex-col items-start justify-between py-0">
            <div className="flex-1 mb-2">
              <p className="text-muted-foreground">
                Deleting a workspace is a permanent action and cannot be undone.
                Once you delete a workspace, all associated data, including
                projects, tasks, and member roles, will be permanently deleted.
                Please proceed with caution.
              </p>
            </div>
            <Button
              className="shrink-0 flex place-self-end h-[40px] mt-4"
              variant="destructive"
              onClick={onOpenDialog}
              disabled={isPending}
            >
              {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Delete Workspace
            </Button>
          </div>
        </PermissionsGuard>
      </div>

      <ConfirmDialog
        isOpen={open}
        isLoading={isPending}
        onClose={onCloseDialog}
        onConfirm={handleConfirm}
        title={`Delete ${workspace?.name}`}
        description={`Are you sure you want to delete this workspace? This action cannot be undone and all data will be lost.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default DeleteWorkspaceCard;
