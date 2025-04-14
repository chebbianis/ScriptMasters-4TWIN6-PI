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
        // Vérifier si l'utilisateur tente de changer son propre rôle (vérification côté client)
        const currentUserId = user?.id;

        // Comparer explicitement les chaînes de caractères
        if (String(userId) === String(currentUserId)) {
            toast({
                title: "Action non autorisée",
                description: "Vous ne pouvez pas modifier votre propre rôle",
                variant: "destructive",
            });
            return;
        }

        changeRoleMutate(
            { workspaceId, userId, role: newRole as any },
            {
                onSuccess: () => {
                    toast({
                        title: "Rôle mis à jour",
                        description: "Le rôle du membre a été modifié avec succès",
                    });

                    queryClient.invalidateQueries({
                        queryKey: ["members", workspaceId],
                    });
                },
                onError: (error: any) => {
                    toast({
                        title: "Erreur",
                        description: error.response?.data?.error || "Impossible de modifier le rôle",
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
                        title: "Membre supprimé",
                        description: "Le membre a été retiré du workspace avec succès",
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
                        title: "Erreur",
                        description: error.response?.data?.error || "Impossible de supprimer le membre",
                        variant: "destructive",
                    });
                },
            }
        );
    };

    if (isLoading) {
        return <div>Chargement des membres...</div>;
    }

    return (
        <>
            <div className="space-y-4">
                {data?.members?.length === 0 ? (
                    <p>Aucun membre dans ce workspace</p>
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
                                            <SelectValue placeholder="Sélectionner un rôle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Administrateur</SelectItem>
                                            <SelectItem value="PROJECT_MANAGER">Chef de projet</SelectItem>
                                            <SelectItem value="DEVELOPER">Développeur</SelectItem>
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
                title="Supprimer un membre"
                description="Êtes-vous sûr de vouloir retirer ce membre du workspace ? Cette action est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
            />
        </>
    );
};

export default MembersList; 