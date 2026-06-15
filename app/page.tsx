"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const trackingSteps = [
  "Order Received",
  "Printing",
  "Finishing",
  "Ready for Release",
];

function getFriendlyStatus(status: string) {
  const name = status.toUpperCase();

  if (name.includes("STATION 1")) return "Layouting & Encoding";
  if (name.includes("ADMIN HEAD")) return "For Approval to Printing";
  if (name.includes("QUALITY CHECKING")) return "Quality Checking";
  if (name.includes("RECEIVING") || name.includes("PRE-PRINT")) return "Preparing Files";
  if (name.includes("RUNNING")) return "Printing in Progress";
  if (name.includes("NUMBERING")) return "Numbering Process";
  if (name.includes("COLLATING")) return "Collating";
  if (name.includes("STAPLING") || name.includes("PADDING")) return "Stapling / Padding";
  if (name.includes("CUTTING") || name.includes("TRIMMING")) return "Cutting & Trimming";
  if (name.includes("BROWNING")) return "Finishing";
  if (name.includes("STAMPING")) return "Stamping";
  if (name.includes("PACKAGING") || name.includes("LABELLING")) return "Packaging";
  if (name.includes("FINISH RECEIPT")) return "Final Checking";
  if (name.includes("READY FOR RELEASE")) return "Ready for Release";

  return status;
}

function getCustomerPhaseIndex(status: string) {
  const name = status.toUpperCase();

  if (
    name.includes("STATION 1") ||
    name.includes("ADMIN HEAD") ||
    name.includes("QUALITY CHECKING")
  ) {
    return 0;
  }

  if (
    name.includes("RECEIVING") ||
    name.includes("PRE-PRINT") ||
    name.includes("RUNNING") ||
    name.includes("NUMBERING")
  ) {
    return 1;
  }

  if (
    name.includes("COLLATING") ||
    name.includes("STAPLING") ||
    name.includes("PADDING") ||
    name.includes("CUTTING") ||
    name.includes("TRIMMING") ||
    name.includes("BROWNING") ||
    name.includes("STAMPING") ||
    name.includes("PACKAGING") ||
    name.includes("LABELLING") ||
    name.includes("FINISH RECEIPT")
  ) {
    return 2;
  }

  if (name.includes("READY FOR RELEASE")) {
    return 3;
  }

  return 0;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function trackOrder(searchValue?: string) {
    const value = searchValue || query;

    if (!value.trim()) {
      setError("Please enter your tracking number.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/track?q=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Tracking number not found.");
      } else {
        setResult(data);
        setLastQuery(value);
      }
    } catch {
      setError("Unable to connect. Please try again.");
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!lastQuery) return;

    const interval = setInterval(() => {
      trackOrder(lastQuery);
    }, 300000);

    return () => clearInterval(interval);
  }, [lastQuery]);

  const orderComplete = result?.currentStatus
    ?.toUpperCase()
    .includes("READY FOR RELEASE");

  const phaseIndex = result ? getCustomerPhaseIndex(result.currentStatus) : 0;

  return (
    <main className="min-h-screen bg-[#2B1A12]">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#7A4A2E_0%,#4B2D1E_45%,#2B1A12_100%)]">
        <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-5 py-10 lg:grid-cols-2 lg:px-12">
          <section className="hidden text-white lg:block">
            <Image
              src="/lic-logo.jpg"
              alt="LIC Printing Shop Logo"
              width={135}
              height={85}
              className="mb-8 rounded"
              priority
            />

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
              Order Tracking Portal
            </p>

            <h1 className="max-w-xl text-5xl font-bold leading-tight">
              Track your BIR receipt and invoice orders with confidence.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-white/75">
              Enter your official LIC tracking number to check your order status
              anytime, anywhere.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                <p className="text-2xl font-bold text-[#D4AF37]">Live</p>
                <p className="mt-1 text-xs text-white/70">Order Status</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                <p className="text-2xl font-bold text-[#D4AF37]">BIR</p>
                <p className="mt-1 text-xs text-white/70">Accredited</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                <p className="text-2xl font-bold text-[#D4AF37]">Secure</p>
                <p className="mt-1 text-xs text-white/70">Tracking Number</p>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl">
              <div className="h-2 bg-[#D4AF37]" />

              <div className="p-6 sm:p-8">
                <Image
                  src="/lic-logo.jpg"
                  alt="LIC Printing Shop Logo"
                  width={110}
                  height={70}
                  className="mb-5 rounded"
                  priority
                />

                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                  LIC Printing Shop
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#3F261A]">
                  BIR Receipt & Invoice Order Tracker
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Enter your LIC tracking number to view the latest order status.
                </p>

                <div className="mt-7">
                  <input
                    type="text"
                    placeholder="Enter your tracking number"
                    value={query}
                    onChange={(e) => setQuery(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") trackOrder();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold tracking-wide outline-none transition focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/20"
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    Example: LIC26-B7A4F91C2B8D
                  </p>

                  <button
                    onClick={() => trackOrder()}
                    className="mt-3 w-full rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3F261A]"
                  >
                    {loading ? "Searching..." : "Track Order"}
                  </button>

                  {error && (
                    <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                      {error}
                    </p>
                  )}
                </div>

                {result && (
                  <div className="mt-7 border-t border-gray-200 pt-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      Order Details
                    </p>

                    <div className="mt-4 rounded-xl border border-[#D4AF37]/40 bg-[#FFF8E1] p-4">
                      <p className="text-xs text-gray-500">Tracking Number</p>
                      <p className="mt-1 font-bold tracking-wide text-[#3F261A]">
                        {result.trackingNumber}
                      </p>
                    </div>

                    <h3 className="mt-4 text-xl font-bold leading-snug text-[#3F261A]">
                      {result.customerName}
                    </h3>

                    {orderComplete && (
                      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                        <p className="font-bold text-green-800">
                          Your order is ready for release.
                        </p>
                        <p className="mt-1 text-xs leading-5 text-green-700">
                          Please contact LIC Printing Shop for pickup or release arrangements.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Current Status
                      </p>

                      <p className="mt-2 text-xl font-bold text-[#3F261A]">
                        {getFriendlyStatus(result.currentStatus)}
                      </p>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-600">
                          Progress
                        </span>
                        <span className="font-bold text-[#3F261A]">
                          {result.progress}%
                        </span>
                      </div>

                      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            orderComplete ? "bg-[#D4AF37]" : "bg-green-600"
                          }`}
                          style={{ width: `${result.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                      <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Order Progress
                      </p>

                      <div className="hidden items-start justify-between sm:flex">
                        {trackingSteps.map((step, index) => {
                          const isDone = index < phaseIndex || orderComplete;
                          const isCurrent = index === phaseIndex && !orderComplete;

                          return (
                            <div
                              key={step}
                              className="relative flex flex-1 flex-col items-center"
                            >
                              {index < trackingSteps.length - 1 && (
                                <div
                                  className={`absolute left-1/2 top-4 h-1 w-full ${
                                    index < phaseIndex || orderComplete
                                      ? "bg-green-600"
                                      : "bg-gray-200"
                                  }`}
                                />
                              )}

                              <div
                                className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${
                                  isDone
                                    ? "border-green-600 bg-green-600 text-white"
                                    : isCurrent
                                    ? "border-[#D4AF37] bg-[#FFF8E1] text-[#3F261A]"
                                    : "border-gray-300 bg-white text-gray-400"
                                }`}
                              >
                                {isDone ? "✓" : index + 1}
                              </div>

                              <p
                                className={`mt-3 text-center text-xs font-semibold ${
                                  isDone || isCurrent
                                    ? "text-[#3F261A]"
                                    : "text-gray-400"
                                }`}
                              >
                                {step}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-3 sm:hidden">
                        {trackingSteps.map((step, index) => {
                          const isDone = index < phaseIndex || orderComplete;
                          const isCurrent = index === phaseIndex && !orderComplete;

                          return (
                            <div
                              key={step}
                              className={`flex items-center gap-3 rounded-xl border p-3 ${
                                isDone
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : isCurrent
                                  ? "border-[#D4AF37] bg-[#FFF8E1] text-[#3F261A]"
                                  : "border-gray-200 bg-white text-gray-400"
                              }`}
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold">
                                {isDone ? "✓" : index + 1}
                              </span>
                              <span className="text-sm font-semibold">
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 border-t border-gray-200 pt-5 text-center">
                  <p className="text-xs text-gray-400">Need assistance?</p>
                  <p className="mt-1 font-bold text-[#3F261A]">
                    LIC Printing Shop
                  </p>
                  <p className="text-xs text-gray-500">
                    BIR Accredited Printing Services
                  </p>

                  <a
                    href="https://licprintingshop.net/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-lg bg-[#D4AF37] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#c9a227]"
                  >
                    Contact LIC Printing Shop
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}