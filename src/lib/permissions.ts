import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export type RoleName = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";

const ROLE_HIERARCHY: Record<RoleName, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 50,
  STAFF: 30,
  CUSTOMER: 10,
};

export function hasPermission(userRole: string, requiredRole: RoleName): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as RoleName] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: RoleName) {
  const session = await requireAuth();
  if (!hasPermission((session.user as { role: string }).role, role)) {
    redirect("/unauthorized");
  }
  return session;
}

/** Any admin staff (STAFF, ADMIN, SUPER_ADMIN) */
export async function requireAdmin() {
  return requireRole("STAFF");
}

/** ADMIN or SUPER_ADMIN only — STAFF is excluded */
export async function requireAdminRole() {
  return requireRole("ADMIN");
}

export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}
