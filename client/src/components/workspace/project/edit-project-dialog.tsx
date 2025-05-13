import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProjectType } from "@/types/api.type";
import { useState } from "react";
import EditProjectForm from "./edit-project-form";

const EditProjectDialog = (props: { project?: ProjectType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const projectId = props.project?._id;

  console.log("Edit Project Dialog - Project data:", props.project);
  console.log("Edit Project Dialog - Project ID:", projectId);

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="mt-1.5" asChild>
          <button className="text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-50">
            <span className="text-lg">✏️</span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl p-6 border-0">
          <EditProjectForm
            project={props.project}
            projectId={projectId}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditProjectDialog;
