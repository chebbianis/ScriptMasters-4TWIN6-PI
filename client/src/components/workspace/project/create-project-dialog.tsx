import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CreateProjectForm from "@/components/workspace/project/create-project-form";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";

const CreateProjectDialog = () => {
  const { open, onClose } = useCreateProjectDialog();

  return (
    <div>
      <Dialog modal={true} open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg border-0">
          {/* ✅ Ajout du titre obligatoire */}
          <DialogTitle>Créer un nouveau projet</DialogTitle>

          {/* ✅ Ajout d'une description (optionnel) */}
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer un projet.
          </DialogDescription>

          <CreateProjectForm {...{ onClose }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateProjectDialog;
