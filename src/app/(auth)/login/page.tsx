import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const role = (session.user as { role: string }).role;
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role);
    redirect(isAdmin ? "/dashboard" : "/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Multi Solutions Company</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Business Management System
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
