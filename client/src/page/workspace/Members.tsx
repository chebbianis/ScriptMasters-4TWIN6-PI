import { Separator } from "@/components/ui/separator";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Users,
  Shield,
  Briefcase,
  Code,
  Mail,
  Loader2,
  UserCheck
} from "lucide-react";
import { useState } from "react";
import InviteMemberDialog from "@/components/workspace/member/invite-member-dialog";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions } from "@/constant";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Members = () => {
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useGetWorkspaceMembers(workspaceId);
  const { hasPermission } = useAuthContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const canInviteMembers = hasPermission(Permissions.INVITE_MEMBER);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "PROJECT_MANAGER":
        return "default";
      case "DEVELOPER":
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "PROJECT_MANAGER":
        return "Chef de projet";
      case "DEVELOPER":
        return "Développeur";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-4 w-4 mr-1" />;
      case "PROJECT_MANAGER":
        return <Briefcase className="h-4 w-4 mr-1" />;
      case "DEVELOPER":
        return <Code className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Filtrer les membres en fonction de la recherche et du filtre de rôle
  const filteredMembers = data?.members?.filter((member: any) => {
    const matchesSearch =
      member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Compter les membres par rôle
  const memberStats = data?.members?.reduce((acc: any, member: any) => {
    if (!acc[member.role]) {
      acc[member.role] = 0;
    }
    acc[member.role]++;
    return acc;
  }, {});

  return (
    <div className="w-full h-auto py-2">
      <div className="flex items-center justify-between">
        <WorkspaceHeader />
        {canInviteMembers && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Inviter un membre
          </Button>
        )}
      </div>
      <Separator className="my-4" />

      <main>
        <div className="container py-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">Membres du workspace</h2>
              <p className="text-muted-foreground mt-1">
                Gérez les membres qui ont accès à ce workspace
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-medium">
                {data?.members?.length || 0} membres
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Shield className="h-10 w-10 text-red-500 mr-4" />
                    <div>
                      <p className="text-lg font-medium">{memberStats?.ADMIN || 0}</p>
                      <p className="text-muted-foreground">Administrateurs</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Briefcase className="h-10 w-10 text-blue-500 mr-4" />
                    <div>
                      <p className="text-lg font-medium">{memberStats?.PROJECT_MANAGER || 0}</p>
                      <p className="text-muted-foreground">Chefs de projet</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Code className="h-10 w-10 text-green-500 mr-4" />
                    <div>
                      <p className="text-lg font-medium">{memberStats?.DEVELOPER || 0}</p>
                      <p className="text-muted-foreground">Développeurs</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="all" className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-4">
                  <TabsList>
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="admins">Administrateurs</TabsTrigger>
                    <TabsTrigger value="managers">Chefs de projet</TabsTrigger>
                    <TabsTrigger value="developers">Développeurs</TabsTrigger>
                  </TabsList>

                  <div className="flex w-full sm:w-auto space-x-2">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un membre..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filtrer par rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les rôles</SelectItem>
                        <SelectItem value="ADMIN">Administrateurs</SelectItem>
                        <SelectItem value="PROJECT_MANAGER">Chefs de projet</SelectItem>
                        <SelectItem value="DEVELOPER">Développeurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="all">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers?.map((member: any) => renderMemberCard(member))}
                  </div>
                </TabsContent>

                <TabsContent value="admins">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers?.filter((m: any) => m.role === "ADMIN").map((member: any) => renderMemberCard(member))}
                  </div>
                </TabsContent>

                <TabsContent value="managers">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers?.filter((m: any) => m.role === "PROJECT_MANAGER").map((member: any) => renderMemberCard(member))}
                  </div>
                </TabsContent>

                <TabsContent value="developers">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers?.filter((m: any) => m.role === "DEVELOPER").map((member: any) => renderMemberCard(member))}
                  </div>
                </TabsContent>
              </Tabs>

              {filteredMembers?.length === 0 && (
                <div className="text-center py-16 px-4 bg-muted/20 rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun membre trouvé</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Aucun membre ne correspond à vos critères de recherche.
                    Essayez de modifier vos filtres ou d'inviter de nouveaux membres.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <InviteMemberDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );

  // Fonction pour rendre une carte de membre
  function renderMemberCard(member: any) {
    const user = member.user || { name: "Utilisateur inconnu" };
    const avatarFallback = getAvatarFallbackText(user.name);
    const avatarColor = getAvatarColor(user.name);

    return (
      <Card key={member.userId} className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Avatar className="h-14 w-14 ring-2 ring-background border border-border">
              <AvatarImage src={user.profilePicture} />
              <AvatarFallback className={avatarColor}>
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-medium text-lg truncate">{user.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center">
                  {getRoleIcon(member.role)}
                  {getRoleLabel(member.role)}
                </Badge>

                <div className="flex items-center text-xs text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  <span>Ajouté il y a 3j</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default Members;
