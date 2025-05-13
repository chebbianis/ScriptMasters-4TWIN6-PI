import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ScheduleMeetingForm from "./schedule-meeting-form";

interface ScheduleMeetingDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const ScheduleMeetingDialog = ({ isOpen, onClose }: ScheduleMeetingDialogProps) => {
    // Prevent automatic closure when interacting with the form
    const handleCloseDialog = (open: boolean) => {
        // Only close if the user explicitly clicks to close
        if (!open) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Programmer une réunion</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <ScheduleMeetingForm onComplete={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleMeetingDialog; 