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

  const orderComplete = result?.currentStatus
    ?.toUpperCase()
    .includes("READY FOR RELEASE");

  const branchNumber = result ? getBranchNumber(result.cardName) : "";
  const reference = result ? getShortReference(result.cardName) : "";

  return (
    <main className="min-h-screen bg-[#5B3A29] flex items-center justify-center px-4 py-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-xl border-t-8 border-[#D4AF37]">
        <div className="text-center">
          <Image
            src="/lic-logo.jpg"
            alt="LIC Printing Shop Logo"
            width={150}
            height={85}
            className="mx-auto mb-4 rounded"
            priority
          />

          <h1 className="text-2xl sm:text-3xl font-bold text-[#5B3A29]">
            LIC Printing Shop
          </h1>

          <p className="text-[#D4AF37] font-semibold mt-2 text-sm">
            BIR Receipt & Invoice Order Tracker
          </p>

          <p className="text-gray-500 mt-2 text-xs">
            Track your order using your trade name, business name, or branch number.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search Trade Name, Business Name, or Branch Number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") trackOrder();
          }}
          className="w-full border border-gray-300 rounded-lg p-3 mt-6 text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
        />

        <button
          onClick={() => trackOrder()}
          className="w-full mt-4 bg-black text-white p-3 rounded-lg text-base font-semibold hover:bg-[#5B3A29] transition"
        >
          {loading ? "Searching..." : "Track Order"}
        </button>

        {error && (
          <p className="text-red-600 text-center mt-4 text-sm">{error}</p>
        )}

        {matches.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-600 font-medium">
              Multiple orders found. Please select the correct order:
            </p>

            <div className="mt-4 space-y-3">
              {matches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectOrder(item.id)}
                  className="w-full text-left border border-gray-300 rounded-lg p-3 hover:bg-[#FFF8E1] hover:border-[#D4AF37] transition"
                >
                  <p className="font-bold text-[#5B3A29]">
                    {item.customerName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.cardName}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-500">Order Details</p>

            <h2 className="text-lg sm:text-xl font-bold mt-1 text-[#5B3A29]">
              {result.customerName}
            </h2>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-[#FFF8E1] border border-[#D4AF37]/40 p-3">
                <p className="text-xs text-gray-500">Reference</p>
                <p className="font-bold text-[#5B3A29]">{reference}</p>
              </div>

              <div className="rounded-lg bg-[#FFF8E1] border border-[#D4AF37]/40 p-3">
                <p className="text-xs text-gray-500">Branch</p>
                <p className="font-bold text-[#5B3A29]">
                  {branchNumber || "Not specified"}
                </p>
              </div>
            </div>

            {orderComplete && (
              <div className="mt-4 rounded-lg bg-[#FFF8E1] border border-[#D4AF37] p-4">
                <p className="text-[#5B3A29] font-bold text-sm">
                  🎉 YOUR ORDER IS READY FOR RELEASE
                </p>
                <p className="text-[#5B3A29] text-xs mt-1">
                  Please contact LIC Printing Shop for pickup or release arrangements.
                </p>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-semibold">
                ORDER STATUS
              </p>

              <p className="text-xl font-bold text-[#5B3A29] mt-1">
                {getFriendlyStatus(result.currentStatus)}
              </p>

              <p className="mt-2 text-sm">
                <strong>Progress:</strong> {result.progress}%
              </p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-5 mt-4">
              <div
                className={`h-5 rounded-full transition-all duration-500 ${
                  orderComplete ? "bg-[#D4AF37]" : "bg-green-600"
                }`}
                style={{ width: `${result.progress}%` }}
              />
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
                    className={`flex items-start gap-2 text-[13px] sm:text-sm ${
                      isCompleted
                        ? "text-green-600"
                        : isCurrent
                        ? "text-[#D4AF37] font-bold"
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

        <div className="mt-8 border-t pt-5 text-center">
          <p className="text-xs text-gray-500 mb-1">Need assistance?</p>

          <p className="text-lg font-bold text-[#5B3A29]">
            LIC Printing Shop
          </p>

          <p className="text-sm text-gray-600">
            BIR Accredited Printing Services
          </p>

          <div className="mt-3 text-sm text-gray-700 space-y-1">
            <p>📧 licprintingshop2025@gmail.com</p>
            <p>☎️ (02) 853 19583</p>
            <p>📱 +63 943 416 4978</p>

            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              3F, Room 304, MCR Industries Inc.
              <br />
              495 Boni Avenue, Mandaluyong City
              <br />
              1550 Metro Manila, Philippines
            </p>
          </div>

          <div className="flex justify-center mt-4">
            <a
              href="https://licprintingshop.net/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#D4AF37] hover:bg-[#c9a227] text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              Contact LIC Printing Shop
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}