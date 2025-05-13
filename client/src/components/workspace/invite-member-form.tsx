import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteMemberToWorkspaceMutationFn } from "@/lib/api";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { Loader, CheckCircle2, UserPlus, Search } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import API from "@/lib/axios-client";

interface InviteMemberFormProps {
    onComplete?: () => void;
}

export default function InviteMemberForm({ onComplete }: InviteMemberFormProps = {}) {
    const workspaceId = useWorkspaceId();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { data: membersData } = useGetWorkspaceMembers(workspaceId);
    const emailInputRef = useRef<HTMLInputElement>(null);

    const { mutate, isPending } = useMutation({
        mutationFn: inviteMemberToWorkspaceMutationFn,
    });

    // Search for users when the search term changes
    useEffect(() => {
        const fetchUsers = async () => {
            if (searchTerm.length < 2) {
                setUsers([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await API.get(`/user/search/simple?keyword=${searchTerm}`);
                setUsers(response.data.users || []);
            } catch (error) {
                console.error("Error searching for users:", error);
                toast({
                    title: "Error",
                    description: "Unable to search for users",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (searchTerm.length >= 2) {
                fetchUsers();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, toast]);

    const formSchema = z.object({
        email: z.string().trim().email({
            message: "Invalid email format",
        }),
        role: z.enum(["ADMIN", "PROJECT_MANAGER", "DEVELOPER"], {
            required_error: "Please select a role",
        }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            role: "DEVELOPER",
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (isPending) return;

        mutate(
            {
                workspaceId,
                email: values.email,
                role: values.role as "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER",
            },
            {
                onSuccess: (data) => {
                    toast({
                        title: "Invitation sent",
                        description: data.message || "The invitation has been sent successfully",
                    });

                    // Reset the form
                    form.reset();

                    // Close the search popover
                    setOpen(false);
                    setSearchTerm("");

                    // Refresh the members list
                    queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });

                    // Close the parent dialog if onComplete is provided
                    if (onComplete) {
                        onComplete();
                    }
                },
                onError: (error: any) => {
                    toast({
                        title: "Error",
                        description: error.response?.data?.error || "Unable to send the invitation",
                        variant: "destructive",
                    });
                },
            }
        );
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setSearchTerm("");
        }
    };

    const handleSelectUser = (email: string) => {
        // Set the value in the form
        form.setValue("email", email, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
        });

        // Update search term
        setSearchTerm(email);

        // Close the popover
        setOpen(false);
    };

    // Add an indicator for users who are already members
    const usersWithMemberStatus = users.map((user: any) => ({
        ...user,
        isAlreadyMember: membersData?.members?.some(
            (member: any) => member.user.email === user.email
        ),
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h2 className="text-lg font-medium">Invite a new member</h2>
                <p className="text-sm text-muted-foreground">
                    Invite a user to join your workspace
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>User email</FormLabel>
                                <Popover open={open} onOpenChange={handleOpenChange}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Enter user email..."
                                                    {...field}
                                                    value={field.value}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        setSearchTerm(e.target.value);
                                                        if (e.target.value.length >= 2 && !open) {
                                                            setOpen(true);
                                                        }
                                                    }}
                                                    className="pl-8"
                                                    ref={emailInputRef}
                                                />
                                            </div>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-[300px]" align="start" side="bottom">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search for users..."
                                                value={searchTerm}
                                                onValueChange={(value) => {
                                                    setSearchTerm(value);
                                                }}
                                            />
                                            <CommandList>
                                                {isLoading ? (
                                                    <div className="p-4 text-center">
                                                        <Loader className="h-4 w-4 animate-spin mx-auto mb-2" />
                                                        Searching...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>No users found</CommandEmpty>
                                                        {users.length > 0 && (
                                                            <CommandGroup heading="Users">
                                                                {usersWithMemberStatus.map((user: any) => (
                                                                    <CommandItem
                                                                        key={user._id}
                                                                        value={user.email}
                                                                        onSelect={() => !user.isAlreadyMember && handleSelectUser(user.email)}
                                                                        disabled={user.isAlreadyMember}
                                                                        className={user.isAlreadyMember ? "opacity-60 cursor-not-allowed" : ""}
                                                                    >
                                                                        <div className="flex items-center justify-between w-full">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-medium">{user.name}</span>
                                                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                                                            </div>
                                                                            {user.isAlreadyMember ? (
                                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                            ) : (
                                                                                <UserPlus className="h-4 w-4 text-blue-500" />
                                                                            )}
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                    </>
                                                )}
                                                {!isLoading && searchTerm.length < 2 && (
                                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                                        Enter at least 2 characters to search
                                                    </div>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Administrator</SelectItem>
                                        <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                                        <SelectItem value="DEVELOPER">Developer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Sending invitation...
                            </>
                        ) : (
                            "Invite member"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
} 