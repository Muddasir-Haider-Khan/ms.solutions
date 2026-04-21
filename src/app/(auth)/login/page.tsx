import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-auto items-center justify-center">
            <img src="/images/logo.png" alt="MS Solutions" className="h-12 w-auto object-contain" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Business Management System
          </p>
        </div>
        <LoginForm existingSession={session} />
      </div>
    </div>
  );
}
