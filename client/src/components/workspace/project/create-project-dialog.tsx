import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CreateProjectForm from "@/components/workspace/project/create-project-form";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";

const CreateProjectDialog = () => {
  const { open, onClose } = useCreateProjectDialog();

  return (
    <div>
      <Dialog modal={true} open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg border-0">
          <DialogTitle className="sr-only">Créer un nouveau projet</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire pour créer un nouveau projet dans l'espace de travail
          </DialogDescription>

          <CreateProjectForm {...{ onClose }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateProjectDialog;
