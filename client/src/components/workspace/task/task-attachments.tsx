import React, { useState, useRef, useEffect, FC } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileIcon, Link, X, Upload, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/constants";
import path from 'path';

interface Attachment {
    _id: string;
    name: string;
    type: 'FILE' | 'EXTERNAL_LINK' | 'GOOGLE_DRIVE' | 'DROPBOX';
    url: string;
    size?: number;
    mimeType?: string;
}

interface TaskAttachmentsProps {
    taskId: string;
    userId: string;
}

const TaskAttachments: FC<TaskAttachmentsProps> = ({ taskId, userId }) => {
    const { toast } = useToast();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [linkData, setLinkData] = useState({ name: '', url: '', type: 'EXTERNAL_LINK' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load attachments when component mounts or taskId changes
    useEffect(() => {
        if (taskId) {
            loadAttachments();
        }
    }, [taskId]);

    // Load attachments
    const loadAttachments = async () => {
        if (!taskId) {
            console.error('No taskId provided');
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/task/${taskId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to load attachments');
            }

            const data = await response.json();
            console.log('Loaded attachments:', data.task?.attachments);
            setAttachments(data.task?.attachments || []);
        } catch (error) {
            console.error('Error loading attachments:', error);
            toast({
                title: "Error",
                description: "Failed to load attachments",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (file: File) => {
        if (!file) {
            toast({
                title: "Error",
                description: "Please select a file to upload",
                variant: "destructive",
            });
            return;
        }

        if (!taskId || !userId) {
            toast({
                title: "Error",
                description: "Missing task ID or user ID",
                variant: "destructive",
            });
            return;
        }

        try {
            console.log('Starting file upload:', {
                fileName: file.name,
                fileSize: file.size,
                taskId,
                userId
            });

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast({
                    title: "Error",
                    description: "File size exceeds 10MB limit",
                    variant: "destructive",
                });
                return;
            }

            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);

            console.log('Sending file upload request to:', `${API_URL}/task/${taskId}/attachments/file`);

            const response = await fetch(`${API_URL}/task/${taskId}/attachments/file`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();
            console.log('File upload response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload file');
            }

            console.log('Reloading attachments after successful upload');
            // Reload attachments to get the latest data
            await loadAttachments();
            
            toast({
                title: "Success",
                description: "File uploaded successfully",
                variant: "default",
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to upload file",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    // Gérer l'ajout de lien
    const handleAddLink = async () => {
        try {
            const response = await fetch(`${API_URL}/task/${taskId}/attachments/link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...linkData,
                    userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add link');
            }
            
            toast({
                title: "Success",
                description: "Link added successfully",
                variant: "default",
            });
            
            setShowAddDialog(false);
            setLinkData({ name: '', url: '', type: 'EXTERNAL_LINK' });
            loadAttachments(); // Recharger les attachements
        } catch (error) {
            console.error('Error adding link:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add link",
                variant: "destructive",
            });
        }
    };

    // Supprimer un attachement
    const handleDelete = async (attachmentId: string) => {
        try {
            const response = await fetch(`${API_URL}/task/${taskId}/attachments/${attachmentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete attachment');
            }
            
            toast({
                title: "Success",
                description: "Attachment deleted successfully",
                variant: "default",
            });
            
            setAttachments(prev => prev.filter(att => att._id !== attachmentId));
        } catch (error) {
            console.error('Error deleting attachment:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete attachment",
                variant: "destructive",
            });
        }
    };

    // Formater la taille du fichier
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(true)}
                >
                    <Link className="w-4 h-4 mr-2" />
                    Add Link
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                        }
                    }}
                />
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            ) : attachments.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                    No attachments yet
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment._id}
                            className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                        >
                            <div className="flex items-center gap-2">
                                <FileIcon className="w-4 h-4" />
                                <a
                                    href={attachment.url}
                                    download={attachment.type === 'FILE' ? 
                                        `image${attachment.mimeType?.includes('jpeg') ? '.jpg' : 
                                        attachment.mimeType?.includes('png') ? '.png' : 
                                        attachment.mimeType?.includes('gif') ? '.gif' : 
                                        attachment.mimeType?.includes('webp') ? '.webp' : '.jpg'}`
                                        : undefined}
                                    target={['EXTERNAL_LINK', 'GOOGLE_DRIVE', 'DROPBOX'].includes(attachment.type) ? "_blank" : undefined}
                                    rel={['EXTERNAL_LINK', 'GOOGLE_DRIVE', 'DROPBOX'].includes(attachment.type) ? "noopener noreferrer" : undefined}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    {attachment.name}
                                </a>
                                {attachment.size && (
                                    <span className="text-sm text-gray-500">
                                        ({formatFileSize(attachment.size)})
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(attachment._id)}
                            >
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add External Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={linkData.name}
                                onChange={(e) => setLinkData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter link name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">URL</label>
                            <Input
                                value={linkData.url}
                                onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
                                placeholder="Enter URL"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Type</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={linkData.type}
                                onChange={(e) => setLinkData(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="EXTERNAL_LINK">External Link</option>
                                <option value="GOOGLE_DRIVE">Google Drive</option>
                                <option value="DROPBOX">Dropbox</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddLink}>
                                Add Link
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TaskAttachments; 