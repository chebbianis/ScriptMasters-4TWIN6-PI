import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "../../ui/textarea";
import EmojiPickerComponent from "@/components/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProjectMutationFn } from "@/lib/api";
import { getDevelopersQueryFn } from "@/lib/developers";
import { createNotification } from "@/lib/notifications";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

export default function CreateProjectForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [emoji, setEmoji] = useState("📊");

  // Récupération des développeurs via l'endpoint /users/developers
  const { data: developersData, isLoading: isDevelopersLoading } = useQuery({
    queryKey: ["developers"],
    queryFn: getDevelopersQueryFn,
  });

  console.log("Developers data in component:", developersData);
  
  const developers = developersData?.developers || [];
  console.log("Processed developers:", developers);
  
  // Pour le project manager, on utilise ici la même liste
  const projectManagers = developers;
  console.log("Project managers:", projectManagers);

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

  const handleEmojiSelection = (selectedEmoji: string) => {
    setEmoji(selectedEmoji);
  };

  const { mutate, isPending: isMutationLoading } = useMutation({
    mutationFn: createProjectMutationFn,
    onSuccess: async (data, variables, context) => {
      if (!data || !data.project) {
        console.error("Project data is missing in the response");
        return;
      }
      
      const project = data.project;
      // Invalider la query pour rafraîchir la liste des projets
      queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
      toast({
        title: "Success",
        description: "Project created successfully",
        variant: "success",
      });
      
      // Envoi d'une notification à chaque développeur sélectionné
      const selectedUsers = form.getValues("users");
      if (selectedUsers && selectedUsers.length > 0) {
        console.log("Développeurs sélectionnés:", selectedUsers); // Ajouter un log
        selectedUsers.forEach(async (userId) => {
          await createNotification({
            userId: userId,
            projectId: project._id,
            message: `Vous avez été assigné au projet ${project.name}`,
          });
        });
      }
      
      navigate(`/`);
      setTimeout(() => onClose(), 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isMutationLoading) return;
    
    // Préparer le payload avec les bons noms de propriétés
    const payload = {
      workspaceId,
      data: {
        name: values.name,
        description: values.description,
        projectManager: values.projectManager,
        users: values.users,
        emoji, // Optionnel, si le backend gère cet attribut
      },
    };
  
    mutate(payload);
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1 text-center sm:text-left">
            Create Project
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Organize and manage tasks, resources, and team collaboration
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Sélection de l'emoji */}
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
            {/* Titre du projet */}
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
            {/* Description du projet */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project description{" "}
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
            {/* Sélection du Project Manager (choix unique) */}
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
                        disabled={isDevelopersLoading || projectManagers.length === 0}
                      >
                        <option value="">Select a Project Manager</option>
                        {projectManagers.length > 0 ? (
                          projectManagers.map((pm: any) => (
                            <option key={pm._id} value={pm._id}>
                              {pm.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            {isDevelopersLoading ? "Loading..." : "No project managers available"}
                          </option>
                        )}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Sélection des Développeurs (sélection multiple) */}
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
                        value={field.value}
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
            <Button
              disabled={isMutationLoading}
              className="flex place-self-end h-[40px] text-white font-semibold"
              type="submit"
            >
              {isMutationLoading && <Loader className="animate-spin" />}
              Create
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
