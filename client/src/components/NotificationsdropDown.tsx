import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotificationsQueryFn, markNotificationAsRead } from "@/lib/api";
import { socket } from "@/lib/socket";
import { Bell } from "lucide-react";

interface NotificationsDropdownProps {
  userId: string;
}

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const NotificationsDropdown = ({ userId }: NotificationsDropdownProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Utilisation directe des données de la query sans state local
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getNotificationsQueryFn(userId),
    enabled: !!userId,
    initialData: { notifications: [] },
  });

  const notifications = notificationsData?.notifications || [];

  useEffect(() => {
    if (!userId) return;

    socket.emit("join", userId);
    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [userId]);

  const handleNewNotification = (newNotification: Notification) => {
    queryClient.setQueryData(["notifications", userId], (old: any) => ({
      notifications: [newNotification, ...(old?.notifications || [])],
    }));
  };

  const handleNotificationClick = async (notificationId: string) => {
    try {
      // Mise à jour optimiste immédiate
      queryClient.setQueryData(["notifications", userId], (old: any) => ({
        notifications: old.notifications.map((notif: Notification) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        ),
      }));

      await markNotificationAsRead(notificationId);
      
      // Rafraîchissement silencieux après succès
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
        exact: true,
      });
    } catch (error) {
      console.error("Erreur lors du marquage comme lu :", error);
      // Rollback en cas d'erreur
      queryClient.setQueryData(["notifications", userId], (old: any) => ({
        notifications: old.notifications.map((notif: Notification) =>
          notif._id === notificationId ? { ...notif, read: false } : notif
        ),
      }));
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  return (
    <div className="relative">
<Button
  onClick={() => setIsOpen(!isOpen)}
  variant="ghost"
  className="relative hover:bg-gray-100 p-2"
>
  <Bell className="h-5 w-5" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-xl z-50">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Aucune notification</div>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y">
              {notifications.map((notif) => (
                <li
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif._id)}
                  className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read 
                      ? "bg-blue-50 font-medium text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  <div className="text-sm">{notif.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;