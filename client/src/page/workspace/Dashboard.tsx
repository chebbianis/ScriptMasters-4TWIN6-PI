import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";
import WorkspaceAnalytics from "@/components/workspace/workspace-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentProjects from "@/components/workspace/project/recent-projects";
import RecentTasks from "@/components/workspace/task/recent-tasks";
import PendingUsers from "@/components/workspace/user/pending-users";
import UserStats from "@/components/workspace/user/user-stats";
import UserSearch from "@/components/workspace/user/user-search";
import { useAuthContext } from "@/context/auth-provider";

const WorkspaceDashboard = () => {
  const { onOpen } = useCreateProjectDialog();
  const { user } = useAuthContext();
  const isAdmin = user?.role === "ADMIN";

  return (
    <main className="flex flex-1 flex-col py-4 md:pt-3">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Workspace Overview
          </h2>
          <p className="text-muted-foreground">
            Here's an overview for this workspace!
          </p>
        </div>
        <Button onClick={onOpen}>
          <Plus />
          New Project
        </Button>
      </div>
      <WorkspaceAnalytics />
      <div className="mt-4">
        <Tabs defaultValue="user-stats" className="w-full border rounded-lg p-2">
          <TabsList className="w-full justify-start border-0 bg-gray-50 px-1 h-12">
            {isAdmin && (
              <>
                <TabsTrigger className="py-2" value="user-stats">
                  User Statistics
                </TabsTrigger>
                <TabsTrigger className="py-2" value="pending-users">
                  Pending Users
                </TabsTrigger>
                <TabsTrigger className="py-2" value="user-search">
                  Recherche utilisateurs
                </TabsTrigger>
              </>
            )}
            <TabsTrigger className="py-2" value="projects">
              Recent Projects
            </TabsTrigger>
            <TabsTrigger className="py-2" value="tasks">
              Recent Tasks
            </TabsTrigger>
          </TabsList>
          {isAdmin && (
            <>
              <TabsContent value="user-stats">
                <UserStats />
              </TabsContent>
              <TabsContent value="pending-users">
                <PendingUsers />
              </TabsContent>
              <TabsContent value="user-search">
                <UserSearch />
              </TabsContent>
            </>
          )}
          <TabsContent value="projects">
            <RecentProjects />
          </TabsContent>
          <TabsContent value="tasks">
            <RecentTasks />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default WorkspaceDashboard;