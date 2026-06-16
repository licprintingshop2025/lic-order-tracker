"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const trackingSteps = ["Received", "Printing", "Finishing", "Ready"];

function getFriendlyStatus(status: string) {
  const name = status.toUpperCase();

  if (name.includes("STATION 1")) return "Layouting & Encoding";
  if (name.includes("ADMIN HEAD")) return "For Approval";
  if (name.includes("QUALITY CHECKING")) return "Quality Checking";
  if (name.includes("RECEIVING") || name.includes("PRE-PRINT")) return "Preparing Files";
  if (name.includes("RUNNING")) return "Printing";
  if (name.includes("NUMBERING")) return "Numbering";
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

function getPhase(status: string) {
  const name = status.toUpperCase();

  if (name.includes("READY FOR RELEASE")) return 3;

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

  if (
    name.includes("RECEIVING") ||
    name.includes("PRE-PRINT") ||
    name.includes("RUNNING") ||
    name.includes("NUMBERING")
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

  const isReady = result?.currentStatus?.toUpperCase().includes("READY FOR RELEASE");
  const phase = result ? getPhase(result.currentStatus) : 0;

  return (
    <main className="min-h-screen bg-[#5B371F] px-4 py-6">
      <div className="mx-auto max-w-md overflow-hidden rounded-[34px] bg-[#FFFDF8] shadow-2xl">
        <div className="bg-[#3E2517] px-6 pb-10 pt-8 text-white">
          <div className="flex items-center justify-between">
            <Image
              src="/lic-logo.jpg"
              alt="LIC Printing Shop"
              width={88}
              height={58}
              className="rounded-lg"
              priority
            />

            <div className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold">
              Order Tracker
            </div>
          </div>

          <h1 className="mt-8 text-3xl font-bold leading-tight">
            Track your BIR receipt and invoice order.
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/75">
            Enter your official LIC tracking number to check your latest order status.
          </p>
        </div>

        <div className="-mt-6 rounded-t-[34px] bg-[#FFFDF8] px-5 pb-6 pt-6">
          <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#B88422]">
              Tracking Number
            </label>

            <input
              type="text"
              placeholder="LIC26-XXXXXXXXXXXX"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") trackOrder();
              }}
              className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold tracking-wide outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20"
            />

            <button
              onClick={() => trackOrder()}
              className="mt-3 w-full rounded-xl bg-[#4B2D1E] px-4 py-3 text-sm font-bold text-white transition hover:bg-black"
            >
              {loading ? "Searching..." : "Track Order"}
            </button>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          {result && (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-black/5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  Order Details
                </p>

                <div className="mt-4 rounded-xl bg-[#FFF6DA] p-4">
                  <p className="text-xs text-gray-500">Tracking Number</p>
                  <p className="mt-1 text-sm font-bold text-[#3F261A]">
                    {result.trackingNumber}
                  </p>
                </div>

                <h2 className="mt-4 text-xl font-bold text-[#2B1A12]">
                  {result.customerName || "Order Found"}
                </h2>

                {isReady && (
                  <div className="mt-4 rounded-xl bg-green-50 p-4 text-green-800">
                    <p className="font-bold">Your order is ready for release.</p>
                    <p className="mt-1 text-xs">
                      Please contact LIC Printing Shop for pickup or release arrangements.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      Current Status
                    </p>
                    <p className="mt-2 text-xl font-bold text-[#2B1A12]">
                      {getFriendlyStatus(result.currentStatus)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">Progress</p>
                    <p className="text-2xl font-bold text-[#B88422]">
                      {result.progress}%
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${
                      isReady ? "bg-[#D4AF37]" : "bg-green-600"
                    }`}
                    style={{ width: `${result.progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-black/5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  Order Progress
                </p>

                <div className="mt-5 flex items-start justify-between">
                  {trackingSteps.map((step, index) => {
                    const done = index < phase || isReady;
                    const current = index === phase && !isReady;

                    return (
                      <div key={step} className="relative flex flex-1 flex-col items-center">
                        {index < trackingSteps.length - 1 && (
                          <div
                            className={`absolute left-1/2 top-4 h-1 w-full ${
                              index < phase || isReady ? "bg-green-600" : "bg-gray-200"
                            }`}
                          />
                        )}

                        <div
                          className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${
                            done
                              ? "border-green-600 bg-green-600 text-white"
                              : current
                              ? "border-[#D4AF37] bg-[#FFF6DA] text-[#3F261A]"
                              : "border-gray-300 bg-white text-gray-400"
                          }`}
                        >
                          {done ? "✓" : index + 1}
                        </div>

                        <p
                          className={`mt-2 text-center text-[11px] font-bold ${
                            done || current ? "text-[#3F261A]" : "text-gray-400"
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!result && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 text-center shadow ring-1 ring-black/5">
                <p className="text-2xl">📄</p>
                <p className="mt-2 text-sm font-bold text-[#3F261A]">
                  Invoices
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 text-center shadow ring-1 ring-black/5">
                <p className="text-2xl">🧾</p>
                <p className="mt-2 text-sm font-bold text-[#3F261A]">
                  Receipts
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 text-center shadow ring-1 ring-black/5">
                <p className="text-2xl">✅</p>
                <p className="mt-2 text-sm font-bold text-[#3F261A]">
                  BIR Accredited
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 text-center shadow ring-1 ring-black/5">
                <p className="text-2xl">🚚</p>
                <p className="mt-2 text-sm font-bold text-[#3F261A]">
                  Order Status
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-white p-5 text-center shadow ring-1 ring-black/5">
            <p className="text-xs text-gray-400">Need assistance?</p>
            <p className="mt-1 font-bold text-[#3F261A]">LIC Printing Shop</p>
            <p className="text-xs text-gray-500">
              BIR Accredited Printing Services
            </p>

            <a
              href="https://licprintingshop.net/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-xl bg-[#D4AF37] px-5 py-2 text-sm font-bold text-white"
            >
              Contact LIC Printing Shop
            </a>
          </div>

          <div className="mt-5 flex items-center justify-around border-t border-gray-200 pt-4 text-xs text-gray-500">
            <div className="text-center">
              <p className="text-lg">⌂</p>
              <p>Home</p>
            </div>
            <div className="text-center text-[#B88422]">
              <p className="text-lg">◉</p>
              <p className="font-bold">Track</p>
            </div>
            <div className="text-center">
              <p className="text-lg">☎</p>
              <p>Contact</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}