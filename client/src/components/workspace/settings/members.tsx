import { useAuthContext } from "@/context/auth-provider";
import InviteMemberForm from "../invite-member-form";
import InviteCodeCard from "../invite-code-card";
import MembersList from "./members-list";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { useEffect } from "react";

const MembersSettings = () => {
    const { hasPermission } = useAuthContext();

    // Debug API members call
    const workspaceId = useWorkspaceId();
    const { data, error } = useGetWorkspaceMembers(workspaceId);

    useEffect(() => {
        console.log("Workspace ID:", workspaceId);
        console.log("Members data:", data);
        console.log("Members error:", error);
    }, [workspaceId, data, error]);


    // Then use this function instead
    const canViewMembers = hasPermission('VIEW_MEMBERS' as any);
    const canInviteMembers = hasPermission('INVITE_MEMBER' as any);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Workspace members</h3>
                <p className="text-sm text-muted-foreground">
                    Workspace members can view and join all projects, tasks and create new tasks in the workspace.
                </p>
            </div>

            {/* Invitation section */}
            {canInviteMembers && (
                <div className="space-y-4">
                    <h4 className="text-md font-medium">Invite members</h4>
                    <InviteMemberForm />
                    <InviteCodeCard />
                </div>
            )}

            {/* Members list */}
            {canViewMembers && (
                <div className="space-y-4">
                    <h4 className="text-md font-medium">Current members</h4>
                    <MembersList />
                </div>
            )}

            {/* Message if no permission */}
            {!canViewMembers && !canInviteMembers && (
                <div className="p-4 border rounded-md bg-muted">
                    <p className="text-center text-muted-foreground">
                        You don't have the necessary permissions to view this section
                    </p>
                </div>
            )}
        </div>
    );
};

export default MembersSettings; 