import { useAuthContext } from "@/context/auth-provider";
import InviteMemberForm from "../invite-member-form";
import InviteCodeCard from "../invite-code-card";
import MembersList from "./members-list";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { useEffect } from "react";

const MembersSettings = () => {
    const { hasPermission } = useAuthContext();

    // Déboguer l'appel API des membres
    const workspaceId = useWorkspaceId();
    const { data, error } = useGetWorkspaceMembers(workspaceId);

    useEffect(() => {
        console.log("Workspace ID:", workspaceId);
        console.log("Membres data:", data);
        console.log("Membres error:", error);
    }, [workspaceId, data, error]);


    // Ensuite utilisez cette fonction à la place
    const canViewMembers = hasPermission('VIEW_MEMBERS' as any);
    const canInviteMembers = hasPermission('INVITE_MEMBER' as any);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Membres du workspace</h3>
                <p className="text-sm text-muted-foreground">
                    Les membres du workspace peuvent voir et rejoindre tous les projets, tâches et créer de nouvelles tâches dans le workspace.
                </p>
            </div>

            {/* Section d'invitation */}
            {canInviteMembers && (
                <div className="space-y-4">
                    <h4 className="text-md font-medium">Inviter des membres</h4>
                    <InviteMemberForm />
                    <InviteCodeCard />
                </div>
            )}

            {/* Liste des membres */}
            {canViewMembers && (
                <div className="space-y-4">
                    <h4 className="text-md font-medium">Membres actuels</h4>
                    <MembersList />
                </div>
            )}

            {/* Message si aucune permission */}
            {!canViewMembers && !canInviteMembers && (
                <div className="p-4 border rounded-md bg-muted">
                    <p className="text-center text-muted-foreground">
                        Vous n'avez pas les permissions nécessaires pour voir cette section
                    </p>
                </div>
            )}
        </div>
    );
};

export default MembersSettings; 