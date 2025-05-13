import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateTaskForm from "./create-task-form";

interface CreateTaskDialogProps {
  projectId?: string;
  refreshTaskList?: () => void;
}

const CreateTaskDialog = ({ projectId, refreshTaskList }: CreateTaskDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Enhanced close handler with multiple refresh calls
  const handleClose = () => {
    setIsOpen(false);
    
    if (refreshTaskList) {
      // Immediate refresh
      refreshTaskList();
      
      // Delayed refresh to ensure everything is updated
      setTimeout(() => {
        refreshTaskList();
      }, 300);
    }
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && refreshTaskList) {
        // When dialog is closed, trigger the enhanced close handler
        handleClose();
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-auto my-5 border-0">
        <DialogTitle>Create New Task</DialogTitle>
        <DialogDescription>
          Fill in the details below to create a new task.
        </DialogDescription>
        <CreateTaskForm 
          projectId={projectId} 
          onClose={handleClose}
          refreshTaskList={refreshTaskList}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
