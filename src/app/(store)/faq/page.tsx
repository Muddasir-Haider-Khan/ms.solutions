import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata = {
  title: "FAQ - Multi Solutions Store",
  description: "Frequently asked questions about Multi Solutions Store",
};

const faqs = [
  {
    category: "Ordering",
    items: [
      {
        q: "How do I place an order?",
        a: "Browse our products, add items to your cart, and proceed to checkout. You'll need to sign in or create an account to complete your order. Fill in your shipping details and choose a payment method.",
      },
      {
        q: "Can I modify or cancel my order?",
        a: "Orders can be modified or cancelled within 2 hours of placement. Contact us via WhatsApp or email as soon as possible. Once your order is confirmed or shipped, changes may not be possible.",
      },
      {
        q: "How do I track my order?",
        a: "After placing your order, you can track it from your account under 'My Orders'. You'll also receive WhatsApp/SMS updates with your tracking information once your order is shipped.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        q: "What are your delivery areas?",
        a: "We deliver nationwide across Pakistan, including all major cities and remote areas. Delivery times may vary by location.",
      },
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 3–5 business days for major cities and 5–7 business days for other areas. Express delivery options are available at checkout.",
      },
      {
        q: "What is the shipping fee?",
        a: "Shipping fees are calculated at checkout based on your location and order size. Orders above a certain amount qualify for free shipping.",
      },
    ],
  },
  {
    category: "Payments",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Cash on Delivery (COD), Bank Transfer, JazzCash, and EasyPaisa. More payment methods may be added in the future.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes! Cash on Delivery is available nationwide. Simply select COD at checkout and pay when your order arrives.",
      },
      {
        q: "How do I pay via JazzCash or EasyPaisa?",
        a: "Select JazzCash or EasyPaisa at checkout. You'll be guided through the payment process. Ensure your mobile wallet is funded before placing the order.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 7 days of delivery for items in their original condition and packaging. Electronics must be unused and have all accessories included.",
      },
      {
        q: "How do I initiate a return?",
        a: "Contact us via WhatsApp or email with your order number and reason for return. Our team will guide you through the process.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 5–7 business days after we receive and inspect the returned item. The refund will be issued via the original payment method.",
      },
    ],
  },
  {
    category: "Products & Warranty",
    items: [
      {
        q: "Are all products genuine?",
        a: "Yes, all products sold on Multi Solutions Store are 100% genuine. We source directly from authorized distributors and manufacturers.",
      },
      {
        q: "Do products come with a warranty?",
        a: "Most electronics come with a manufacturer warranty. Warranty details are listed on the product page. Contact us if you have any warranty claims.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[#1a1a1a] py-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00796b]">Help Center</p>
        <h1 className="mt-3 text-[36px] font-bold text-white">Frequently Asked Questions</h1>
        <p className="mx-auto mt-4 max-w-lg text-[14px] text-white/50">
          Everything you need to know about shopping with Multi Solutions Store.
        </p>
      </div>

      {/* FAQ Sections */}
      <div className="container mx-auto max-w-3xl px-4 py-16">
        {faqs.map((section) => (
          <div key={section.category} className="mb-10">
            <h2 className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00796b]">
              {section.category}
            </h2>
            <div className="space-y-3">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-gray-200 bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[14px] font-medium text-gray-900 marker:content-none hover:text-[#00796b]">
                    {item.q}
                    <ChevronDown className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-gray-100 px-5 py-4 text-[13px] leading-relaxed text-gray-600">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="mt-12 rounded-2xl bg-[#f5f5f5] p-8 text-center">
          <h3 className="text-[18px] font-bold text-gray-900">Still have questions?</h3>
          <p className="mt-2 text-[13px] text-gray-500">
            Our team is happy to help. Reach out via WhatsApp or email.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1da851]"
            >
              WhatsApp Us
            </a>
            <a
              href="mailto:info@multisolutions.com"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-white"
            >
              Email Us
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-[13px] text-[#00796b] hover:underline">
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
