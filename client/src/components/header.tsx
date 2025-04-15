import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "./ui/separator";
import { Link, useLocation } from "react-router-dom";
import useWorkspaceId from "@/hooks/use-workspace-id";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import { Bell } from "lucide-react";

const Header = () => {
  const location = useLocation();
  const workspaceId = useWorkspaceId();
  const pathname = location.pathname;

  const getPageLabel = (pathname) => {
    if (pathname.includes("/project/")) return "Project";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/tasks")) return "Tasks";
    if (pathname.includes("/members")) return "Members";
    return null;
  };

  const pageHeading = getPageLabel(pathname);

  // Supposons que l'utilisateur connecté est stocké dans le localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <header className="flex sticky top-0 z-50 bg-white h-12 shrink-0 items-center border-b px-3">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block text-[15px]">
              {pageHeading ? (
                <BreadcrumbLink asChild>
                  <Link to={`/workspace/${workspaceId}`}>Dashboard</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="line-clamp-1">Dashboard</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {pageHeading && (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="text-[15px]">
                  <BreadcrumbPage className="line-clamp-1">
                    {pageHeading}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {/* Zone Notifications */}
      <div className="flex items-center gap-4">
        {user && user.id ? (
          <NotificationsDropdown userId={user.id} />
        ) : (
<div className="relative">
  <Bell className="h-6 w-6 text-gray-500" />
  {unreadCount > 0 && (
    <span className="absolute top-[-3px] right-[-5px] bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</div>       )}
      </div>
    </header>
  );
};

export default Header;
