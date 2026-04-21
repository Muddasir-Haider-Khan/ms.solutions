import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/slugs";

export const metadata = {
  title: "Your Orders - MS Solutions",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/account/orders");
  }

  // Fetch orders attached to this userId
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="bg-white min-h-[60vh] py-6 px-4 md:px-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Breadcrumb / Title */}
        <div className="mb-4 text-[14px]">
          <Link href="/account" className="text-[#007185] hover:text-[#C7511F] hover:underline">Your Account</Link>
          <span className="text-[#565959] mx-2">›</span>
          <span className="text-[#C7511F]">Your Orders</span>
        </div>
        <h1 className="text-[28px] font-normal text-[#0F1111] mb-6">Your Orders</h1>

        <div className="flex gap-4 border-b border-[#D5D9D9] mb-4 text-[14px]">
          <div className="font-bold text-[#0F1111] pb-2 border-b-2 border-[#E77600]">Orders</div>
          <div className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer pb-2">Not Yet Dispatched</div>
          <div className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer pb-2">Cancelled Orders</div>
        </div>

        <div className="flex flex-col gap-6">
          {orders.length === 0 ? (
            <div className="py-8 text-center text-[#565959]">
              <p>Looks like you haven't placed an order yet.</p>
              <Link href="/shop" className="text-[#007185] hover:text-[#C7511F] hover:underline mt-2 inline-block">
                Start shopping
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="border border-[#D5D9D9] rounded-lg overflow-hidden">
                {/* Order Header */}
                <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] p-4 flex flex-wrap gap-4 md:gap-8 text-[12px] text-[#565959]">
                  <div className="flex flex-col gap-1">
                    <span className="uppercase">Order Placed</span>
                    <span className="text-[#0F1111]">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="uppercase">Total</span>
                    <span className="text-[#0F1111]">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="uppercase">Dispatch To</span>
                    <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">{order.customerName}</span>
                  </div>
                  <div className="flex flex-col gap-1 md:ml-auto md:text-right">
                    <span className="uppercase">Order # {order.orderNumber}</span>
                    <div className="space-x-2">
                       <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">View order details</span>
                       <span>|</span>
                       <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">Invoice</span>
                    </div>
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-4 bg-white">
                  <div className="text-[18px] font-bold text-[#0F1111] mb-4">
                    {order.status === "DELIVERED" ? "Delivered" :
                     order.status === "SHIPPED" ? "Shipped" :
                     order.status === "PROCESSING" ? "Preparing for shipment" :
                     order.status === "CANCELLED" ? "Cancelled" :
                     "Preparing for shipment"}
                  </div>

                  <div className="flex flex-col gap-4">
                    {order.items.map((item) => {
                       const image = item.product?.images?.[0]?.url;
                       return (
                         <div key={item.id} className="flex gap-4">
                           <div className="w-[90px] h-[90px] shrink-0">
                             {image ? (
                               <img src={image} alt={item.productName} className="w-full h-full object-contain" />
                             ) : (
                               <div className="w-full h-full bg-[#F8F8F8] border border-[#D5D9D9] flex items-center justify-center text-[#565959] text-[10px]">No image</div>
                             )}
                           </div>
                           <div className="flex-1 flex flex-col items-start text-[14px]">
                             <Link href={item.product?.slug ? `/shop/${item.product.slug}` : "#"} className="text-[#007185] hover:text-[#C7511F] hover:underline font-bold mb-1">
                               {item.productName}
                             </Link>
                             <span className="text-[#565959] text-[12px] mb-2">Return window closed</span>
                             
                             <div className="mt-auto flex gap-2">
                               <button className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full px-4 h-[28px] text-[12px] shadow-sm border border-[#FCD200]/50">
                                 Buy it again
                               </button>
                               <button className="bg-white hover:bg-[#F3F3F3] text-[#0F1111] rounded-full px-4 h-[28px] text-[12px] shadow-sm border border-[#D5D9D9]">
                                 View your item
                               </button>
                             </div>
                           </div>
                         </div>
                       )
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
