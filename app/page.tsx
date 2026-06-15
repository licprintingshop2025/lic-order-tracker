"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const workflow = [
  "STATION 1 & 2 (LAYOUTING & ENCODING)",
  "ADMIN HEAD - (FOR APPROVAL TO PRINTING)",
  "QUALITY CHECKING",
  "RECEIVING & PRE-PRINT FORMATTING",
  "RUNNING",
  "NUMBERING",
  "COLLATING",
  "STAPLING/PADDING",
  "CUTTING & TRIMMING",
  "BROWNING",
  "STAMPING",
  "PACKAGING & LABELLING",
  "FINISH RECEIPT",
  "READY FOR RELEASE",
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

function getCurrentIndex(currentList: string) {
  const name = currentList.toUpperCase();

  if (name.includes("STATION 1")) return 0;
  if (name.includes("ADMIN HEAD")) return 1;
  if (name.includes("QUALITY CHECKING")) return 2;
  if (name.includes("RECEIVING") || name.includes("PRE-PRINT")) return 3;
  if (name.includes("RUNNING")) return 4;
  if (name.includes("NUMBERING")) return 5;
  if (name.includes("COLLATING")) return 6;
  if (name.includes("STAPLING") || name.includes("PADDING")) return 7;
  if (name.includes("CUTTING") || name.includes("TRIMMING")) return 8;
  if (name.includes("BROWNING")) return 9;
  if (name.includes("STAMPING")) return 10;
  if (name.includes("PACKAGING") || name.includes("LABELLING")) return 11;
  if (name.includes("FINISH RECEIPT")) return 12;
  if (name.includes("READY FOR RELEASE")) return 13;

  return -1;
}

function getBranchNumber(text: string) {
  const match = text.match(/BRANCH\s*(\d+[A-Z]?)/i);
  if (match) return match[1];

  const fallback = text.match(/\((\d+[A-Z]?)\)/);
  if (fallback) return fallback[1];

  return "";
}

function getShortReference(cardName: string) {
  const branch = getBranchNumber(cardName);
  if (branch) return `BRANCH-${branch}`;

  return "N/A";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function trackOrder(searchValue?: string) {
    const value = searchValue || query;

    if (!value.trim()) {
      setError("Please enter business name or branch number.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setMatches([]);

    try {
      const response = await fetch(`/api/track?q=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Order not found");
      } else if (data.multiple) {
        setMatches(data.results);
        setLastQuery(value);
      } else {
        setResult(data);
        setLastQuery(value);
      }
    } catch {
      setError("Unable to connect. Please try again.");
    }

    setLoading(false);
  }

  async function selectOrder(id: string) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/track?id=${encodeURIComponent(id)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Order not found");
      } else {
        setResult(data);
        setMatches([]);
      }
    } catch {
      setError("Unable to connect. Please try again.");
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!lastQuery || matches.length > 0) return;

    const interval = setInterval(() => {
      trackOrder(lastQuery);
    }, 300000);

    return () => clearInterval(interval);
  }, [lastQuery, matches.length]);

  const currentIndex = result ? getCurrentIndex(result.currentList) : -1;
  const orderComplete = result?.currentStatus?.toUpperCase().includes("READY FOR RELEASE");
  const branchNumber = result ? getBranchNumber(result.cardName) : "";
  const reference = result ? getShortReference(result.cardName) : "";

  return (
    <main className="min-h-screen bg-[#3F261A] text-[#2B1A12]">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#7A4A2E_0%,#4B2D1E_42%,#2B1A12_100%)]">
        <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:px-12">
          
          <section className="hidden lg:block text-white">
            <div className="max-w-xl">
              <Image
                src="/lic-logo.jpg"
                alt="LIC Printing Shop Logo"
                width={130}
                height={80}
                className="mb-8 rounded"
                priority
              />

              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
                Order Tracking Portal
              </p>

              <h1 className="text-5xl font-bold leading-tight">
                Track your BIR receipt and invoice orders with confidence.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-white/75">
                Stay updated from layouting, printing, packaging, and release.
                Built for LIC Printing Shop clients and business owners nationwide.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-2xl font-bold text-[#D4AF37]">Live</p>
                  <p className="mt-1 text-xs text-white/70">Trello Status</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-2xl font-bold text-[#D4AF37]">BIR</p>
                  <p className="mt-1 text-xs text-white/70">Accredited</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-2xl font-bold text-[#D4AF37]">24/7</p>
                  <p className="mt-1 text-xs text-white/70">Online Access</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl">
              <div className="h-2 bg-[#D4AF37]" />

              <div className="p-6 sm:p-8">
                <div className="text-center lg:text-left">
                  <Image
                    src="/lic-logo.jpg"
                    alt="LIC Printing Shop Logo"
                    width={110}
                    height={70}
                    className="mx-auto mb-5 rounded lg:mx-0"
                    priority
                  />

                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                    LIC Printing Shop
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#3F261A]">
                    BIR Receipt & Invoice Order Tracker
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    Enter your trade name, business name, or branch number to view the latest order status.
                  </p>
                </div>

                <div className="mt-7">
                  <input
                    type="text"
                    placeholder="Search trade name, business name, or branch number"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") trackOrder();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/20"
                  />

                  <button
                    onClick={() => trackOrder()}
                    className="mt-3 w-full rounded-xl bg-[#111111] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3F261A]"
                  >
                    {loading ? "Searching..." : "Track Order"}
                  </button>

                  {error && (
                    <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                      {error}
                    </p>
                  )}
                </div>

                {matches.length > 0 && (
                  <div className="mt-7 border-t border-gray-200 pt-6">
                    <p className="text-sm font-semibold text-[#3F261A]">
                      Multiple orders found
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Please select the correct order from the list below.
                    </p>

                    <div className="mt-4 space-y-3">
                      {matches.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => selectOrder(item.id)}
                          className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-[#D4AF37] hover:bg-[#FFF8E1]"
                        >
                          <p className="font-bold text-[#3F261A]">
                            {item.customerName}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {item.cardName}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {result && (
                  <div className="mt-7 border-t border-gray-200 pt-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      Order Details
                    </p>

                    <h3 className="mt-2 text-xl font-bold leading-snug text-[#3F261A]">
                      {result.customerName}
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-[#D4AF37]/40 bg-[#FFF8E1] p-4">
                        <p className="text-xs text-gray-500">Reference</p>
                        <p className="mt-1 font-bold text-[#3F261A]">{reference}</p>
                      </div>

                      <div className="rounded-xl border border-[#D4AF37]/40 bg-[#FFF8E1] p-4">
                        <p className="text-xs text-gray-500">Branch</p>
                        <p className="mt-1 font-bold text-[#3F261A]">
                          {branchNumber || "Not specified"}
                        </p>
                      </div>
                    </div>

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
                        <span className="font-semibold text-gray-600">Progress</span>
                        <span className="font-bold text-[#3F261A]">{result.progress}%</span>
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

                    <div className="mt-6 space-y-2">
                      {workflow.map((step, index) => {
                        const isCompleted =
                          index < currentIndex ||
                          (orderComplete && index === currentIndex);

                        const isCurrent = !orderComplete && index === currentIndex;

                        return (
                          <div
                            key={step}
                            className={`flex items-start gap-3 rounded-lg px-2 py-1.5 text-sm ${
                              isCompleted
                                ? "text-green-700"
                                : isCurrent
                                ? "bg-[#FFF8E1] font-bold text-[#3F261A]"
                                : "text-gray-400"
                            }`}
                          >
                            <span className="mt-0.5">
                              {isCompleted ? "✓" : isCurrent ? "●" : "○"}
                            </span>

                            <span>{getFriendlyStatus(step)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-8 border-t border-gray-200 pt-5 text-center">
                  <p className="text-xs text-gray-400">Need assistance?</p>
                  <p className="mt-1 font-bold text-[#3F261A]">LIC Printing Shop</p>
                  <p className="text-xs text-gray-500">BIR Accredited Printing Services</p>

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