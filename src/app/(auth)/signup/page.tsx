import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignupForm } from "@/components/store/signup-form";
import { Star, Tag, Zap } from "lucide-react";

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
    <div className="grid min-h-screen lg:grid-cols-2" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
      {/* Left panel — branding */}
      <div className="relative hidden flex-col overflow-hidden bg-[#1a1a1a] p-12 lg:flex">
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-32 -top-32 size-[500px] rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -right-20 -top-20 size-[380px] rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-[400px] rounded-full bg-[#00796b]/5" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#00796b]">
            <img src="/logo-icon.svg" alt="Multi Solutions" className="size-6" />
          </div>
          <div>
            <p className="text-[17px] font-bold leading-tight text-white">Multi Solutions</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Electronics Store</p>
          </div>
        </Link>

        {/* Tagline */}
        <div className="mt-auto">
          <h2 className="text-[38px] font-bold leading-tight text-white">
            Join thousands<br />
            of happy<br />
            <span className="text-[#00796b]">shoppers.</span>
          </h2>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/40">
            Create your free account and unlock exclusive deals, order tracking, and a seamless shopping experience.
          </p>

          {/* Benefits */}
          <div className="mt-8 space-y-3">
            {[
              { icon: Tag,   label: "Exclusive member discounts" },
              { icon: Zap,   label: "Faster checkout every time" },
              { icon: Star,  label: "Order history & easy reorders" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#00796b]/10">
                  <Icon className="size-4 text-[#00796b]" />
                </div>
                <span className="text-[13px] text-white/60">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="mt-12 text-[12px] text-white/20">
          &copy; {new Date().getFullYear()} Multi Solutions Store. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center bg-white px-6 py-10">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#00796b]">
              <img src="/logo-icon.svg" alt="Multi Solutions" className="size-5" />
            </div>
            <div>
              <p className="text-[16px] font-bold leading-tight">Multi Solutions</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Electronics Store</p>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          <SignupForm />
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          <Link href="/" className="transition-colors hover:text-gray-700">
            ← Back to Store
          </Link>
        </p>
      </div>
    </div>
  );
}
