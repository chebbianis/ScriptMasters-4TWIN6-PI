import { clsx } from 'clsx';
import { FC, useState, useEffect } from "react";
import { getColumns } from "./table/columns";
import { DataTable } from "./table/table";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { DataTableFacetedFilter } from "./table/table-faceted-filter";
import { priorities, statuses } from "./table/data";
import useTaskTableFilter from "@/hooks/use-task-table-filter";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { TaskType } from "@/types/api.type";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateTaskForm from "./create-task-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Health from "./Health";
import { BellOff } from 'lucide-react';
import { Task } from "@/types/task";

const fetchTasks = async ({
  workspaceId,
  projectId,
  keyword,
  status,
  priority,
  assignedTo,
  pageNumber,
  pageSize,
}: {
  workspaceId: string;
  projectId?: string;
  keyword?: string | null;
  status?: string | null;
  priority?: string | null;
  assignedTo?: string | null;
  pageNumber: number;
  pageSize: number;
}) => {
  const queryParams = new URLSearchParams({
    workspaceId,
    ...(projectId && { projectId }),
    ...(keyword && { keyword }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedTo && { assignedTo }),
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  const response = await fetch(`http://localhost:3000/task/all?${queryParams}`);
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
};

const isDueTomorrow = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

type Filters = ReturnType<typeof useTaskTableFilter>[0];
type SetFilters = ReturnType<typeof useTaskTableFilter>[1];

interface DataTableFilterToolbarProps {
  isLoading?: boolean;
  projectId?: string;
  filters: Filters;
  setFilters: SetFilters;
}

interface TaskTableProps {
    tasks: Task[];
    onTaskUpdate: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
    onClearReminder: (taskId: string) => void;
}

export const TaskTable: FC<TaskTableProps> = ({ tasks, onTaskUpdate, onTaskDelete, onClearReminder }) => {
    return (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tâche</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'échéance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                    <tr 
                        key={task._id}
                        className={clsx(
                            'hover:bg-gray-50',
                            task.reminder && new Date(task.dueDate) < new Date() && 'bg-red-50',
                            !task.reminder && isDueTomorrow(task.dueDate) && 'bg-orange-50'
                        )}
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                                {task.project.emoji} {task.project.name}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {task.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {task.priority}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {task.reminder && (
                                <button
                                    onClick={() => onClearReminder(task._id)}
                                    className="text-gray-400 hover:text-gray-500 mr-4"
                                    data-testid={`clear-reminder-${task._id}`}
                                >
                                    <BellOff className="h-5 w-5" />
                                </button>
                            )}
                            <button
                                onClick={() => onTaskDelete(task._id)}
                                className="text-red-600 hover:text-red-900"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TaskTable;