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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatbotStore } from "@/lib/store/chatbot-store";

const WorkspaceDashboard = () => {
  const { onOpen } = useCreateProjectDialog();
  const { user } = useAuthContext();
  const toggleChatbot = useChatbotStore(state => state.toggleChatbot);
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI Virtual Assistant</CardTitle>
          <CardDescription>
            A chatbot powered by Google Gemini is now available to assist you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1">
              <p className="mb-2">Our virtual assistant can help you with:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Developer recommendations for your projects</li>
                <li>Answers to questions about programming languages</li>
                <li>Help with planning and task management</li>
                <li>Suggestions to boost productivity</li>
              </ul>
            </div>
            <div>
              <Button onClick={toggleChatbot} className="whitespace-nowrap">
                Open Assistant 💬
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* <WorkspaceAnalytics /> */}
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
                  Search Users
                </TabsTrigger>
              </>
            )}
            <TabsTrigger className="py-2" value="projects">
              Recent Projects
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