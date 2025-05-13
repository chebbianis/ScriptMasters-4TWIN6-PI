import { Separator } from "@/components/ui/separator";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Loader } from "lucide-react";
import { useState } from "react";
import InviteMemberDialog from "@/components/workspace/member/invite-member-dialog";
import ScheduleMeetingDialog from "@/components/workspace/member/schedule-meeting-dialog";
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
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
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
        return "Administrator";
      case "PROJECT_MANAGER":
        return "Project Manager";
      case "DEVELOPER":
        return "Developer";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    // Supprimé les icônes pour simplifier
    return null;
  };

  // Filter members based on search and role filter
  const filteredMembers = data?.members?.filter((member: any) => {
    const matchesSearch =
      member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Count members by role
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
        <div className="flex gap-2">
          {canInviteMembers && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite member
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsMeetingDialogOpen(true)}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
          >
            <span className="mr-2">📅</span>
            Schedule meeting
          </Button>
        </div>
      </div>
      <Separator className="my-4" />

      <main>
        <div className="container py-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">Workspace members</h2>
              <p className="text-muted-foreground mt-1">
                Manage members who have access to this workspace
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <span className="text-lg font-medium">
                {data?.members?.length || 0} members
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <div>
                      <p className="text-lg font-medium">{memberStats?.ADMIN || 0}</p>
                      <p className="text-muted-foreground">Administrators</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <div>
                      <p className="text-lg font-medium">{memberStats?.PROJECT_MANAGER || 0}</p>
                      <p className="text-muted-foreground">Project Managers</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <div>
                      <p className="text-lg font-medium">{memberStats?.DEVELOPER || 0}</p>
                      <p className="text-muted-foreground">Developers</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="all" className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-4">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="admins">Administrators</TabsTrigger>
                    <TabsTrigger value="managers">Project Managers</TabsTrigger>
                    <TabsTrigger value="developers">Developers</TabsTrigger>
                  </TabsList>

                  <div className="flex w-full sm:w-auto space-x-2">
                    <div className="relative flex-1 sm:flex-initial">
                      <Input
                        placeholder="Search for a member..."
                        className="pl-3"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="ADMIN">Administrators</SelectItem>
                        <SelectItem value="PROJECT_MANAGER">Project Managers</SelectItem>
                        <SelectItem value="DEVELOPER">Developers</SelectItem>
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
                  <h3 className="text-lg font-medium mb-2">No members found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No members match your search criteria.
                    Try modifying your filters or invite new members.
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

      <ScheduleMeetingDialog
        isOpen={isMeetingDialogOpen}
        onClose={() => setIsMeetingDialogOpen(false)}
      />
    </div>
  );

  // Function to render a member card
  function renderMemberCard(member: any) {
    const user = member.user || { name: "Unknown User" };
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
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center">
                  {getRoleLabel(member.role)}
                </Badge>

                <div className="flex items-center text-xs text-muted-foreground">
                  <span>Added 3 days ago</span>
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
