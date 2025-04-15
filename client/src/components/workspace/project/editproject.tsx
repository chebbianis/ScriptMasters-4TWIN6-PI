import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import EmojiPickerComponent from "@/components/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate, useParams } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjectByIdQueryFn,
  getDevelopersQueryFn,
  updateProjectMutationFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

export default function EditProjectForm({ onClose }: { onClose: () => void }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [emoji, setEmoji] = useState("📊");

  const formSchema = z.object({
    name: z.string().trim().min(1, { message: "Project title is required" }),
    description: z.string().trim(),
    projectManager: z.string().min(1, { message: "Project Manager is required" }),
    users: z.array(z.string()).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      projectManager: "",
      users: [],
    },
  });

  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: getProjectByIdQueryFn({ workspaceId, projectId: projectId! }),
  });

  const { data: developersData, isLoading: isDevelopersLoading } = useQuery({
    queryKey: ["developers"],
    queryFn: getDevelopersQueryFn,
  });

  const developers = developersData?.developers || [];
  const projectManagers = developers;

  useEffect(() => {
    if (projectData?.project) {
      form.reset({
        name: projectData.project.name || "",
        description: projectData.project.description || "",
        projectManager: projectData.project.projectManager || "",
        users: projectData.project.users || [],
      });
      if (projectData.project.emoji) {
        setEmoji(projectData.project.emoji);
      }
    }
  }, [projectData, form]);

  const handleEmojiSelection = (selectedEmoji: string) => {
    setEmoji(selectedEmoji);
  };

  const { mutate, isPending: isMutationLoading } = useMutation({
    mutationFn: updateProjectMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
      toast({
        title: "Success",
        description: "Project updated successfully",
        variant: "success",
      });
navigate("/workspace/" + workspaceId);      setTimeout(() => onClose(), 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isMutationLoading) return;

    const payload = {
      workspaceId,
      projectId: projectId!,
      data: {
        name: values.name,
        description: values.description,
        projectManager: values.projectManager,
        users: values.users,
        emoji,
      },
    };

    mutate(payload);
  };

  if (isProjectLoading || isDevelopersLoading) {
    return <Loader className="animate-spin" />;
  }

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1 text-center sm:text-left">
            Edit Project
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Update project details and team members
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Emoji Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Emoji
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-normal size-[60px] !p-2 !shadow-none mt-2 items-center rounded-full"
                  >
                    <span className="text-4xl">{emoji}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="!p-0">
                  <EmojiPickerComponent onSelectEmoji={handleEmojiSelection} />
                </PopoverContent>
              </Popover>
            </div>
            {/* Project Title */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Website Redesign"
                        className="!h-[48px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Project Description */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project description
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Project description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Project Manager */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="projectManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project Manager
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="mt-1 block w-full border rounded p-2"
                      >
                        <option value="">Select a Project Manager</option>
                        {projectManagers.map((pm: any) => (
                          <option key={pm._id} value={pm._id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Developers (multiple selection) */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="users"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Developers
                    </FormLabel>
                    <FormControl>
                      <select
                        multiple
                        value={field.value || []}
                        onChange={(e) => {
                          const selectedValues = Array.from(
                            e.target.selectedOptions,
                            (option) => option.value
                          );
                          field.onChange(selectedValues);
                        }}
                        className="mt-1 block w-full border rounded p-2"
                      >
                        {developers.map((dev: any) => (
                          <option key={dev._id} value={dev._id}>
                            {dev.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Submit Button */}
            <Button
              disabled={isMutationLoading}
              className="flex place-self-end h-[40px] text-white font-semibold"
              type="submit"
            >
              {isMutationLoading && <Loader className="animate-spin mr-2" />}
              Update Project
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
