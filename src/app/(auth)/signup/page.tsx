import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import Link from "next/link";
import { SignupForm } from "@/components/store/signup-form";

export const metadata = {
  title: "Sign Up - MS Solutions",
  description: "Create your account to start shopping at MS Solutions",
};

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const role = (session.user as { role: string }).role;
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role);
    redirect(isAdmin ? "/dashboard" : "/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary/5">
      {/* Decorative elements */}
      <div className="pointer-events-none fixed -right-40 -top-40 size-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 size-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative w-full max-w-md px-4 py-8">
        {/* Logo and branding */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/images/logo.png" alt="MS Solutions" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* Signup Form */}
        <SignupForm />

        {/* Back to store */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            href="/"
            className="hover:text-foreground transition-colors"
          >
            ← Back to Store
          </Link>
        </p>
      </div>
    </div>
  );
}
