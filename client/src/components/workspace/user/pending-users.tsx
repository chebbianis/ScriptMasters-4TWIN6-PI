import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, UserPlus, AlertTriangle, ShieldCheck, Filter } from "lucide-react";
import { getPendingUsersQueryFn, activateUserMutationFn } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Map roles to colors and icons
const roleConfig = {
    ADMIN: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <ShieldCheck className="w-3 h-3 mr-1" />,
        label: "Administrator"
    },
    PROJECT_MANAGER: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <UserPlus className="w-3 h-3 mr-1" />,
        label: "Project Manager"
    },
    DEVELOPER: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <UserPlus className="w-3 h-3 mr-1" />,
        label: "Developer"
    }
};

const PendingUsers = () => {
    const [filter, setFilter] = useState<string>("all");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Get pending users
    const { data, isLoading, error } = useQuery({
        queryKey: ["pendingUsers"],
        queryFn: getPendingUsersQueryFn
    });

    // Mutation to approve/reject a user
    const { mutate: activateUser, isPending: isActivating } = useMutation({
        mutationFn: activateUserMutationFn,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
            queryClient.invalidateQueries({ queryKey: ["userStats"] });

            toast({
                title: data.success ? "User approved" : "Request rejected",
                description: data.success
                    ? `${data.data?.name} now has access to the platform.`
                    : "The access request has been rejected.",
                variant: data.success ? "default" : "destructive",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Unable to process this request.",
                variant: "destructive",
            });
        }
    });

    // Event handlers
    const handleApprove = (userId: string) => {
        activateUser({ userId, approved: true });
    };

    const handleReject = (userId: string) => {
        if (window.confirm("Are you sure you want to reject this access request?")) {
            activateUser({ userId, approved: false });
        }
    };

    // Date formatting
    const formatRequestDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        }
    };

    // Filter users by role
    const filteredUsers = data?.data?.filter(user =>
        filter === "all" || user.requestedRole === filter
    ) || [];

    // Display loading state
    if (isLoading) {
        return (
            <Card className="border shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50 border-b pb-3">
                    <CardTitle className="text-xl font-semibold text-gray-700">Pending Access Requests</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-500">Loading requests...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Display errors
    if (error) {
        return (
            <Card className="border shadow-md overflow-hidden">
                <CardHeader className="bg-red-50 border-b pb-3">
                    <CardTitle className="text-xl font-semibold text-gray-700 flex items-center">
                        <AlertTriangle className="text-red-500 mr-2 h-5 w-5" />
                        Error
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="bg-red-50 text-red-800 p-4 rounded-md">
                        Unable to load access requests. Please try again.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-md overflow-hidden">
            <CardHeader className="bg-gray-50 border-b pb-3">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-semibold text-gray-700">
                            Pending Access Requests
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                            {data?.count || 0} pending user{data?.count !== 1 && 's'}
                        </CardDescription>
                    </div>
                    <div className="w-48">
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="h-8">
                                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All roles</SelectItem>
                                <SelectItem value="ADMIN">Administrators</SelectItem>
                                <SelectItem value="PROJECT_MANAGER">Project Managers</SelectItem>
                                <SelectItem value="DEVELOPER">Developers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                <div className="space-y-6">
                    <AnimatePresence>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => {
                                const roleInfo = roleConfig[user.requestedRole as keyof typeof roleConfig] || roleConfig.DEVELOPER;

                                return (
                                    <motion.div
                                        key={user.id}
                                        className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <Avatar className="h-12 w-12 border-2 border-gray-100">
                                                        {user.avatar ? (
                                                            <AvatarImage src={user.avatar} alt={user.name} />
                                                        ) : (
                                                            <AvatarFallback className="bg-gray-100 text-gray-600">
                                                                {user.name[0]}
                                                            </AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="text-base font-semibold text-gray-800">{user.name}</h3>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <Badge variant="outline" className={`text-xs py-0 px-2 ${roleInfo.color} flex items-center border`}>
                                                                {roleInfo.icon}
                                                                {roleInfo.label}
                                                            </Badge>
                                                            <span className="text-xs flex items-center text-gray-500">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {formatRequestDate(user.requestedAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
                                                        onClick={() => handleApprove(user.id)}
                                                        disabled={isActivating}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                                                        onClick={() => handleReject(user.id)}
                                                        disabled={isActivating}
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div
                                className="text-center py-12"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <h3 className="text-gray-500 font-medium mb-1">No pending requests</h3>
                                <p className="text-gray-400 text-sm">
                                    New registration requests will appear here
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>

            {filteredUsers.length > 0 && (
                <CardFooter className="bg-gray-50 border-t py-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                        Last request received on {new Date(filteredUsers[0].requestedAt).toLocaleDateString('en-US')}
                    </span>
                    {isActivating && (
                        <span className="text-xs flex items-center text-blue-600">
                            <Loader2 className="animate-spin h-3 w-3 mr-1" />
                            Processing...
                        </span>
                    )}
                </CardFooter>
            )}
        </Card>
    );
};

export default PendingUsers;