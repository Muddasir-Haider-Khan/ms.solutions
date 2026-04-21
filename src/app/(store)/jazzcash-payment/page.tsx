"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

/**
 * JazzCash Payment Page
 *
 * This page is reached after a JazzCash order is placed.
 * It calls /api/jazzcash/initiate to get the signed form params,
 * then auto-submits the form to JazzCash's hosted page.
 *
 * URL params required:
 *   orderId, amount, orderNumber
 */
export default function JazzCashPaymentPage() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{ action: string; params: Record<string, string> } | null>(null);

  const orderId     = searchParams.get("orderId") ?? "";
  const amount      = searchParams.get("amount") ?? "";
  const orderNumber = searchParams.get("orderNumber") ?? "";

  useEffect(() => {
    if (!orderId || !amount || !orderNumber) {
      setError("Missing payment parameters. Please return to checkout.");
      setLoading(false);
      return;
    }

    fetch("/api/jazzcash/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        amount: parseFloat(amount),
        orderNumber,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to initiate payment");
        }
        return data;
      })
      .then(({ formAction, params }) => {
        setFormData({ action: formAction, params });
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message ?? "Something went wrong");
        setLoading(false);
      });
  }, [orderId, amount, orderNumber]);

  // Auto-submit when form data is ready
  useEffect(() => {
    if (formData && formRef.current) {
      const timer = setTimeout(() => {
        formRef.current?.submit();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5] p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-lg text-center">
        {/* JazzCash brand colors */}
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "#ee1c24" }}
        >
          <span className="text-[20px] font-black text-white leading-none">J</span>
        </div>

        <h1 className="mt-5 text-[20px] font-bold text-gray-900">
          {loading ? "Preparing Payment…" : error ? "Payment Error" : "Redirecting to JazzCash…"}
        </h1>

        {loading && (
          <>
            <p className="mt-2 text-[13px] text-gray-500">
              Securely connecting to JazzCash payment gateway
            </p>
            <div className="mt-6 flex justify-center">
              <Loader2 className="size-8 animate-spin text-[#ee1c24]" />
            </div>
          </>
        )}

        {!loading && !error && formData && (
          <>
            <p className="mt-2 text-[13px] text-gray-500">
              You will be redirected automatically. Do not close this window.
            </p>
            <div className="mt-6 flex justify-center">
              <Loader2 className="size-8 animate-spin text-[#ee1c24]" />
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-gray-400">
              <ShieldCheck className="size-4 text-green-500" />
              Secured by JazzCash
            </div>

            {/* Hidden form — auto-submitted */}
            <form
              ref={formRef}
              method="POST"
              action={formData.action}
              className="hidden"
            >
              {Object.entries(formData.params).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
            </form>

            {/* Fallback manual button */}
            <button
              type="button"
              onClick={() => formRef.current?.submit()}
              className="mt-4 text-[12px] text-gray-400 underline hover:text-gray-600"
            >
              Click here if not redirected automatically
            </button>
          </>
        )}

        {error && (
          <>
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {error}
            </p>
            <a
              href="/checkout"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#00796b] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#00695c]"
            >
              Return to Checkout
            </a>
          </>
        )}

        <p className="mt-6 text-[11px] text-gray-300">
          Order #{orderNumber}
        </p>
      </div>
    </div>
  );
}
