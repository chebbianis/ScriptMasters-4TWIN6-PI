// LogoutDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { Loader } from "lucide-react";
import { useAuthContext } from "@/context/auth-provider";

const LogoutDialog = (props: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isOpen, setIsOpen } = props;
  const { logout, isLoading: isAuthLoading } = useAuthContext();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>
            This will end your current session. You'll need to log in again to
            access your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isAuthLoading}
            type="button"
            onClick={handleLogout}
          >
            {isAuthLoading && <Loader className="animate-spin mr-2" />}
            Confirm Logout
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogoutDialog;