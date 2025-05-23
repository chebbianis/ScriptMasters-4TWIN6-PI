import { clsx } from 'clsx';  // Add this import at the top
import { FC, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { getColumns } from "./table/columns";
import { DataTable } from "./table/table";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { DataTableFacetedFilter } from "./table/table-faceted-filter";
import { priorities, statuses } from "./table/data";
import useTaskTableFilter from "@/hooks/use-task-table-filter";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { TaskType } from "@/types/api.type";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateTaskForm from "./create-task-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Updated imports for Dialog
import Health from "./Health";
import { BellOff } from 'lucide-react';
import TaskQualityPredictor from "./TaskQualityPredictor";

// Define interface for the ref methods
export interface TaskTableRef {
  refreshTasks: () => void;
}

const fetchTasks = async ({
  workspaceId,
  projectId,
  keyword,
  status,
  priority,
  assignedTo,
  pageNumber,
  pageSize,
}: {
  workspaceId: string;
  projectId?: string;
  keyword?: string | undefined;
  status?: string | undefined;
  priority?: string | undefined;
  assignedTo?: string | undefined;
  pageNumber: number;
  pageSize: number;
}) => {
  const queryParams = new URLSearchParams({
    workspaceId,
    ...(projectId && { projectId }),
    ...(keyword && { keyword }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedTo && { assignedTo }),
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  const response = await fetch(`http://localhost:3000/task/all?${queryParams}`);
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
};

// Improved function for checking due dates
const checkDueDate = (dueDate: string): { isDueSoon: boolean; isOverdue: boolean; daysLeft: number } => {
  if (!dueDate) return { isDueSoon: false, isOverdue: false, daysLeft: 0 };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return { 
    isDueSoon: diffDays >= 0 && diffDays <= 1,  // Due today or tomorrow
    isOverdue: diffDays < 0,                    // Past due date
    daysLeft: diffDays 
  };
};

// Legacy function kept for compatibility
const isDueTomorrow = (dueDate: string): boolean => {
  const { isDueSoon } = checkDueDate(dueDate);
  return isDueSoon;
};

type Filters = ReturnType<typeof useTaskTableFilter>[0];
type SetFilters = ReturnType<typeof useTaskTableFilter>[1];

interface DataTableFilterToolbarProps {
  isLoading?: boolean;
  projectId?: string;
  filters: Filters;
  setFilters: SetFilters;
}

const TaskTable = forwardRef<TaskTableRef>((_, ref) => {
  const param = useParams();
  const projectId = param.projectId as string;
  const [tasksWithReminders, setTasksWithReminders] = useState<string[]>([]); 

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskType | null>(null); // New state for delete confirmation
  const [showHealth, setShowHealth] = useState(false);
  const [showQualityPredictor, setShowQualityPredictor] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0); // Added for forcing refresh

  const [filters, setFilters] = useTaskTableFilter();
  const workspaceId = useWorkspaceId();

  // Use useCallback to memoize the loadTasks function
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTasks({
        workspaceId,
        projectId: projectId || filters.projectId || undefined,
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        assignedTo: filters.assigneeId || undefined,
        pageNumber,
        pageSize,
      });
      
      // Process the tasks to add dueStatus property
      const processedTasks = (data.tasks || []).map((task: TaskType) => {
        const { isDueSoon, daysLeft } = checkDueDate(task.dueDate);
        return {
          ...task,
          dueStatus: {
            isDueSoon,
            daysLeft
          }
        };
      });
      
      setTasks(processedTasks);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (err) {
      setError("Error loading tasks");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    workspaceId,
    projectId,
    filters.keyword,
    filters.status,
    filters.priority,
    filters.assigneeId,
    filters.projectId,
    pageNumber,
    pageSize,
  ]);

  // Expose the refreshTasks function via ref
  useImperativeHandle(ref, () => ({
    refreshTasks: () => {
      // Increment the counter to force a new state and trigger the effect
      setRefreshCounter(prev => prev + 1);
    }
  }));

  useEffect(() => {
    const fetchReminderTasks = async () => {
      try {
        const response = await fetch('http://localhost:3000/task/reminder');
        if (!response.ok) throw new Error("Failed to fetch reminder tasks");
        const data = await response.json();
        setTasksWithReminders(data.tasks.map((task: TaskType) => task._id));
      } catch (err) {
        console.error("Error fetching reminder tasks:", err);
      }
    };
  
    fetchReminderTasks();
  }, [refreshCounter]); // Add refreshCounter to trigger this effect

  useEffect(() => {
    loadTasks();
  }, [
    loadTasks,
    refreshCounter // Add refreshCounter to dependencies
  ]);

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/task/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      // After successful deletion, refresh the entire task list
      setRefreshCounter(prev => prev + 1);
      setDeletingTask(null); // Close dialog after success
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task");
    }
  };

  const handleClearReminder = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/task/${taskId}/reminder`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to clear reminder");
      setTasksWithReminders(prev => prev.filter(id => id !== taskId));
    } catch (err) {
      console.error("Failed to clear reminder:", err);
      setError("Failed to clear reminder");
    }
  };

  const handlePageChange = (page: number) => setPageNumber(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageNumber(1);
  };

  const handleUpdateSuccess = (updatedTask: TaskType) => {
    // After successful update, refresh the entire task list
    setRefreshCounter(prev => prev + 1);
    setEditingTask(null);
  };

  const columns = [
    ...getColumns(projectId).map(column => ({
      ...column,
      // @ts-ignore - Ignoring the typing issue with the cell function for now
      cell: (props: any) => {
        const task = props.row.original;
        const hasReminder = tasksWithReminders.includes(task._id);
        const dueInfo = checkDueDate(task.dueDate);
        
        return (
          <div className={clsx({
            'bg-red-200 dark:bg-red-800/30': hasReminder || dueInfo.isOverdue, 
            'bg-orange-200 dark:bg-orange-800/30': !hasReminder && !dueInfo.isOverdue && dueInfo.isDueSoon, 
          })}>
            {typeof column.cell === 'function' ? column.cell(props) : props.getValue()}
          </div>
        );
      },
    })),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: any }) => {
        const task = row.original;
        const hasReminder = tasksWithReminders.includes(task._id);
        
        return (
          <div className={clsx("flex space-x-2", {
            'bg-red-200 dark:bg-red-800/30': hasReminder,
          })}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingTask(task)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setDeletingTask(task)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {hasReminder && (
              <Button
                variant="outline"
                size="sm"
                className="text-yellow-600 hover:bg-yellow-50"
                onClick={() => handleClearReminder(task._id)}
                title="Clear reminder"
              >
                <BellOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full relative">
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <DataTable
        isLoading={isLoading}
        data={tasks}
        columns={columns}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pagination={{ totalCount, pageNumber, pageSize }}
        filtersToolbar={
          <DataTableFilterToolbar
            isLoading={isLoading}
            projectId={projectId}
            filters={filters}
            setFilters={setFilters}
          />
        }
      />

      <div className="mt-6 flex flex-col items-center space-y-4">
        <div className="flex space-x-4">
          <Button
            variant="outline"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
            onClick={() => setShowHealth(!showHealth)}
          >
            {showHealth ? "Hide Workspace Health" : "Workspace Health"}
          </Button>
          <Button
            variant="outline"
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
            onClick={() => setShowQualityPredictor(true)}
          >
            Predict Quality Task
          </Button>
        </div>
        {showHealth && (
          <div className="mt-4 w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <Health />
          </div>
        )}
      </div>

      {/* Quality Predictor Modal */}
      {showQualityPredictor && (
        <Dialog open onOpenChange={() => setShowQualityPredictor(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Predict Task Quality</DialogTitle>
              <DialogDescription>
                Use AI to predict the quality of your task based on its details
              </DialogDescription>
            </DialogHeader>
            <TaskQualityPredictor />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Dialog open onOpenChange={() => setEditingTask(null)}>
          <DialogContent>
            <CreateTaskForm
              workspaceId={workspaceId}
              initialData={editingTask}
              isEditMode={true}
              taskId={editingTask._id}
              onSuccess={handleUpdateSuccess}
              onClose={() => setEditingTask(null)}
              refreshTaskList={() => loadTasks()}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <Dialog open onOpenChange={() => setDeletingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the task "{deletingTask.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingTask(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDeleteTask(deletingTask._id)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

const DataTableFilterToolbar: FC<DataTableFilterToolbarProps> = ({
  isLoading,
  projectId,
  filters,
  setFilters,
}) => {
  const workspaceId = useWorkspaceId();
  const { data } = useGetProjectsInWorkspaceQuery({ workspaceId });
  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const projects = data?.projects || [];
  const members = memberData?.members || [];

  const projectOptions = projects?.map((project: any) => ({
    label: (
      <div className="flex items-center gap-1">
        <span>{project.emoji}</span>
        <span>{project.name}</span>
      </div>
    ),
    value: project._id,
  }));

  const assigneesOptions = members?.map((member: any) => {
    const name = member.userId?.name || "Unknown";
    const initials = getAvatarFallbackText(name);
    const avatarColor = getAvatarColor(name);
    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={member.userId?.profilePicture || ""} alt={name} />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: member.userId._id,
    };
  });

  const handleFilterChange = (key: keyof Filters, values: string[]) => {
    setFilters({
      ...filters,
      [key]: values.length > 0 ? values.join(",") : null,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row w-full items-start space-y-2 mb-2 lg:mb-0 lg:space-x-2 lg:space-y-0">
      <Input
        placeholder="Filter tasks..."
        value={filters.keyword || ""}
        onChange={(e) => setFilters({ keyword: e.target.value })}
        className="h-8 w-full lg:w-[250px]"
      />
      <DataTableFacetedFilter
        title="Status"
        multiSelect={true}
        options={statuses}
        disabled={isLoading}
        selectedValues={filters.status?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("status", values)}
      />
      <DataTableFacetedFilter
        title="Priority"
        multiSelect={true}
        options={priorities}
        disabled={isLoading}
        selectedValues={filters.priority?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("priority", values)}
      />
      <DataTableFacetedFilter
        title="Assigned To"
        multiSelect={true}
        options={assigneesOptions}
        disabled={isLoading}
        selectedValues={filters.assigneeId?.split(",") || []}
        onFilterChange={(values) => handleFilterChange("assigneeId", values)}
      />
      {!projectId && (
        <DataTableFacetedFilter
          title="Projects"
          multiSelect={false}
          options={projectOptions}
          disabled={isLoading}
          selectedValues={filters.projectId?.split(",") || []}
          onFilterChange={(values) => handleFilterChange("projectId", values)}
        />
      )}
      {Object.values(filters).some((value) => value !== null && value !== "") && (
        <Button
          disabled={isLoading}
          variant="ghost"
          className="h-8 px-2 lg:px-3"
          onClick={() =>
            setFilters({
              keyword: null,
              status: null,
              priority: null,
              projectId: null,
              assigneeId: null,
            })
          }
        >
          Reset
          <X />
        </Button>
      )}
    </div>
  );
};

export default TaskTable;