import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InviteMemberForm from "../invite-member-form";

interface InviteMemberDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const InviteMemberDialog = ({ isOpen, onClose }: InviteMemberDialogProps) => {
    // Prevent automatic closure when selecting an email
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
                    <DialogTitle>Invite a member</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <InviteMemberForm onComplete={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InviteMemberDialog; 