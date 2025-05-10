import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader, Sparkles } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import { toast } from "@/hooks/use-toast";
import { TaskType } from "@/types/api.type";
import { useAuthContext } from "@/context/auth-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getProjectNamesQueryFn } from "@/lib/api";
import TaskAttachments from './task-attachments';
import { useTaskPriorityPrediction } from "@/hooks/use-task-priority-prediction";
import TaskPredictionInterface from './TaskPredictionInterface';

// Define the form schema type
type FormValues = {
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  projectId: string;
  assignedTo?: string;
};

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(Object.values(TaskStatusEnum) as [string, ...string[]]),
  priority: z.enum(Object.values(TaskPriorityEnum) as [string, ...string[]]),
  dueDate: z.string().min(1, "Due date is required").refine(
    (date) => {
      const due = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return due >= today;
    },
    {
      message: "Due date must be today or later",
    }
  ),
  projectId: z.string().min(1, "Project is required"),
  assignedTo: z.string().optional(),
});

interface CreateTaskFormProps {
  workspaceId: string;
  initialData?: Partial<TaskType>;
  isEditMode?: boolean;
  taskId?: string;
  onSuccess?: (task: TaskType) => void;
  onClose?: () => void;
}

// Define project type
interface Project {
  _id: string;
  name: string;
  [key: string]: any;
}

export default function CreateTaskForm({
  workspaceId,
  initialData,
  isEditMode = false,
  taskId,
  onSuccess,
  onClose,
}: CreateTaskFormProps) {
  const { user } = useAuthContext();
  const currentWorkspaceId = useWorkspaceId();
  const effectiveWorkspaceId = workspaceId || currentWorkspaceId || user?.WorkspaceId || "";
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionConfidence, setPredictionConfidence] = useState<number | null>(null);
  const [predictionFailed, setPredictionFailed] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          title: initialData.title || "",
          description: initialData.description || "",
          status: initialData.status || TaskStatusEnum.TODO,
          priority: initialData.priority || TaskPriorityEnum.MEDIUM,
          dueDate: initialData.dueDate
            ? new Date(initialData.dueDate).toISOString().split("T")[0]
            : "",
          projectId: initialData.project?._id || "",
          assignedTo: initialData.assignedTo?._id || "",
        }
      : {
          title: "",
          description: "",
          status: TaskStatusEnum.TODO,
          priority: TaskPriorityEnum.MEDIUM,
          dueDate: new Date().toISOString().split("T")[0],
          projectId: "",
          assignedTo: "",
        },
  });

  const { mutate: predictPriority, isPending: isPredicting } = useTaskPriorityPrediction();

  // Watch form values for prediction
  const description = form.watch("description");
  const dueDate = form.watch("dueDate");
  const projectId = form.watch("projectId");

  useEffect(() => {
    const predictTaskPriority = async () => {
      if (!description || !projectId) {
        setShowPrediction(false);
        setPredictionFailed(false);
        return;
      }
      const daysUntilDue = dueDate 
        ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const features = {
        descriptionLength: description.length,
        hasDueDate: !!dueDate,
        daysUntilDue,
        assignedToWorkload: 1,
        projectProgress: 0.5,
        taskDependencies: 0,
      };
      try {
        predictPriority(features, {
          onSuccess: (data) => {
            console.log('Prediction API success:', data);
            if (data.status === 'success') {
              form.setValue('priority', data.priority);
              setPredictionConfidence(data.confidence);
              setShowPrediction(true);
              setPredictionFailed(false);
            } else {
              form.setValue('priority', TaskPriorityEnum.MEDIUM);
              setShowPrediction(false);
              setPredictionFailed(true);
            }
          },
          onError: (error) => {
            console.error('Prediction API error:', error);
            form.setValue('priority', TaskPriorityEnum.MEDIUM);
            setShowPrediction(false);
            setPredictionFailed(true);
          }
        });
      } catch (error) {
        console.error('Prediction error:', error);
        form.setValue('priority', TaskPriorityEnum.MEDIUM);
        setShowPrediction(false);
        setPredictionFailed(true);
      }
    };
    const debounceTimer = setTimeout(predictTaskPriority, 1000);
    return () => clearTimeout(debounceTimer);
  }, [description, dueDate, projectId, predictPriority, form]);

  // Fetch tasks and extract unique projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", effectiveWorkspaceId],
    queryFn: () => getProjectNamesQueryFn(),
    enabled: !!effectiveWorkspaceId,
  });

  const projects = projectsData?.projects || [];

  // Mutation for create or update
  const { mutate: submitTask, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const { projectId, ...updateValues } = values;
      if (isEditMode && taskId) {
        const response = await axios.put(`http://localhost:3000/api/task/${taskId}`, {
          ...updateValues,
          dueDate: updateValues.dueDate || undefined,
          assignedTo: updateValues.assignedTo || undefined,
        });
        return response.data;
      } else {
        // Check if we have a valid workspaceId
        if (!effectiveWorkspaceId) {
          throw new Error("No workspace selected. Please select a workspace first.");
        }
        
        // Check if we have a valid projectId
        if (!projectId) {
          throw new Error("No project selected. Please select a project first.");
        }
        
        const response = await axios.post("http://localhost:3000/api/task/create", {
          ...values,
          dueDate: values.dueDate || undefined,
          assignedTo: values.assignedTo || undefined,
          workspaceId: effectiveWorkspaceId,
          createdBy: user?._id || user?.id
        });
        return response.data;
      }
    },
    onSuccess: (data) => {
      toast({
        title: isEditMode ? "Task updated" : "Task created",
        description: isEditMode ? "Your task has been updated successfully." : "Your task has been created successfully.",
      });
      // Invalidate tasks query so the table refreshes
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (onSuccess) {
        onSuccess(data.task);
      }
      if (onClose) {
        onClose();
      }
    },
    onError: (error: any) => {
      console.error("Task creation error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Always ensure a valid priority is set
    let currentPriority = form.getValues('priority');
    const validPriorities = Object.values(TaskPriorityEnum).map(String);
    if (!currentPriority || !validPriorities.includes(String(currentPriority))) {
      currentPriority = TaskPriorityEnum.MEDIUM;
      form.setValue('priority', currentPriority);
      toast({
        title: 'Warning',
        description: 'AI could not predict priority. Defaulting to MEDIUM.',
        variant: 'destructive',
      });
    }
    const submitValues = { ...values, priority: String(currentPriority) };
    console.log('Submitting values:', submitValues);
    submitTask(submitValues);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">{isEditMode ? "Update Task" : "Create New Task"}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title*</FormLabel>
                <FormControl>
                  <Input placeholder="Task title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Task description" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isProjectsLoading || isEditMode}>
                  <FormControl>
                    <SelectTrigger>
                      {isProjectsLoading ? "Loading..." : <SelectValue placeholder="Select a project" />}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TaskStatusEnum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
                    {isPredicting ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Analyzing task...</span>
                      </>
                    ) : showPrediction ? (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span className="font-medium">{field.value}</span>
                        <span className="text-sm text-muted-foreground">
                          (AI Suggested - {Math.round(predictionConfidence! * 100)}% confidence)
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Enter task details to get priority suggestion</span>
                    )}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Add Task Prediction Interface */}
          <TaskPredictionInterface
            description={form.watch("description")}
            dueDate={form.watch("dueDate")}
            projectId={form.watch("projectId")}
            assignedTo={form.watch("assignedTo")}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date*</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <FormControl>
                  <Input placeholder="User ID (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Update Task" : "Create Task"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Attachments Section - Outside the main form */}
      {isEditMode && taskId && (user?._id || user?.id) && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Attachments</h3>
          <TaskAttachments taskId={taskId} userId={user._id || user.id} />
        </div>
      )}
    </div>
  );
}