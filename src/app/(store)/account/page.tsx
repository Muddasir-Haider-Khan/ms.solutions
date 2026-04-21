import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Package, Lock, MapPin, CreditCard, UserCircle } from "lucide-react";

export const metadata = {
  title: "Your Account - MS Solutions",
  description: "Manage your MS Solutions account",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  const accountLinks = [
    {
      title: "Your Orders",
      description: "Track, return, or buy things again",
      icon: Package,
      href: "/account/orders",
    },
    {
      title: "Login & security",
      description: "Edit login, name, and mobile number",
      icon: Lock,
      href: "/account/security",
    },
    {
      title: "Your Addresses",
      description: "Edit addresses for orders",
      icon: MapPin,
      href: "/account/addresses",
    },
    {
      title: "Payment options",
      description: "Edit or add payment methods",
      icon: CreditCard,
      href: "/account/payments",
    },
    {
      title: "Your Profile",
      description: "Manage your customer profile",
      icon: UserCircle,
      href: "/account/profile",
    },
  ];

  return (
    <div className="bg-white min-h-[60vh] py-6 px-4 md:px-8">
      <div className="max-w-[1000px] mx-auto">
        <h1 className="text-[28px] font-normal text-[#0F1111] mb-6">Your Account</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accountLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="border border-[#D5D9D9] rounded-lg p-5 flex items-start gap-4 hover:bg-[#F7FAFA] transition-colors group cursor-pointer"
            >
              <div className="mt-1">
                <link.icon className="size-8 text-[#007185] group-hover:text-[#C7511F]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[16px] font-normal text-[#0F1111] leading-snug">{link.title}</h2>
                <p className="text-[14px] text-[#565959] mt-1 leading-snug">
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
