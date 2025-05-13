import { useEffect, useState } from "react";
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
    getDevelopersQueryFn,
    updateProjectMutationFn,
    getProjectByIdQueryFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { ProjectType } from "@/types/api.type";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditProjectFormProps {
    project?: ProjectType;
    projectId?: string;
    onClose: () => void;
}

// Type for extending ProjectType with missing properties in our local context
interface ExtendedProject extends ProjectType {
    members?: Array<{ _id: string; name: string }>;
    users?: Array<string | { _id: string; name: string }>;
    projectManager?: string | { _id: string; name: string; email?: string };
}

// Type-safe definition for developers
interface Developer {
    _id: string;
    name: string;
    email?: string;
    role?: string;
}

// Type for developers API response
interface DevelopersResponse {
    developers: Developer[];
}

export default function EditProjectForm({ project, projectId, onClose }: EditProjectFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    const params = useParams();

    // Si projectId n'est pas passé en prop, essayez de le récupérer depuis les paramètres d'URL
    const effectiveProjectId = projectId || params.projectId || project?._id;

    const [emoji, setEmoji] = useState(project?.emoji || "📊");
    const [activeTab, setActiveTab] = useState("details");
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    console.log("Workspace ID:", workspaceId);
    console.log("Project ID (from props):", project?._id);
    console.log("Project ID (from params):", params.projectId);
    console.log("Effective Project ID:", effectiveProjectId);

    // Process members property that doesn't exist in ProjectType
    // We use project as ExtendedProject only for accessing members
    const extendedProject = project as ExtendedProject;
    const projectMembers = extendedProject?.members || [];
    const projectMemberIds = projectMembers.map(member => member._id).filter(Boolean);

    console.log("Initial project data:", project);
    console.log("Project members:", projectMembers);
    console.log("Project member IDs:", projectMemberIds);

    const formSchema = z.object({
        name: z.string().trim().min(1, { message: "Project name is required" }),
        description: z.string().trim(),
        projectManager: z.string().min(1, { message: "Project manager is required" }),
        users: z.array(z.string()).optional(),
    });

    type FormValues = z.infer<typeof formSchema>;

    // Type assertion pour éviter les erreurs de linter
    const projectWithManager = project as unknown as { projectManager?: { _id: string } };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            projectManager: "",
            users: [],
        },
    });

    // Fetch project data
    const { data: projectData, isLoading: isProjectLoading } = useQuery({
        queryKey: ["project", workspaceId, effectiveProjectId],
        queryFn: () => {
            if (!effectiveProjectId || !workspaceId) {
                console.error("Missing projectId or workspaceId for fetching project");
                return null;
            }

            console.log("Fetching project data with:", { workspaceId, projectId: effectiveProjectId });

            return getProjectByIdQueryFn({
                workspaceId,
                projectId: effectiveProjectId
            })
                .then(data => {
                    console.log("Project data loaded:", data);
                    return data;
                })
                .catch(error => {
                    console.error("Error loading project data:", error);
                    toast({
                        title: "Error",
                        description: "Failed to load project data. Please try again.",
                        variant: "destructive",
                    });
                    throw error;
                });
        },
        enabled: !!effectiveProjectId && !!workspaceId,
    });

    // Load developers with proper error handling
    const { data: developersData, isLoading: isDevelopersLoading } = useQuery<DevelopersResponse>({
        queryKey: ["developers"],
        queryFn: () => {
            return getDevelopersQueryFn()
                .then(data => {
                    console.log("Developers loaded:", data);
                    return data;
                })
                .catch(error => {
                    console.error("Error loading developers:", error);
                    toast({
                        title: "Error",
                        description: "Failed to load team members. Please try again.",
                        variant: "destructive",
                    });
                    throw error;
                });
        }
    });

    const developers: Developer[] = developersData?.developers || [];
    const projectManagers = developers;

    // Effect to properly initialize form with project data
    useEffect(() => {
        const projectToUse = projectData?.project || project;

        if (projectToUse && !isFormInitialized) {
            console.log("Initializing form with project data:", projectToUse);

            if (!projectToUse) {
                console.warn("No project data available for initialization");
                return;
            }

            // Type assertion pour accéder aux propriétés
            const typedProject = projectToUse as any;

            const members = typedProject.members || typedProject.users || [];
            const memberIds = Array.isArray(members)
                ? members.map(m => typeof m === 'string' ? m : m._id).filter(Boolean)
                : [];

            // Récupérer projectManager selon sa structure
            const managerValue = (() => {
                const manager = typedProject.projectManager;

                // Si c'est un objet avec _id
                if (manager && typeof manager === 'object' && manager._id) {
                    return manager._id;
                }

                // Si c'est une chaîne
                if (manager && typeof manager === 'string') {
                    return manager;
                }

                // Fallback à l'ID du projet
                return typedProject._id || "";
            })();

            // Reset form with all project values
            form.reset({
                name: typedProject.name || "",
                description: typedProject.description || "",
                projectManager: managerValue,
                users: memberIds,
            });

            if (typedProject.emoji) {
                setEmoji(typedProject.emoji);
            }

            console.log("Form initialized with values:", {
                name: typedProject.name,
                description: typedProject.description,
                projectManager: managerValue,
                users: memberIds,
                emoji: typedProject.emoji,
            });

            setIsFormInitialized(true);
        }
    }, [project, projectData, form, isFormInitialized]);

    const handleEmojiSelection = (selectedEmoji: string) => {
        setEmoji(selectedEmoji);
        console.log("Emoji selected:", selectedEmoji);
    };

    const { mutate, isPending: isMutationLoading } = useMutation({
        mutationFn: updateProjectMutationFn,
        onSuccess: (data) => {
            console.log("Project updated successfully:", data);
            queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
            queryClient.invalidateQueries({ queryKey: ["project", workspaceId, effectiveProjectId] });
            toast({
                title: "Success",
                description: "Project updated successfully",
                variant: "success",
            });
            setTimeout(() => {
                navigate("/workspace/" + workspaceId);
                onClose();
            }, 500);
        },
        onError: (error: any) => {
            console.error("Update error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update project",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (values: FormValues) => {
        if (isMutationLoading || !effectiveProjectId) {
            console.error("Cannot submit: mutation is loading or projectId is missing");
            return;
        }

        console.log("Submitting form with values:", values);

        const payload = {
            workspaceId,
            projectId: effectiveProjectId,
            data: {
                name: values.name,
                description: values.description,
                projectManager: values.projectManager,
                users: values.users,
                emoji,
            },
        };

        console.log("Sending update payload:", payload);
        mutate(payload);
    };

    if (isDevelopersLoading || isProjectLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card className="border border-gray-100 shadow-lg rounded-xl bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-4 space-y-1">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="font-normal h-16 w-16 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                                    >
                                        <span className="text-3xl">{emoji}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="p-0 w-auto border-0">
                                    <Card className="border-0 shadow-lg">
                                        <CardContent className="p-0">
                                            <EmojiPickerComponent onSelectEmoji={handleEmojiSelection} />
                                        </CardContent>
                                    </Card>
                                </PopoverContent>
                            </Popover>
                            <div>
                                <CardTitle className="text-2xl font-bold">Edit Project</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Customize project details and team members
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 mx-6">
                        <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
                        <TabsTrigger value="team" className="text-sm">Team</TabsTrigger>
                    </TabsList>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="p-6 pt-4">
                                <TabsContent value="details" className="mt-4 space-y-6">
                                    {/* Project Name */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-medium">
                                                    Project Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g: Website Redesign"
                                                        className="h-12 text-lg font-medium rounded-lg border-gray-200 focus:border-blue-300 shadow-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Project Description */}
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    📝 Project Description
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={6}
                                                        placeholder="Describe your project in a few words..."
                                                        className="resize-none rounded-lg border-gray-200 focus:border-blue-300 shadow-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>

                                <TabsContent value="team" className="mt-4 space-y-6">
                                    {/* Project Manager */}
                                    <FormField
                                        control={form.control}
                                        name="projectManager"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 font-medium">
                                                    👤 Project Manager
                                                </FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-lg border-gray-200 shadow-sm">
                                                            <SelectValue placeholder="Select a project manager" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {projectManagers.map((pm) => (
                                                            <SelectItem key={pm._id} value={pm._id}>
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                                                        <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                                                                            {pm.name[0]}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{pm.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Team Members */}
                                    <FormField
                                        control={form.control}
                                        name="users"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 font-medium">
                                                    👥 Team Members
                                                </FormLabel>
                                                <FormControl>
                                                    <Card className="border border-gray-200 shadow-sm bg-white/70 rounded-lg overflow-hidden">
                                                        <CardContent className="p-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                                                                {developers.map((dev) => (
                                                                    <label
                                                                        key={dev._id}
                                                                        htmlFor={`dev-${dev._id}`}
                                                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${(field.value || []).includes(dev._id)
                                                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`dev-${dev._id}`}
                                                                            value={dev._id}
                                                                            checked={(field.value || []).includes(dev._id)}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                const newValues = e.target.checked
                                                                                    ? [...(field.value || []), value]
                                                                                    : (field.value || []).filter((id) => id !== value);
                                                                                field.onChange(newValues);
                                                                            }}
                                                                            className="rounded border-gray-300"
                                                                        />
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                                                                <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                                                                                    {dev.name[0]}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="font-medium">{dev.name}</span>
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                            </div>

                                                            {/* Selection Summary */}
                                                            <div className="mt-4">
                                                                <Separator className="my-3" />
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {field.value && field.value.length > 0 ? (
                                                                            <span className="font-medium">{field.value.length} member(s) selected</span>
                                                                        ) : (
                                                                            <span>No members selected</span>
                                                                        )}
                                                                    </span>
                                                                    {field.value && field.value.length > 0 && (
                                                                        <div className="flex -space-x-2">
                                                                            {field.value.slice(0, 3).map((userId) => {
                                                                                const user = developers.find(d => d._id === userId);
                                                                                return user ? (
                                                                                    <Avatar key={user._id} className="border-2 border-white h-8 w-8">
                                                                                        <AvatarFallback className="bg-blue-100 text-blue-800">
                                                                                            {user.name[0]}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                ) : null;
                                                                            })}
                                                                            {field.value.length > 3 && (
                                                                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 border-2 border-white">
                                                                                    <span className="text-xs font-medium">+{field.value.length - 3}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                            </CardContent>

                            <CardFooter className="flex justify-between items-center px-6 py-4 border-t bg-gray-50/80">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="border-gray-300"
                                >
                                    Cancel
                                </Button>
                                <div className="flex items-center gap-3">
                                    {activeTab === "details" ? (
                                        <Button
                                            type="button"
                                            onClick={() => setActiveTab("team")}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setActiveTab("details")}
                                                className="border-gray-300"
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isMutationLoading}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                                            >
                                                {isMutationLoading ? (
                                                    <>
                                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        ✓ Update Project
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardFooter>
                        </form>
                    </Form>
                </Tabs>
            </Card>
        </div>
    );
}
