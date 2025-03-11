import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import {
  getAvatarColor,
  getAvatarFallbackText,
  transformStatusEnum,
} from "@/lib/helper";
import { TaskType } from "@/types/api.type";
import { format } from "date-fns";
import { Calendar, Flag, User } from "lucide-react";

const RecentTasks = () => {
  // Données statiques conformes au type TaskType
  const tasks: TaskType[] = [
    {
      _id: "1",
      taskCode: "TSK-001",
      title: "Refactor authentication module",
      dueDate: "2024-03-15T00:00:00Z",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedTo: {
        _id: "user-1",
        name: "Alex Dubois",
        profilePicture: "/images/avatars/alex.jpg",
      },
      createdAt: "2024-03-01T09:00:00Z",
      updatedAt: "2024-03-05T14:30:00Z",
    },
    {
      _id: "2",
      taskCode: "TSK-002",
      title: "Update documentation",
      dueDate: "2024-03-20T00:00:00Z",
      status: "TODO",
      priority: "MEDIUM",
      assignedTo: null,
      createdAt: "2024-03-02T10:15:00Z",
    },
    {
      _id: "3",
      taskCode: "TSK-003",
      title: "Fix mobile responsiveness",
      dueDate: "2024-03-10T00:00:00Z",
      status: "DONE",
      priority: "LOW",
      assignedTo: {
        _id: "user-2",
        name: "Marie Leroy",
        profilePicture: null,
      },
      project: {
        _id: "project-1",
        emoji: "🚀",
        name: "Platform Launch",
      },
    },
  ];

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
      <ul role="list" className="divide-y divide-gray-200">
        {tasks.map((task) => {
          const name = task?.assignedTo?.name || "";
          const initials = getAvatarFallbackText(name);
          const avatarColor = getAvatarColor(name);

          return (
            <li
              key={task._id}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-300 cursor-pointer rounded-lg"
            >
              {/* Task Info */}
              <div className="flex flex-col space-y-1 flex-grow">
                <div className="flex items-center space-x-2">
                  <span className="text-sm capitalize text-gray-600 font-medium">
                    {task.taskCode}
                  </span>
                  {task.project && (
                    <span className="text-sm text-muted-foreground">
                      {task.project.emoji} {task.project.name}
                    </span>
                  )}
                </div>
                <p className="text-md font-semibold text-gray-800 truncate">
                  {task.title}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due: {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
                  </span>
                </div>
              </div>

              {/* Task Status */}
              <div className="text-sm font-medium">
                <Badge
                  variant={TaskStatusEnum[task.status]}
                  className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0 bg-blue-100 text-blue-800"
                >
                  <span>{transformStatusEnum(task.status)}</span>
                </Badge>
              </div>

              {/* Task Priority */}
              <div className="text-sm ml-2">
                <Badge
                  variant={TaskPriorityEnum[task.priority]}
                  className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0 bg-red-100 text-red-800"
                >
                  <Flag className="h-4 w-4" />
                  <span>{transformStatusEnum(task.priority)}</span>
                </Badge>
              </div>

              {/* Assignee */}
              <div className="flex items-center space-x-2 ml-2">
                {task.assignedTo ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={task.assignedTo.profilePicture || ""} alt={task.assignedTo.name} />
                    <AvatarFallback className={avatarColor}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="text-sm text-muted-foreground flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Unassigned</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucune tâche récente trouvée
        </div>
      )}
    </div>
  );
};

export default RecentTasks;