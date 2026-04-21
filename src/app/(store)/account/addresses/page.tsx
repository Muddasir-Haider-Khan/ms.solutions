import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Your Addresses - MS Solutions",
};

export default async function AddressesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/account/addresses");
  }

  // Fetch customer profiles attached to this userId
  const addresses = await prisma.customer.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-white min-h-[60vh] py-6 px-4 md:px-8">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Breadcrumb / Title */}
        <div className="mb-4 text-[14px]">
          <Link href="/account" className="text-[#007185] hover:text-[#C7511F] hover:underline">Your Account</Link>
          <span className="text-[#565959] mx-2">›</span>
          <span className="text-[#C7511F]">Your Addresses</span>
        </div>
        <h1 className="text-[28px] font-normal text-[#0F1111] mb-6">Your Addresses</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Add Address Block */}
          <Link
            href="/account/addresses/new"
            className="border-2 border-dashed border-[#D5D9D9] rounded-lg p-6 flex flex-col items-center justify-center min-h-[250px] hover:bg-[#F7FAFA] transition-colors cursor-pointer group"
          >
            <Plus className="size-12 text-[#D5D9D9] group-hover:text-[#007185] transition-colors" />
            <span className="text-[18px] font-bold text-[#565959] group-hover:text-[#007185] mt-2">Add Address</span>
          </Link>

          {/* Existing Addresses */}
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="border border-[#D5D9D9] rounded-lg p-5 flex flex-col relative"
            >
              <div className="text-[14px] text-[#0F1111] mb-1 leading-snug font-bold border-b border-[#D5D9D9] pb-2">
                {addr.name} {addr.companyName && `(${addr.companyName})`}
              </div>
              <div className="text-[14px] text-[#0F1111] mt-2 leading-relaxed flex-1">
                <p>{addr.shippingAddress || addr.billingAddress || "No structured address details provided."}</p>
                {addr.phone && <p>Phone number: {addr.phone}</p>}
                {addr.email && <p>Email: {addr.email}</p>}
              </div>

              <div className="mt-4 pt-4 border-t border-[#D5D9D9] text-[14px] flex gap-3">
                <Link href={`/account/addresses/${addr.id}/edit`} className="text-[#007185] hover:text-[#C7511F] hover:underline">Edit</Link>
                <span className="text-[#D5D9D9]">|</span>
                <button className="text-[#007185] hover:text-[#C7511F] hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
