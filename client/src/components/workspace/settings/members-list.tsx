import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { updateWorkspaceMemberRoleMutationFn, removeMemberFromWorkspaceMutationFn } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";

const MembersList = () => {
    const workspaceId = useWorkspaceId();
    const { data, isLoading } = useGetWorkspaceMembers(workspaceId);
    const queryClient = useQueryClient();
    const { user, hasPermission } = useAuthContext();
    const canRemoveMember = hasPermission(Permissions.REMOVE_MEMBER);

    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const { mutate: changeRoleMutate } = useMutation({
        mutationFn: updateWorkspaceMemberRoleMutationFn,
    });

    const { mutate: removeMemberMutate, isPending: isRemoving } = useMutation({
        mutationFn: removeMemberFromWorkspaceMutationFn,
    });

    const handleRoleChange = (userId: string, newRole: string) => {
        // Check if the user is trying to change their own role (client-side verification)
        const currentUserId = user?.id;

        // Compare strings explicitly
        if (String(userId) === String(currentUserId)) {
            toast({
                title: "Action not allowed",
                description: "You cannot modify your own role",
                variant: "destructive",
            });
            return;
        }

        changeRoleMutate(
            { workspaceId, userId, role: newRole as any },
            {
                onSuccess: () => {
                    toast({
                        title: "Role updated",
                        description: "The member's role has been successfully modified",
                    });

                    queryClient.invalidateQueries({
                        queryKey: ["members", workspaceId],
                    });
                },
                onError: (error: any) => {
                    toast({
                        title: "Error",
                        description: error.response?.data?.error || "Unable to modify the role",
                        variant: "destructive",
                    });
                },
            }
        );
    };

    const openRemoveDialog = (userId: string) => {
        setMemberToRemove(userId);
        setConfirmDialogOpen(true);
    };

    const handleRemoveMember = () => {
        if (!memberToRemove) return;

        removeMemberMutate(
            { workspaceId, memberUserId: memberToRemove },
            {
                onSuccess: () => {
                    toast({
                        title: "Member removed",
                        description: "The member has been successfully removed from the workspace",
                        variant: "success",
                    });

                    queryClient.invalidateQueries({
                        queryKey: ["members", workspaceId],
                    });

                    setConfirmDialogOpen(false);
                    setMemberToRemove(null);
                },
                onError: (error: any) => {
                    toast({
                        title: "Error",
                        description: error.response?.data?.error || "Unable to remove the member",
                        variant: "destructive",
                    });
                },
            }
        );
    };

    if (isLoading) {
        return <div>Loading members...</div>;
    }

    return (
        <>
            <div className="space-y-4">
                {data?.members?.length === 0 ? (
                    <p>No members in this workspace</p>
                ) : (
                    data?.members?.map((member: any) => (
                        <Card key={member.userId}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={member.user.profilePicture} />
                                        <AvatarFallback>
                                            {member.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-medium">{member.user.name}</h4>
                                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Select
                                        defaultValue={member.role}
                                        onValueChange={(value) => handleRoleChange(member.userId, value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Administrator</SelectItem>
                                            <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                                            <SelectItem value="DEVELOPER">Developer</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {canRemoveMember && member.userId !== user?.id && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => openRemoveDialog(member.userId)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmDialogOpen}
                isLoading={isRemoving}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={handleRemoveMember}
                title="Remove member"
                description="Are you sure you want to remove this member from the workspace? This action is irreversible."
                confirmText="Remove"
                cancelText="Cancel"
            />
        </>
    );
};

export default MembersList; 