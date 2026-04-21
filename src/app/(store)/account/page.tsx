import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, User, MapPin, LogOut, ChevronRight } from "lucide-react";

export const metadata = {
  title: "My Account - Multi Solutions Store",
  description: "Manage your Multi Solutions Store account",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/customer-login?callbackUrl=/account");
  }

  const user = session.user as { name?: string | null; email?: string | null; role: string };
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const menuItems = [
    {
      icon: ShoppingBag,
      label: "My Orders",
      description: "View your order history and track shipments",
      href: "/account/orders",
    },
    {
      icon: User,
      label: "Profile",
      description: "Manage your personal information",
      href: "#",
    },
    {
      icon: MapPin,
      label: "Saved Addresses",
      description: "Manage your delivery addresses",
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-5">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#00796b] text-xl font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Welcome back</p>
              <h1 className="mt-0.5 text-[22px] font-bold text-white">{user.name || "Customer"}</h1>
              <p className="text-[13px] text-white/50">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
          {menuItems.map(({ icon: Icon, label, description, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#f0faf9]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#00796b]/10">
                <Icon className="size-5 text-[#00796b]" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-gray-900">{label}</p>
                <p className="text-[12px] text-gray-500">{description}</p>
              </div>
              <ChevronRight className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}

          {/* Sign out */}
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-red-50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <LogOut className="size-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-red-600">Sign Out</p>
                <p className="text-[12px] text-gray-500">Sign out of your account</p>
              </div>
              <ChevronRight className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-[13px] text-[#00796b] hover:underline">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
