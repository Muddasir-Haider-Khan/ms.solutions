"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

export function LoginForm({ existingSession }: { existingSession?: Session | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (existingSession?.user) {
    const role = (existingSession.user as { role: string }).role;
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Already Signed In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-primary/5 p-4 text-sm text-muted-foreground">
            <p>You are currently signed in as:</p>
            <p className="mt-1 font-medium text-foreground">{existingSession.user.email}</p>
            <p className="mt-1 text-xs">Role: {role}</p>
          </div>
          
          <div className="flex flex-col gap-2">
            {isAdmin ? (
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                Go to Storefront
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => signOut({ callbackUrl: "/login" })} 
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid admin credentials");
      } else {
        // Verify this is an admin user by checking the session
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;

        if (role && ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role)) {
          router.push("/dashboard");
          router.refresh();
        } else {
          // Not an admin — sign them out and show error
          await signIn("credentials", { redirect: false }); // noop
          setError("Access denied. Admin credentials required.");
          // Sign out the non-admin user
          const { signOut } = await import("next-auth/react");
          await signOut({ redirect: false });
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@msmultisolution.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          This portal is for admin and staff only.
        </p>
      </CardContent>
    </Card>
  );
}
