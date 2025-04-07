

// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { Loader } from "lucide-react";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useMutation } from "@tanstack/react-query";
// import axios from "axios";
// import { useEffect, useState } from "react";
// import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
// import { toast } from "@/hooks/use-toast";
// import { TaskType } from "@/types/api.type"; // Ensure this matches your task type

// const formSchema = z.object({
//   title: z.string().min(1, "Title is required"),
//   description: z.string().optional(),
//   status: z.enum(Object.values(TaskStatusEnum) as [string, ...string[]]),
//   priority: z.enum(Object.values(TaskPriorityEnum) as [string, ...string[]]),
//   dueDate: z.string().min(1, "Due date is required"),
//   projectId: z.string().min(1, "Project is required"),
//   assignedTo: z.string().optional(),
// });

// interface CreateTaskFormProps {
//   workspaceId: string;
//   initialData?: Partial<TaskType>; // For editing
//   isEditMode?: boolean; // Toggle create/update
//   taskId?: string; // Required for update
//   onSuccess?: (task: TaskType) => void; // Callback for success
//   onClose?: () => void; // Callback to close the form
// }

// export default function CreateTaskForm({
//   workspaceId,
//   initialData,
//   isEditMode = false,
//   taskId,
//   onSuccess,
//   onClose,
// }: CreateTaskFormProps) {
//   const [projects, setProjects] = useState([]);
//   const [isLoadingProjects, setIsLoadingProjects] = useState(false);

//   const form = useForm({
//     resolver: zodResolver(formSchema),
//     defaultValues: initialData
//       ? {
//           title: initialData.title || "",
//           description: initialData.description || "",
//           status: initialData.status || TaskStatusEnum.TODO,
//           priority: initialData.priority || TaskPriorityEnum.MEDIUM,
//           dueDate: initialData.dueDate
//             ? new Date(initialData.dueDate).toISOString().split("T")[0]
//             : "",
//           projectId: initialData.project?._id || "",
//           assignedTo: initialData.assignedTo?._id || "",
//         }
//       : {
//           title: "",
//           description: "",
//           status: TaskStatusEnum.TODO,
//           priority: TaskPriorityEnum.MEDIUM,
//           dueDate: "",
//           projectId: "",
//           assignedTo: "",
//         },
//   });

//   // Fetch projects
//   useEffect(() => {
//     async function getProjects() {
//       setIsLoadingProjects(true);
//       try {
//         const response = await axios.post("http://localhost:3000/project/workspace-projects", {
//            workspaceId: workspaceId || "67e5d9d6b9761794994f1d5c",
//         });
//         setProjects(response.data.projects || []);
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//         toast({
//           title: "Error",
//           description: "Failed to fetch projects",
//           variant: "destructive",
//         });
//       }
//       setIsLoadingProjects(false);
//     }
//     getProjects();
//   }, [workspaceId]);

//   // Mutation for create or update
//   const { mutate: submitTask, isPending } = useMutation({
//     mutationFn: async (values) => {
//       const { projectId, ...updateValues } = values; // Exclude projectId for update
//       if (isEditMode && taskId) {
//         const response = await axios.put(`http://localhost:3000/task/${taskId}`, {
//           ...updateValues,
//           dueDate: updateValues.dueDate || undefined,
//           assignedTo: updateValues.assignedTo || undefined,
//         });
//         return response.data;
//       } else {
//         const response = await axios.post("http://localhost:3000/task/create", {
//           ...values,
//           dueDate: values.dueDate || undefined,
//           assignedTo: values.assignedTo || undefined,
//         });
//         return response.data;
//       }
//     },
//     onSuccess: (data) => {
//       toast({
//         title: "Success",
//         description: isEditMode ? "Task updated successfully" : "Task created successfully",
//         variant: "default",
//       });
//       if (isEditMode && onSuccess) {
//         onSuccess(data.task); // Pass updated task back to parent
//       }
//       if (!isEditMode) {
//         form.reset(); // Reset only for create
//       }
//       if (onClose) onClose(); // Close the form
//     },
//     onError: (error) => {
//       console.error(`Failed to ${isEditMode ? "update" : "create"} task:`, error);
//       toast({
//         title: "Error",
//         description: error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} task`,
//         variant: "destructive",
//       });
//     },
//   });

//   const onSubmit = (values) => {
//     console.log("Submitting values:", values); // Debug payload
//     submitTask(values);
//   };

//   return (
//     <div className="w-full max-w-md mx-auto p-4">
//       <h2 className="text-xl font-semibold mb-4">{isEditMode ? "Update Task" : "Create New Task"}</h2>
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//           <FormField
//             control={form.control}
//             name="title"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Title*</FormLabel>
//                 <FormControl>
//                   <Input placeholder="Task title" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="description"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Description</FormLabel>
//                 <FormControl>
//                   <Textarea placeholder="Task description" className="resize-none" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="projectId"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Project*</FormLabel>
//                 <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingProjects || isEditMode}>
//                   <FormControl>
//                     <SelectTrigger>
//                       {isLoadingProjects ? "Loading..." : <SelectValue placeholder="Select a project" />}
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {projects.map((project) => (
//                       <SelectItem key={project._id} value={project._id}>
//                         {project.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="status"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Status*</FormLabel>
//                 <Select onValueChange={field.onChange} value={field.value}>
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select status" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {Object.values(TaskStatusEnum).map((status) => (
//                       <SelectItem key={status} value={status}>
//                         {status}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="priority"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Priority*</FormLabel>
//                 <Select onValueChange={field.onChange} value={field.value}>
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select priority" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {Object.values(TaskPriorityEnum).map((priority) => (
//                       <SelectItem key={priority} value={priority}>
//                         {priority}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="dueDate"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Due Date*</FormLabel>
//                 <FormControl>
//                   <Input type="date" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="assignedTo"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Assigned To (Optional)</FormLabel>
//                 <FormControl>
//                   <Input placeholder="User ID (optional)" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <div className="flex justify-end space-x-2">
//             {onClose && (
//               <Button type="button" variant="outline" onClick={onClose}>
//                 Cancel
//               </Button>
//             )}
//             <Button type="submit" disabled={isPending}>
//               {isPending ? (
//                 <>
//                   <Loader className="mr-2 h-4 w-4 animate-spin" />
//                   {isEditMode ? "Updating..." : "Creating..."}
//                 </>
//               ) : (
//                 isEditMode ? "Update Task" : "Create Task"
//               )}
//             </Button>
//           </div>
//         </form>
//       </Form>
//     </div>
//   );
// }
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import { toast } from "@/hooks/use-toast";
import { TaskType } from "@/types/api.type";

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

export default function CreateTaskForm({
  workspaceId,
  initialData,
  isEditMode = false,
  taskId,
  onSuccess,
  onClose,
}: CreateTaskFormProps) {
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const form = useForm({
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
          dueDate: new Date().toISOString().split("T")[0], // Default to today
          projectId: "",
          assignedTo: "",
        },
  });

  // Fetch tasks and extract unique projects
  useEffect(() => {
    async function getProjectsFromTasks() {
      setIsLoadingProjects(true);
      try {
        const response = await axios.get("http://localhost:3000/task/all-projects");
        
        // The backend returns { projects, totalCount } not { tasks }
        const projects = response.data.projects || [];
        
        setProjects(projects); // No need to extract from tasks anymore
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
      }
      setIsLoadingProjects(false);
    }
    getProjectsFromTasks();
  }, []);

  // Mutation for create or update
  const { mutate: submitTask, isPending } = useMutation({
    mutationFn: async (values) => {
      const { projectId, ...updateValues } = values;
      if (isEditMode && taskId) {
        const response = await axios.put(`http://localhost:3000/task/${taskId}`, {
          ...updateValues,
          dueDate: updateValues.dueDate || undefined,
          assignedTo: updateValues.assignedTo || undefined,
        });
        return response.data;
      } else {
        const response = await axios.post("http://localhost:3000/task/create", {
          ...values,
          dueDate: values.dueDate || undefined,
          assignedTo: values.assignedTo || undefined,
        });
        return response.data;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: isEditMode ? "Task updated successfully" : "Task created successfully",
        variant: "default",
      });
      if (isEditMode && onSuccess) {
        onSuccess(data.task);
      }
      if (!isEditMode) {
        form.reset();
      }
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error(`Failed to ${isEditMode ? "update" : "create"} task:`, error);
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} task`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values) => {
    console.log("Submitting values:", values);
    submitTask(values);
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingProjects || isEditMode}>
                  <FormControl>
                    <SelectTrigger>
                      {isLoadingProjects ? "Loading..." : <SelectValue placeholder="Select a project" />}
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
                <FormLabel>Priority*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TaskPriorityEnum).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
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
                <FormLabel>Assigned To (Optional)</FormLabel>
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
    </div>
  );
}