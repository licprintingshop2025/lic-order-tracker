"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const trackingSteps = [
  "Order Received",
  "Documents Verified",
  "Printing in Progress",
  "Quality Check",
  "Ready for Release",
];

const previewSteps = [
  "Order Received",
  "Documents Verified",
  "Printing in Progress",
  "Quality Check",
  "Ready for Release",
];

function getFriendlyStatus(status: string) {
  const name = status.toUpperCase();

  if (name.includes("STATION 1")) return "Order Received";
  if (name.includes("ADMIN HEAD")) return "Documents Verified";
  if (name.includes("QUALITY CHECKING")) return "Documents Verified";
  if (name.includes("RECEIVING") || name.includes("PRE-PRINT")) return "Documents Verified";
  if (name.includes("RUNNING")) return "Printing in Progress";
  if (name.includes("NUMBERING")) return "Printing in Progress";
  if (name.includes("COLLATING")) return "Quality Check";
  if (name.includes("STAPLING") || name.includes("PADDING")) return "Quality Check";
  if (name.includes("CUTTING") || name.includes("TRIMMING")) return "Quality Check";
  if (name.includes("BROWNING")) return "Quality Check";
  if (name.includes("STAMPING")) return "Quality Check";
  if (name.includes("PACKAGING") || name.includes("LABELLING")) return "Quality Check";
  if (name.includes("FINISH RECEIPT")) return "Quality Check";
  if (name.includes("READY FOR RELEASE")) return "Ready for Release";

  return "Order Received";
}

function getCustomerPhaseIndex(status: string) {
  const name = status.toUpperCase();

  if (name.includes("READY FOR RELEASE")) return 4;

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
    return 3;
  }

  if (name.includes("RUNNING") || name.includes("NUMBERING")) return 2;

  if (
    name.includes("ADMIN HEAD") ||
    name.includes("QUALITY CHECKING") ||
    name.includes("RECEIVING") ||
    name.includes("PRE-PRINT")
  ) {
    return 1;
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
    <main className="min-h-screen bg-[#FAF7F2] text-[#2B1A12]">
      <div className="bg-[radial-gradient(circle_at_top_left,rgba(201,162,39,0.16),transparent_34%),linear-gradient(135deg,#FAF7F2_0%,#F5EFE4_100%)]">
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-12 lg:grid-cols-2 lg:px-12 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#C9A227]">
              Order Tracking Portal
            </p>

            <h1 className="mt-5 max-w-xl text-4xl font-bold leading-tight text-[#4A2A1A] sm:text-5xl">
              Track Your Receipt & Invoice Order
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600">
              Monitor the progress of your receipt and invoice printing order in
              real time through LIC Printing Shop&apos;s secure customer portal.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-[#4A2A1A]">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-[#E8D7A6]">
                ✓ BIR Accredited
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-[#E8D7A6]">
                ✓ Secure Tracking
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-[#E8D7A6]">
                ✓ Real-Time Updates
              </span>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] ring-1 ring-[#E8D7A6] sm:px-10 sm:py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Image
                src="/lic-logo.jpg"
                alt="LIC Printing Shop"
                width={72}
                height={72}
                className="mx-auto rounded"
                priority
              />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C9A227]">
                LIC Printing Shop
              </p>

              <h2 className="mt-1 text-3xl font-bold leading-tight text-[#4A2A1A] md:text-4xl">
                Track Your Order
              </h2>

              <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-gray-500">
                Enter your official LIC tracking number below.
              </p>
            </div>

            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Tracking Number
              </label>

              <input
                type="text"
                placeholder="LIC26-AB12CD34EF56"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") trackOrder();
                }}
                className="mt-2 w-full rounded-2xl border border-[#E8D7A6] bg-[#FAF7F2] px-4 py-4 text-sm font-bold tracking-wide outline-none transition focus:border-[#C9A227] focus:bg-white focus:ring-4 focus:ring-[#C9A227]/20"
              />

              <p className="mt-2 text-xs text-gray-400">
                Example: LIC26-AB12CD34EF56
              </p>

              <button
                onClick={() => trackOrder()}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#C9A227] to-[#B88422] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#C9A227]/30 transition duration-300 hover:scale-[1.01]"
              >
                {loading ? "Searching..." : "Track Order"}
              </button>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            {result && (
              <div className="mt-7 border-t border-[#E8D7A6] pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  Order Details
                </p>

                <div className="mt-4 rounded-2xl bg-[#FFF8E1] p-4 ring-1 ring-[#E8D7A6]">
                  <p className="text-xs text-gray-500">Tracking Number</p>
                  <p className="mt-1 font-bold tracking-wide text-[#4A2A1A]">
                    {result.trackingNumber}
                  </p>
                </div>

                <h3 className="mt-4 text-xl font-bold text-[#4A2A1A]">
                  {result.customerName || "Order Found"}
                </h3>

                {orderComplete && (
                  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <p className="font-bold text-green-800">
                      Your order is ready for release.
                    </p>
                    <p className="mt-1 text-xs text-green-700">
                      Please contact LIC Printing Shop for pickup or release
                      arrangements.
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-gray-200 bg-[#FAF7F2] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Current Status
                  </p>

                  <p className="mt-2 text-xl font-bold text-[#4A2A1A]">
                    {getFriendlyStatus(result.currentStatus)}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-600">
                      Progress
                    </span>
                    <span className="font-bold text-[#4A2A1A]">
                      {result.progress}%
                    </span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        orderComplete ? "bg-[#C9A227]" : "bg-green-600"
                      }`}
                      style={{ width: `${result.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6">
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
                                ? "border-[#C9A227] bg-[#FFF8E1] text-[#4A2A1A]"
                                : "border-gray-300 bg-white text-gray-400"
                            }`}
                          >
                            {isDone ? "✓" : index + 1}
                          </div>

                          <p
                            className={`mt-3 text-center text-[11px] font-semibold ${
                              isDone || isCurrent
                                ? "text-[#4A2A1A]"
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
                          className={`flex items-center gap-3 rounded-2xl border p-3 ${
                            isDone
                              ? "border-green-200 bg-green-50 text-green-700"
                              : isCurrent
                              ? "border-[#C9A227] bg-[#FFF8E1] text-[#4A2A1A]"
                              : "border-gray-200 bg-white text-gray-400"
                          }`}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold">
                            {isDone ? "✓" : index + 1}
                          </span>
                          <span className="text-sm font-semibold">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-10 lg:px-12">
          <div className="rounded-[28px] bg-white p-6 shadow-xl ring-1 ring-[#E8D7A6] sm:p-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A227]">
                How Tracking Works
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#4A2A1A]">
                Simple and Transparent Order Tracking
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                [
                  "01",
                  "Enter Tracking Number",
                  "Use the unique tracking number provided by LIC Printing Shop.",
                ],
                [
                  "02",
                  "View Production Status",
                  "Monitor your order as it moves through production.",
                ],
                [
                  "03",
                  "Ready for Release",
                  "Know when your order is completed and ready for pickup or release.",
                ],
              ].map(([num, title, text]) => (
                <div
                  key={title}
                  className="rounded-[20px] bg-[#FAF7F2] p-6 ring-1 ring-[#E8D7A6]"
                >
                  <p className="text-sm font-bold text-[#C9A227]">{num}</p>
                  <h3 className="mt-3 text-lg font-bold text-[#4A2A1A]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-10 lg:px-12">
          <div className="rounded-[28px] bg-white p-6 shadow-xl ring-1 ring-[#E8D7A6] sm:p-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A227]">
                Order Status Journey
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#4A2A1A]">
                Production Timeline Preview
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">
              {previewSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[20px] border border-[#E8D7A6] bg-[#FAF7F2] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C9A227] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-[#4A2A1A]">
                    {step}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    {index === 0 && "Documents submitted and recorded."}
                    {index === 1 && "Files and requirements checked."}
                    {index === 2 && "Production is currently underway."}
                    {index === 3 && "Final inspection before release."}
                    {index === 4 && "Order completed and ready for release."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-14">
          <div className="rounded-[28px] bg-[#4A2A1A] px-8 py-6 text-center text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A227]">
              Need Assistance?
            </p>

            <p className="mt-3 text-sm text-white/70">
              For pickup schedules, release arrangements, and order inquiries,
              our team is ready to assist.
            </p>

            <div className="mt-6 flex justify-center">
              <a
                href="https://licprintingshop.net/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#C9A227] px-10 py-4 text-sm font-bold text-white shadow-lg shadow-[#C9A227]/30 transition hover:scale-105"
              >
                Contact LIC Printing Shop
              </a>
            </div>

            <p className="mt-4 text-xs text-white/60">
              www.licprintingshop.net
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}