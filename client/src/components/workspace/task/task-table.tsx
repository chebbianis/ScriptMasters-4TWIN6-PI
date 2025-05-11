import { clsx } from 'clsx';  // Add this import at the top
import { FC, useState, useEffect } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TaskQualityPredictor from './TaskQualityPredictor';


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
  keyword?: string | null;
  status?: string | null;
  priority?: string | null;
  assignedTo?: string | null;
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

  const response = await fetch(`/api/task/all?${queryParams}`);
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
};

const isDueTomorrow = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

type Filters = ReturnType<typeof useTaskTableFilter>[0];
type SetFilters = ReturnType<typeof useTaskTableFilter>[1];

interface DataTableFilterToolbarProps {
  isLoading?: boolean;
  projectId?: string;
  filters: Filters;
  setFilters: SetFilters;
}

const TaskTable = () => {
  const param = useParams();
  const projectId = param.projectId as string;
  const [tasksWithReminders, setTasksWithReminders] = useState<string[]>([]); 
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskType | null>(null);
  const [showHealth, setShowHealth] = useState(false);
  const [showQualityPredictor, setShowQualityPredictor] = useState(false);
  const [filters, setFilters] = useTaskTableFilter();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  // Fetch tasks using React Query
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', workspaceId, projectId, filters, pageNumber, pageSize],
    queryFn: () => fetchTasks({
      workspaceId,
      projectId: projectId || filters.projectId,
      keyword: filters.keyword,
      status: filters.status,
      priority: filters.priority,
      assignedTo: filters.assigneeId,
      pageNumber,
      pageSize,
    }),
    enabled: !!workspaceId,
  });

  const tasks = tasksData?.tasks || [];
  const totalCount = tasksData?.pagination?.totalCount || 0;

  // Fetch reminder tasks
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
  }, []);

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`http://localhost:3000/task/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeletingTask(null);
    },
    onError: (err) => {
      console.error("Failed to delete task:", err);
    }
  });

  // Clear reminder mutation
  const clearReminderMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`http://localhost:3000/task/${taskId}/reminder`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to clear reminder");
      return response.json();
    },
    onSuccess: (_, taskId) => {
      setTasksWithReminders(prev => prev.filter(id => id !== taskId));
    },
    onError: (err) => {
      console.error("Failed to clear reminder:", err);
    }
  });

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleClearReminder = (taskId: string) => {
    clearReminderMutation.mutate(taskId);
  };

  const handlePageChange = (page: number) => setPageNumber(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageNumber(1);
  };

  const handleUpdateSuccess = (updatedTask: TaskType) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setEditingTask(null);
  };

  const columns = [
    ...getColumns(projectId).map(column => ({
      ...column,
      cell: (props: any) => {
        const task = props.row.original;
        const hasReminder = tasksWithReminders.includes(task._id); // Check if task ID is in reminders list
        const isDueDateTomorrow = task.dueDate && isDueTomorrow(task.dueDate);
        
        return (
          <div className={clsx({
            'bg-red-200 dark:bg-red-800/30': hasReminder, // Red for reminded tasks
            'bg-orange-200 dark:bg-orange-800/30': !hasReminder && isDueDateTomorrow, // Orange for due tomorrow
          })}>
            {column.cell ? column.cell(props) : props.getValue()}
          </div>
        );
      },
    })),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
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
      {error && <div className="text-red-500 mb-4">{error.message}</div>}

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

      <div className="mt-6 flex flex-col items-center">
        <div className="flex flex-row gap-4">
          <Button
            variant="outline"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
            onClick={() => setShowHealth(!showHealth)}
          >
            {showHealth ? "Hide Workspace Health" : "Workspace Health"}
          </Button>
          <Button
            variant="outline"
            className="bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:from-green-600 hover:to-teal-700 transition-all duration-300"
            onClick={() => setShowQualityPredictor(true)}
          >
            Predict Task Quality
          </Button>
        </div>
        {showHealth && (
          <div className="mt-4 w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <Health />
          </div>
        )}
        {showQualityPredictor && (
          <Dialog open onOpenChange={() => setShowQualityPredictor(false)}>
            <DialogContent className="max-w-lg">
              <DialogTitle>Task Quality Predictor</DialogTitle>
              <DialogDescription>
                Predict the quality of your task with confidence
              </DialogDescription>
              <TaskQualityPredictor />
            </DialogContent>
          </Dialog>
        )}
      </div>

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
                Are you sure you want to delete the task "<strong>{deletingTask.title}</strong>"? This action cannot be undone.
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
};

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

  const projectOptions = projects?.map((project) => ({
    label: (
      <div className="flex items-center gap-1">
        <span>{project.emoji}</span>
        <span>{project.name}</span>
      </div>
    ),
    value: project._id,
  }));

  const assigneesOptions = members?.map((member) => {
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