import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Bell, Store } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { name?: string; email?: string; role: string };
  const userRole = user.role;
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(userRole);
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole}
        userName={user.name || ""}
        userEmail={user.email || ""}
      />
      <SidebarInset>
        {/* ── Top bar ──────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-1 items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">
              Admin Panel
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Store className="size-3.5" />
                View Store
              </Link>
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
