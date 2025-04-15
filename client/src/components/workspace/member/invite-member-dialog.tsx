import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InviteMemberForm from "../invite-member-form";

interface InviteMemberDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const InviteMemberDialog = ({ isOpen, onClose }: InviteMemberDialogProps) => {
    // Empêcher la fermeture automatique lors de la sélection d'un email
    const handleCloseDialog = (open: boolean) => {
        // Ne fermer que si l'utilisateur clique explicitement pour fermer
        if (!open) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Inviter un membre</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <InviteMemberForm onComplete={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InviteMemberDialog; 