import { useRef } from "react";
import { Separator } from "@/components/ui/separator";
import ProjectAnalytics from "@/components/workspace/project/project-analytics";
import ProjectHeader from "@/components/workspace/project/project-header";
import TaskTable, { TaskTableRef } from "@/components/workspace/task/task-table";
import DeveloperRecommendations from "@/components/workspace/project/developer-recommendations";

const ProjectDetails = () => {
  const taskTableRef = useRef<TaskTableRef>(null);

  const refreshTaskList = () => {
    taskTableRef.current?.refreshTasks();
  };

  return (
    <div className="w-full space-y-6 py-4 md:pt-3">
      <ProjectHeader refreshTaskList={refreshTaskList} />
      <div className="space-y-5">
        <ProjectAnalytics />
        <Separator />
        <DeveloperRecommendations />
        <Separator />
        {/* {Task Table} */}
        <TaskTable ref={taskTableRef} />
      </div>
    </div>
  );
};

export default ProjectDetails;
