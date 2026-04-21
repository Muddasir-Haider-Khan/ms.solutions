import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Multi Solutions Store",
  description: "Privacy policy for Multi Solutions Store",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[#1a1a1a] py-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00796b]">Legal</p>
        <h1 className="mt-3 text-[36px] font-bold text-white">Privacy Policy</h1>
        <p className="mx-auto mt-4 max-w-lg text-[14px] text-white/50">
          Last updated: January 2025
        </p>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="prose prose-gray max-w-none text-[14px] leading-[1.9] text-gray-700">

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">1. Information We Collect</h2>
            <p>
              When you use Multi Solutions Store, we collect information you provide directly to us, such as your name, email address, phone number, and shipping address when you create an account or place an order.
            </p>
            <p className="mt-3">
              We also automatically collect certain information about your device and how you interact with our services, including IP address, browser type, pages visited, and purchase history.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">2. How We Use Your Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>To process and fulfill your orders</li>
              <li>To communicate with you about your orders and account</li>
              <li>To send you promotional offers and updates (with your consent)</li>
              <li>To improve our products and services</li>
              <li>To comply with legal obligations</li>
              <li>To prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information with:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Delivery partners to fulfill your orders</li>
              <li>Payment processors to complete transactions</li>
              <li>Service providers who assist in our operations</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">5. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience on our website. You can control cookies through your browser settings. Disabling cookies may affect some functionality of our site.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{" "}
              <a href="mailto:info@multisolutions.com" className="text-[#00796b] hover:underline">
                info@multisolutions.com
              </a>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">7. Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child, please contact us.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the "Last updated" date. Your continued use of our services constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[18px] font-bold text-gray-900">9. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="mt-3 rounded-xl bg-[#f5f5f5] p-5 text-[13px]">
              <p><strong>Multi Solutions Store</strong></p>
              <p className="mt-1">Email: <a href="mailto:info@multisolutions.com" className="text-[#00796b] hover:underline">info@multisolutions.com</a></p>
              <p>Phone: +92 300 1234567</p>
              <p>Location: Nationwide Delivery, Pakistan</p>
            </div>
          </section>
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
