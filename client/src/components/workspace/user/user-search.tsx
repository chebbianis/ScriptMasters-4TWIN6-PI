import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Users, Check, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchUsersQueryFn, updateUserRoleMutationFn } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import API from "@/lib/axios-client";

const UserSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        role: 'all' as 'all' | 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER',
        status: 'all' as 'all' | 'active' | 'inactive',
        limit: 10
    });
    const [isExporting, setIsExporting] = useState(false);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['searchUsers', searchParams],
        queryFn: () => searchUsersQueryFn(searchParams),
        enabled: true
    });

    // Mutation pour modifier le rôle
    const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
        mutationFn: updateUserRoleMutationFn,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });

            toast({
                title: "Rôle mis à jour",
                description: `Le rôle de ${data.data?.name} a été modifié avec succès.`,
                variant: "default",
            });
            setEditingUser(null);
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de modifier le rôle de l'utilisateur.",
                variant: "destructive",
            });
        }
    });

    const handleSearch = () => {
        refetch();
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);

            // Appeler directement l'API pour obtenir les données
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
            link.setAttribute('download', 'utilisateurs.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Exportation réussie",
                description: "Le fichier d'exportation a été téléchargé",
                variant: "default",
            });
        } catch (error) {
            toast({
                title: "Erreur d'exportation",
                description: "Impossible d'exporter les utilisateurs",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER') => {
        updateRole({ userId, role: newRole });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Jamais';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">Recherche d'utilisateurs</CardTitle>
                    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Exportation...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Exporter
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Rechercher par nom ou email"
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
                                <SelectValue placeholder="Rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les rôles</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="PROJECT_MANAGER">Chef de projet</SelectItem>
                                <SelectItem value="DEVELOPER">Développeur</SelectItem>
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
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="active">Actifs</SelectItem>
                                <SelectItem value="inactive">Inactifs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSearch}>
                        <Search className="w-4 h-4 mr-2" />
                        Rechercher
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center my-10">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : data?.data && data.data.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Dernière connexion</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.map((user) => (
                                <TableRow key={user.id}>
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
                                        {editingUser === user.id ? (
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
                                                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                                                        <SelectItem value="PROJECT_MANAGER">Chef de projet</SelectItem>
                                                        <SelectItem value="DEVELOPER">Développeur</SelectItem>
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
                                            <Badge variant="outline" className="cursor-pointer" onClick={() => setEditingUser(user.id)}>
                                                {user.role}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                            {user.isActive ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-1.5 text-sm justify-end">
                                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                                            <span className={!user.lastLogin ? "text-gray-500 italic" : ""}>
                                                {formatDate(user.lastLogin)}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                        <p>Aucun utilisateur trouvé</p>
                        <p className="text-sm">Essayez d'autres critères de recherche</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UserSearch; 