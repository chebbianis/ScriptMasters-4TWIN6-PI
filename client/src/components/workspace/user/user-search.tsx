import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Users, Check, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserRoleMutationFn } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import API from "@/lib/axios-client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const UserSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        role: 'all' as 'all' | 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER',
        status: 'all' as 'all' | 'active' | 'inactive',
        limit: 20,
        page: 1
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['searchUsers', searchParams],
        queryFn: async () => {
            // Build search parameters
            const params = new URLSearchParams();

            // Add search keyword if it exists
            if (searchParams.query) params.append('keyword', searchParams.query);

            // Add role if specified
            if (searchParams.role !== 'all') params.append('role', searchParams.role);

            // Add status if specified
            if (searchParams.status !== 'all') params.append('status', searchParams.status);

            // Add pagination parameters
            params.append('limit', searchParams.limit.toString());
            params.append('page', searchParams.page.toString());

            console.log("Search parameters:", Object.fromEntries(params.entries()));

            // Use the standard /user/search endpoint
            const response = await API.get(`/user/search?${params.toString()}`);

            // Add a log to see the raw data structure
            console.log("Raw API data:", response.data);

            // Mettre à jour le nombre total de pages et d'utilisateurs
            if (response.data.total) {
                setTotalUsers(response.data.total);
                setTotalPages(Math.ceil(response.data.total / searchParams.limit));
            } else {
                // Si l'API ne renvoie pas le total, on estime à partir du nombre d'éléments
                setTotalUsers(response.data.users?.length || 0);
                setTotalPages(response.data.users?.length > 0 ? 1 : 0);
            }

            // Transform data to the format expected by the component
            // explicitly checking the role property
            return {
                success: response.data.success,
                count: response.data.users?.length || 0,
                data: (response.data.users || []).map((user: any) => {
                    console.log("Raw user:", user);
                    return {
                        id: user._id || user.id,
                        name: user.name,
                        email: user.email,
                        // Ensure the role property is well defined
                        role: user.role || "",
                        isActive: user.isActive !== undefined ? user.isActive : true,
                        lastLogin: user.lastLogin || null
                    };
                })
            };
        },
        enabled: true
    });

    console.log("Received data:", data);

    // Mutation to modify role
    const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
        mutationFn: updateUserRoleMutationFn,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });

            toast({
                title: "Role updated",
                description: `${data.data?.name}'s role has been successfully modified.`,
                variant: "default",
            });
            setEditingUser(null);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Unable to modify user's role.",
                variant: "destructive",
            });
        }
    });

    // Add a new mutation for deletion
    const { mutate: deleteUser, isPending: isDeleting } = useMutation({
        mutationFn: async (userId: string) => {
            const response = await API.delete(`/user/${userId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            toast({
                title: "User deleted",
                description: "The user has been successfully deleted",
                variant: "default",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Unable to delete the user",
                variant: "destructive",
            });
        }
    });

    const handleSearch = () => {
        // Réinitialiser à la première page lors d'une nouvelle recherche
        setSearchParams(prev => ({ ...prev, page: 1 }));
        refetch();
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setSearchParams(prev => ({ ...prev, page: newPage }));
        refetch();
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);

            // Call API directly to get data
            const response = await API.get('/user/search', {
                params: {
                    role: searchParams.role !== 'all' ? searchParams.role : undefined,
                    status: searchParams.status !== 'all' ? searchParams.status : undefined,
                    query: searchParams.query || undefined,
                    limit: 1000
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Export successful",
                description: "The export file has been downloaded",
                variant: "default",
            });
        } catch (error) {
            toast({
                title: "Export error",
                description: "Unable to export users",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER') => {
        if (!userId) {
            toast({
                title: "Error",
                description: "Invalid user ID",
                variant: "destructive",
            });
            return;
        }

        updateRole({ userId, role: newRole });
        console.log(`Modifying role for user ${userId}: ${newRole}`);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const users = data?.data || [];

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">User Search</CardTitle>
                    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by name or email"
                            value={searchParams.query}
                            onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                            className="w-full"
                        />
                    </div>
                    <div className="w-full md:w-40">
                        <Select
                            value={searchParams.role}
                            onValueChange={(value) => setSearchParams({
                                ...searchParams,
                                role: value as 'all' | 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER'
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All roles</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                                <SelectItem value="DEVELOPER">Developer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-40">
                        <Select
                            value={searchParams.status}
                            onValueChange={(value) => setSearchParams({
                                ...searchParams,
                                status: value as 'all' | 'active' | 'inactive'
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSearch}>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center my-10">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : users.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Last Login</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user: any) => (
                                    <TableRow key={user.id || user._id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <Avatar>
                                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {editingUser === (user.id || user._id) ? (
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        defaultValue={user.role}
                                                        onValueChange={(value) => handleRoleChange(
                                                            user.id,
                                                            value as 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER'
                                                        )}
                                                        disabled={isUpdatingRole}
                                                    >
                                                        <SelectTrigger className="w-[140px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ADMIN">Administrator</SelectItem>
                                                            <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                                                            <SelectItem value="DEVELOPER">Developer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setEditingUser(null)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Badge
                                                    variant={
                                                        user.role === "ADMIN" ? "destructive" :
                                                            user.role === "PROJECT_MANAGER" ? "default" :
                                                                "outline"
                                                    }
                                                    className="cursor-pointer hover:opacity-90"
                                                    onClick={() => setEditingUser(user.id || user._id)}
                                                >
                                                    {user.role === "ADMIN" ? "Administrator" :
                                                        user.role === "PROJECT_MANAGER" ? "Project Manager" :
                                                            user.role === "DEVELOPER" ? "Developer" :
                                                                "Not defined"}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive === true ? "default" : "secondary"}>
                                                {user.isActive === true ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatDate(user.lastLogin)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action is irreversible. It will permanently delete the user
                                                            <span className="font-semibold"> {user.name}</span> and all associated data.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deleteUser(user.id || user._id)}
                                                            className="bg-red-500 hover:bg-red-600"
                                                        >
                                                            {isDeleting ? "Deleting..." : "Delete"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination controls */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Affichage de <span className="font-medium">{users.length}</span> utilisateurs
                                {totalUsers > 0 && (
                                    <> sur <span className="font-medium">{totalUsers}</span></>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(searchParams.page - 1)}
                                    disabled={searchParams.page <= 1 || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="sr-only">Page précédente</span>
                                </Button>
                                <div className="text-sm font-medium">
                                    Page {searchParams.page} sur {totalPages || 1}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(searchParams.page + 1)}
                                    disabled={searchParams.page >= totalPages || isLoading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="sr-only">Page suivante</span>
                                </Button>
                                <Select
                                    value={searchParams.limit.toString()}
                                    onValueChange={(value) => {
                                        const newLimit = parseInt(value);
                                        setSearchParams({ ...searchParams, limit: newLimit, page: 1 });
                                        refetch();
                                    }}
                                >
                                    <SelectTrigger className="w-[80px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                        <p>No users found</p>
                        <p className="text-sm">Try different search criteria</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UserSearch; 