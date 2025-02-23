import { useState } from "react";
import { Link } from "react-router-dom";
import { EllipsisIcon, Loader, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroupContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/logo";
import LogoutDialog from "./logout-dialog";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { Separator } from "../ui/separator";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/auth-provider";

const Asidebar = () => {
  const { isLoading, user } = useAuthContext();
  const { open } = useSidebar();
  const workspaceId = useWorkspaceId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="!py-0 dark:bg-background">
          <div className="flex h-[50px] items-center justify-start w-full px-1">
            {/* Modification du lien du logo */}
            <Logo url={user ? `/workspace/${workspaceId}` : "/"} />

            {open && (
              <Link
                to={user ? `/workspace/${workspaceId}` : "/"}
                className="hidden md:flex ml-2 items-center gap-2 self-center font-medium"
              >
                Team Sync.
              </Link>
            )}
          </div>
        </SidebarHeader>

        {/* Masquer le contenu si non connecté */}
        {user && (
          <SidebarContent className="!mt-0 dark:bg-background">
            <SidebarGroup className="!py-0">
              <SidebarGroupContent>
                <WorkspaceSwitcher />
                <Separator />
                <NavMain />
                <Separator />
                <NavProjects />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        )}

        <SidebarFooter className="dark:bg-background">
          <SidebarMenu>
            <SidebarMenuItem>
              {isLoading ? (
                <Loader
                  size="24px"
                  className="place-self-center self-center animate-spin"
                />
              ) : user ? (
                // Contenu utilisateur connecté
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage src={user?.profilePicture || ""} />
                        <AvatarFallback className="rounded-full border border-gray-500">
                          {user?.name?.split(/\s+/)[0]?.[0]}
                          {user?.name?.split(/\s+/)[1]?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user?.name || "Utilisateur"}
                        </span>
                        <span className="truncate text-xs">
                          {user?.email || "Non connecté"}
                        </span>
                      </div>
                      <EllipsisIcon className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side={"bottom"}
                    align="start"
                    sideOffset={4}
                  >
                    <DropdownMenuGroup></DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsOpen(true)}>
                      <LogOut />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Lien de connexion si non connecté
                <Link
                  to="/login"
                  className="flex items-center gap-2 p-2 text-sm hover:bg-accent w-full"
                >
                  <span className="ml-2">Se connecter</span>
                </Link>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <LogoutDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
};

export default Asidebar;