"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  Users,
  FileText,
  ShoppingCart,
  Settings,
  UserCog,
  Store,
  ChevronDown,
  LogOut,
  BarChart3,
  Receipt,
  Image,
  Newspaper,
  LayoutTemplate,
  Share2,
  ExternalLink,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  staffAllowed?: boolean; // true = STAFF can access
};

const mainNav: NavItem[] = [
  { title: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard, staffAllowed: true },
  { title: "Products",   href: "/products",   icon: Package,         staffAllowed: true },
  { title: "Categories", href: "/categories", icon: FolderTree,      staffAllowed: true },
  { title: "Inventory",  href: "/inventory",  icon: Warehouse,       staffAllowed: true },
  { title: "Customers",  href: "/customers",  icon: Users,           staffAllowed: true },
];

const financeNav: NavItem[] = [
  { title: "Invoices", href: "/invoices", icon: FileText,    staffAllowed: false },
  { title: "Orders",   href: "/orders",   icon: ShoppingCart, staffAllowed: true },
  { title: "Reports",  href: "/reports",  icon: BarChart3,   staffAllowed: false },
];

const storeNav: NavItem[] = [
  { title: "Banners",      href: "/banners",      icon: Image,          staffAllowed: false },
  { title: "Hero Cards",   href: "/hero-cards",   icon: LayoutTemplate, staffAllowed: false },
  { title: "Articles",     href: "/articles",     icon: Newspaper,      staffAllowed: false },
  { title: "Social Links", href: "/social-links", icon: Share2,         staffAllowed: false },
];

const systemNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings, staffAllowed: false },
];

function isStaff(role: string) {
  return role === "STAFF";
}

export function AppSidebar({
  userRole,
  userName,
  userEmail,
}: {
  userRole: string;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const staffOnly = isStaff(userRole);

  function filterNav(items: NavItem[]) {
    if (staffOnly) return items.filter((i) => i.staffAllowed);
    return items;
  }

  const roleBadgeColor =
    userRole === "SUPER_ADMIN"
      ? "bg-amber-500/20 text-amber-300"
      : userRole === "ADMIN"
      ? "bg-teal-500/20 text-teal-300"
      : "bg-gray-500/20 text-gray-300";

  const roleLabel =
    userRole === "SUPER_ADMIN"
      ? "Super Admin"
      : userRole === "ADMIN"
      ? "Admin"
      : "Staff";

  const initials = userName
    ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : roleLabel.slice(0, 2).toUpperCase();

  return (
    <Sidebar>
      {/* ── Header / Brand ─────────────────────────────────────── */}
      <SidebarHeader className="border-b border-sidebar-border pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#00796b]">
                <img src="/logo-icon.svg" alt="" className="size-5" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[14px] font-bold tracking-tight text-sidebar-foreground">
                  Multi Solutions
                </span>
                <span className="truncate text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">
                  Business Manager
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav Content ────────────────────────────────────────── */}
      <SidebarContent className="gap-0">
        {/* Management */}
        {filterNav(mainNav).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterNav(mainNav).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Finance */}
        {filterNav(financeNav).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Finance</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterNav(financeNav).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Store Content */}
        {(!staffOnly && storeNav.length > 0) && (
          <SidebarGroup>
            <SidebarGroupLabel>Storefront</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="View Store"
                    render={<Link href="/" target="_blank" />}
                  >
                    <Store className="size-4" />
                    <span>View Store</span>
                    <ExternalLink className="ml-auto size-3 opacity-50" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {storeNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* System */}
        {(!staffOnly || isSuperAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterNav(systemNav).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {isSuperAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/users")}
                      tooltip="Users"
                      render={<Link href="/users" />}
                    >
                      <UserCog className="size-4" />
                      <span>Users</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer / User ───────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#00796b] text-[12px] font-bold text-white">
                  {initials}
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[13px] font-semibold text-sidebar-foreground">
                    {userName || "Admin"}
                  </span>
                  <span className={`truncate rounded text-[10px] font-semibold px-1.5 py-0.5 w-fit ${roleBadgeColor}`}>
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className="ml-auto size-4 text-sidebar-foreground/50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-48"
              >
                {!staffOnly && (
                  <DropdownMenuItem render={<Link href="/settings" />}>
                    <Settings className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  render={
                    <form action="/api/auth/signout" method="POST" className="w-full" />
                  }
                >
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
