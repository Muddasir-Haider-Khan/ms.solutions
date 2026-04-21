import Link from "next/link";
import { XCircle } from "lucide-react";

export default async function OrderFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason ?? "Payment was not completed";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
        <XCircle className="size-8 text-red-500" />
      </div>
      <h1 className="mt-5 text-[24px] font-bold text-gray-900">Payment Failed</h1>
      <p className="mt-2 text-[14px] text-gray-500 max-w-sm">
        {reason === "tampered"
          ? "Payment verification failed. Please try again or contact support."
          : reason === "config"
          ? "Payment gateway is not configured. Please contact support."
          : reason === "not_found"
          ? "Order not found. Please contact support."
          : reason}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/checkout"
          className="rounded-full bg-[#00796b] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#00695c]"
        >
          Try Again
        </Link>
        <Link
          href="/cart"
          className="rounded-full border border-gray-300 px-6 py-3 text-[14px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          Return to Cart
        </Link>
      </div>
    </div>
  );
}
