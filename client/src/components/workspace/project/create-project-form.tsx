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
  FormDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DeveloperRecommendations from "./developer-recommendations";

const PROGRAMMING_LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Ruby", "PHP",
  "Go", "Rust", "Swift", "Kotlin", "Scala", "R", "MATLAB", "SQL", "HTML",
  "CSS", "Dart", "Elixir", "Haskell", "Perl", "Shell", "PowerShell"
];

export default function CreateProjectForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [emoji, setEmoji] = useState("📊");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [tempProjectId, setTempProjectId] = useState<string | null>(null);

  // Fetch developers from /users/developers endpoint
  const { data: developersData, isLoading: isDevelopersLoading } = useQuery({
    queryKey: ["developers"],
    queryFn: getDevelopersQueryFn,
  });

  const developers = developersData?.developers || [];
  const projectManagers = developers;

  const formSchema = z.object({
    name: z.string().trim().min(1, { message: "Project title is required" }),
    description: z.string().trim(),
    projectManager: z.string().min(1, { message: "A project manager is required" }),
    users: z.array(z.string()).optional(),
    languages: z.array(z.string()).min(1, { message: "At least one language is required" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      projectManager: "",
      users: [],
      languages: [],
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
      // Invalidate query to refresh projects list
      queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
      toast({
        title: "Success",
        description: "Project created successfully",
        variant: "success",
      });

      // Send notification to each selected developer
      const selectedUsers = form.getValues("users");
      if (selectedUsers && selectedUsers.length > 0) {
        selectedUsers.forEach(async (userId) => {
          await createNotification({
            userId: userId,
            projectId: project._id,
            message: `You have been assigned to project ${project.name}`,
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

    const payload = {
      workspaceId,
      data: {
        name: values.name,
        description: values.description,
        projectManager: values.projectManager,
        users: values.users,
        languages: selectedLanguages,
        emoji,
      },
    };

    mutate(payload);
  };

  const handleGetRecommendations = async () => {
    if (isMutationLoading) return;

    // Vérifier que des langages ont été sélectionnés
    if (selectedLanguages.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un langage de programmation",
        variant: "destructive",
      });
      return;
    }

    // Get the first available project manager
    const tempProjectManager = projectManagers.length > 0 ? projectManagers[0]._id : null;

    if (!tempProjectManager) {
      toast({
        title: "Error",
        description: "No project manager available for recommendations",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary project for recommendations
    const payload = {
      workspaceId,
      data: {
        name: form.getValues("name") || "Temporary Project for Recommendations",
        description: form.getValues("description") || "Temporary project created to get developer recommendations",
        languages: selectedLanguages,
        emoji,
        projectManager: tempProjectManager,
        users: []
      },
    };

    console.log("Création d'un projet temporaire avec les langages:", selectedLanguages);

    try {
      const response = await createProjectMutationFn(payload);
      if (response.project) {
        setTempProjectId(response.project._id);
        setShowRecommendations(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to get recommendations",
        variant: "destructive",
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <>
      <motion.div
        className="w-full h-auto max-w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="h-full">
          <motion.div
            className="mb-6 pb-3 border-b flex flex-col items-center sm:items-start"
            variants={itemVariants}
          >
            <h1 className="text-2xl tracking-tight dark:text-[#fcfdffef] font-bold mb-2 text-center sm:text-left flex items-center gap-2">
              Create a new project
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Organize and manage your tasks, resources and team collaboration
            </p>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Top section: Emoji and title */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                {/* Emoji selection */}
                <motion.div variants={itemVariants} className="w-full sm:w-auto">
                  <FormLabel className="text-sm font-medium mb-2 block">
                    Project icon
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="font-normal size-16 sm:size-20 !p-0 !shadow-none mt-2 items-center justify-center rounded-xl hover:bg-accent hover:text-accent-foreground border-2 transition-all duration-200"
                      >
                        <span className="text-4xl">{emoji}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0 w-64" sideOffset={5}>
                      <EmojiPickerComponent onSelectEmoji={handleEmojiSelection} />
                    </PopoverContent>
                  </Popover>
                </motion.div>

                {/* Project title */}
                <motion.div variants={itemVariants} className="flex-1 w-full">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Project title
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Website redesign"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </div>

              {/* Project description */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Project description
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          Optional
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Describe the project's objective and scope..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Team */}
              <motion.div variants={itemVariants}>
                <Card className="border border-muted rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-4">
                      <h3 className="font-medium">Project team</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Project manager */}
                      <FormField
                        control={form.control}
                        name="projectManager"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Project manager
                            </FormLabel>
                            <Select
                              disabled={isDevelopersLoading || projectManagers.length === 0}
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Select a project manager" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projectManagers.length > 0 ? (
                                  projectManagers.map((pm: any) => (
                                    <SelectItem key={pm._id} value={pm._id}>
                                      {pm.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-project-manager" disabled>
                                    {isDevelopersLoading ? "Loading..." : "No project manager available"}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Developers */}
                      <FormField
                        control={form.control}
                        name="users"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Developers
                            </FormLabel>
                            <div className="relative">
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
                                  className={cn(
                                    "flex h-auto min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                    "disabled:cursor-not-allowed disabled:opacity-50"
                                  )}
                                >
                                  {developers.map((dev: any) => (
                                    <option key={dev._id} value={dev._id}>
                                      {dev.name}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                            </div>
                            <FormDescription>
                              Hold Ctrl/Cmd to select multiple developers
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Languages Selection */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Required Programming Languages
                      </FormLabel>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedLanguages.map((lang) => (
                            <Badge
                              key={lang}
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              {lang}
                              <button
                                type="button"
                                onClick={() => {
                                  const newLanguages = selectedLanguages.filter(l => l !== lang);
                                  setSelectedLanguages(newLanguages);
                                  field.onChange(newLanguages);
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <Select
                          onValueChange={(value) => {
                            if (!selectedLanguages.includes(value)) {
                              const newLanguages = [...selectedLanguages, value];
                              setSelectedLanguages(newLanguages);
                              field.onChange(newLanguages);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROGRAMMING_LANGUAGES.filter(
                              lang => !selectedLanguages.includes(lang)
                            ).map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetRecommendations}
                  disabled={!selectedLanguages.length || isMutationLoading}
                >
                  Get Recommendations
                </Button>

                <Button
                  type="submit"
                  disabled={isMutationLoading}
                  className="h-11 px-6 font-medium text-white"
                >
                  {isMutationLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>

      <Dialog open={showRecommendations} onOpenChange={setShowRecommendations}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Recommandations de développeurs</DialogTitle>
          </DialogHeader>
          {tempProjectId && (
            <DeveloperRecommendations projectId={tempProjectId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
