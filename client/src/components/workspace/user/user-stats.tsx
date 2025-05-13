import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Users, UserCheck, Clock, BarChart, Shield } from "lucide-react";
import Progress from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserStatsQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define specific roles for your system
const ROLES = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"] as const;
type Role = (typeof ROLES)[number];

interface UserLogin {
    id: string;
    name: string;
    role: Role;
    lastLogin: string;
}

interface RoleStats {
    count: number;
    active: number;
}

interface Stats {
    totalUsers: number;
    activeToday: number;
    roleStats: Record<Role, RoleStats>;
    recentLogins: UserLogin[];
}

// Specific colors for each role
const roleColors: Record<Role, { bg: string, text: string, border: string }> = {
    ADMIN: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
    PROJECT_MANAGER: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
    DEVELOPER: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" }
};

const UserStats = () => {
    // Retrieve actual data from API
    const { data, isLoading, error } = useQuery({
        queryKey: ["userStats"],
        queryFn: getUserStatsQueryFn
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-500">Error loading statistics</p>
            </div>
        );
    }

    // Validate and transform data received from API
    const validateRole = (role: string): Role => {
        if (ROLES.includes(role as Role)) {
            return role as Role;
        }
        return "DEVELOPER"; // Default role if invalid
    };

    const transformedData: Stats = {
        totalUsers: data?.data?.totalUsers || 0,
        activeToday: data?.data?.activeToday || 0,
        roleStats: ROLES.reduce((acc, role) => ({
            ...acc,
            [role]: data?.data?.roleStats?.[role] || { count: 0, active: 0 }
        }), {} as Record<Role, RoleStats>),
        recentLogins: (data?.data?.recentLogins || []).map(login => ({
            ...login,
            role: validateRole(login.role)
        }))
    };

    // Calculate the most active role dynamically
    const mostActiveRole = Object.entries(transformedData.roleStats).reduce(
        (max, [role, data]) => (data.active > max.active ? { role, active: data.active } : max),
        { role: "", active: 0 }
    );

    // Format time since last login
    const formatLastLogin = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Calculate activity rates
    const calculateActiveRate = (role: Role) => {
        const stats = transformedData.roleStats[role];
        return stats.count > 0 ? Math.round((stats.active / stats.count) * 100) : 0;
    };

    // Calculate percentage of active users today
    const activeRate = transformedData.totalUsers > 0
        ? Math.round((transformedData.activeToday / transformedData.totalUsers) * 100)
        : 0;

    // Animation variants for Framer Motion
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-8">
            {/* Header with global statistics */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Total users */}
                <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-t-4 border-t-blue-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                                <Users className="h-4 w-4 mr-2 text-blue-500" />
                                Total Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-800">{transformedData.totalUsers}</div>
                            <p className="text-xs text-gray-500 mt-1">All accounts combined</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Active users today */}
                <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-t-4 border-t-green-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                                <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                                Active Today
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end">
                                <div className="text-3xl font-bold text-gray-800">{transformedData.activeToday}</div>
                                <div className="ml-2 mb-1 text-sm font-medium text-green-600">
                                    {activeRate}%
                                </div>
                            </div>
                            <Progress value={activeRate} className="h-1 mt-2" />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Most active role */}
                <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-t-4 border-t-purple-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                                <Activity className="h-4 w-4 mr-2 text-purple-500" />
                                Most Active Role
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-800">
                                {mostActiveRole.role || "None"}
                            </div>
                            <div className="flex items-center mt-1">
                                <span className="text-xs text-gray-500">
                                    {mostActiveRole.active} active users
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Last activity */}
                <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-t-4 border-t-amber-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                Last Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-800">
                                {transformedData.recentLogins.length > 0 ?
                                    formatLastLogin(transformedData.recentLogins[0].lastLogin) :
                                    "None"}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Last recorded login</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Tabs for different views */}
            <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="activity" className="data-[state=active]:bg-blue-50">
                        <BarChart className="w-4 h-4 mr-2" />
                        Activity by role
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="data-[state=active]:bg-blue-50">
                        <Clock className="w-4 h-4 mr-2" />
                        Recent logins
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-0">
                    <Card className="border shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-gray-700">Activity by role</CardTitle>
                            <CardDescription>Distribution of users by role and activity rate</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {ROLES.map((role) => {
                                    const stats = transformedData.roleStats[role];
                                    const activeRate = calculateActiveRate(role);
                                    const colors = roleColors[role];

                                    return (
                                        <motion.div
                                            key={role}
                                            className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center">
                                                    <Shield className={`h-5 w-5 mr-2 ${colors.text}`} />
                                                    <h3 className={`font-semibold ${colors.text}`}>
                                                        {role.replace('_', ' ')}
                                                    </h3>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {activeRate}% active
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span>Total: {stats.count}</span>
                                                <span>Active: {stats.active}</span>
                                            </div>
                                            <Progress
                                                value={activeRate}
                                                className="h-2 bg-white"
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recent" className="mt-0">
                    <Card className="border shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-gray-700">Recent logins</CardTitle>
                            <CardDescription>The 10 most recent logged-in users</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {transformedData.recentLogins.length > 0 ? (
                                    transformedData.recentLogins.map((login, index) => {
                                        const colors = roleColors[login.role];

                                        return (
                                            <motion.div
                                                key={login.id}
                                                className="flex items-center justify-between border-b pb-4 last:border-0"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <Avatar className="border-2 border-gray-100">
                                                        <AvatarFallback className={`${colors.bg} ${colors.text}`}>
                                                            {login.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{login.name}</p>
                                                        <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center ${colors.bg} ${colors.text}`}>
                                                            {login.role.replace('_', ' ')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                                                    {formatLastLogin(login.lastLogin)}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No recent logins</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default UserStats;