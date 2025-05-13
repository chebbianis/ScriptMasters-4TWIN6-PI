import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { organizeMeetingMutationFn } from "@/lib/api";
import useWorkspaceId from "@/hooks/use-workspace-id";

interface ScheduleMeetingFormProps {
    onComplete?: () => void;
}

const timezones = [
    "UTC",
    "UTC+1 (Paris, Berlin, Rome)",
    "UTC+2 (Athens, Cairo)",
    "UTC+3 (Moscow, Istanbul)",
    "UTC+4 (Dubai, Abu Dhabi)",
    "UTC+5 (Karachi, Islamabad)",
    "UTC+6 (Dhaka)",
    "UTC+7 (Bangkok, Jakarta)",
    "UTC+8 (Singapore, Beijing)",
    "UTC+9 (Tokyo, Seoul)",
    "UTC+10 (Sydney)",
    "UTC+11 (Solomon Islands)",
    "UTC+12 (Auckland)",
    "UTC-1 (Azores)",
    "UTC-2 (South Georgia)",
    "UTC-3 (Buenos Aires)",
    "UTC-4 (New York, Eastern Time)",
    "UTC-5 (Chicago, Central Time)",
    "UTC-6 (Denver, Mountain Time)",
    "UTC-7 (Los Angeles, Pacific Time)",
    "UTC-8 (Anchorage, Alaska Time)",
    "UTC-9 (Honolulu, Hawaii Time)",
    "UTC-10 (Cook Islands)",
    "UTC-11 (Samoa)",
    "UTC-12 (Baker Island)",
];

export default function ScheduleMeetingForm({ onComplete }: ScheduleMeetingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const workspaceId = useWorkspaceId();

    const formSchema = z.object({
        title: z.string().min(3, {
            message: "Title must contain at least 3 characters",
        }),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
            message: "Invalid date format. Use YYYY-MM-DD",
        }),
        time: z.string().regex(/^\d{2}:\d{2}$/, {
            message: "Invalid time format. Use HH:MM",
        }),
        duration: z.coerce.number().min(15, {
            message: "Minimum duration is 15 minutes",
        }).max(480, {
            message: "Maximum duration is 8 hours (480 minutes)",
        }),
        description: z.string().optional(),
        timezone: z.string(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            date: new Date().toISOString().split('T')[0], // Today in YYYY-MM-DD format
            time: new Date().getHours() + ":" + (Math.ceil(new Date().getMinutes() / 15) * 15 || "00").toString().padStart(2, "0"), // Next 15-minute interval
            duration: 30,
            description: "",
            timezone: "UTC+1 (Paris, Berlin, Rome)",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: organizeMeetingMutationFn,
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (isPending) return;

        mutate(
            {
                workspaceId,
                data: values
            },
            {
                onSuccess: (data) => {
                    toast({
                        title: "Meeting scheduled",
                        description: "Invitations have been sent to workspace members.",
                        variant: "default",
                    });

                    // Close form if onComplete is provided
                    if (onComplete) {
                        onComplete();
                    }
                },
                onError: (error: any) => {
                    toast({
                        title: "Error",
                        description: error.response?.data?.error || error.message || "An error occurred",
                        variant: "destructive",
                    });
                }
            }
        );
    };

    return (
        <div className="space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meeting Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Weekly Team Meeting" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration (minutes)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="15" max="480" step="5" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Duration in minutes (15-480)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="timezone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Timezone</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                        >
                                            {timezones.map((timezone) => (
                                                <option key={timezone} value={timezone}>
                                                    {timezone}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (optional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Agenda, topics to discuss..."
                                        {...field}
                                        rows={4}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Schedule meeting and send invitations"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}