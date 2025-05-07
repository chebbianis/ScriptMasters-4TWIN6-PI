import WorkspaceForm from "./create-workspace-form";
import useCreateWorkspaceDialog from "@/hooks/use-create-workspace-dialog";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
const CreateWorkspaceDialog = () => {
  const { open, onClose } = useCreateWorkspaceDialog();

  return (
    <Dialog modal={true} open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl !p-0 overflow-hidden border-0">
        <DialogTitle>Create Workspace</DialogTitle>
        <DialogDescription>
          Fill in the details below to create a new workspace.
        </DialogDescription>
        <WorkspaceForm {...{ onClose }} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;
