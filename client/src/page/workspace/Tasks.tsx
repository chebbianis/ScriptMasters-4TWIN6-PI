import { useRef } from "react";
import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import TaskTable, { TaskTableRef } from "@/components/workspace/task/task-table";

export default function Tasks() {
  const taskTableRef = useRef<TaskTableRef>(null);

  const refreshTaskList = () => {
    taskTableRef.current?.refreshTasks();
  };

  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s the list of tasks for this workspace!
          </p>
        </div>
        <CreateTaskDialog refreshTaskList={refreshTaskList} />
      </div>
      {/* {Task Table} */}
      <div>
        <TaskTable ref={taskTableRef} />
      </div>
    </div>
  );
}
