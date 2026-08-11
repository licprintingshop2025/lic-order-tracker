"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const trackingSteps = [
  "Order Received",
  "Documents Verified",
  "Printing",
  "Production Finishing",
  "Ready for Release",
  "Delivered",
];

function getCustomerPhaseIndex(status: string) {
  const name = (status || "").toUpperCase();

  if (
    name.includes("DELIVERED BY LIC") ||
    name.includes("PICKED UP BY CLIENT")
  ) {
    return 5;
  }

  if (name.includes("READY FOR RELEASE")) {
    return 4;
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
    return 3;
  }

  if (name.includes("RUNNING") || name.includes("NUMBERING")) {
    return 2;
  }

  if (
    name.includes("ADMIN HEAD") ||
    name.includes("QUALITY CHECKING") ||
    name.includes("PRE-PRINT") ||
    name.includes("RECEIVING")
  ) {
    return 1;
  }

  return 0;
}

type OrderDocument = {
  name: string;
  booklets: number | null;
};

type TrackingResult = {
  success?: boolean;
  multiple?: boolean;

  trackingNumber?: string;
  customerName?: string;

  documents?: OrderDocument[];
  documentCount?: number;
  totalBooklets?: number;

  taxType?: string;

  cardName?: string;
  currentList?: string;
  currentStage?: string | null;
  currentStatus?: string;
  nextStage?: string;
  progress?: number;

  courier?: string;
  releaseDate?: string;
  dateReceived?: string;

  isReady?: boolean;
  isDelivered?: boolean;
  isIgnored?: boolean;
};

type TrackingCardProps = {
  query: string;
  setQuery: (value: string) => void;
  loading: boolean;
  error: string;
  trackOrder: (
    searchValue?: string,
    autoScroll?: boolean
  ) => Promise<void>;
};

function TrackingCard({
  query,
  setQuery,
  loading,
  error,
  trackOrder,
}: TrackingCardProps) {
  return (
    <>
      <div className="tracking-card-logo relative mx-auto -mt-14 h-[200px] w-full max-w-[340px] sm:h-[200px] sm:max-w-[340px] xl:h-[205px] xl:max-w-[390px]">
        <Image
          src="/lic-bir-logo.png"
          alt="LIC Printing Corporation - BIR Accredited Printer"
          fill
          priority
          sizes="420px"
          className="object-contain"
        />
      </div>

      <div className="mt-[-50px] text-center sm:mt-3 xl:mt-[-40px]">
        <h2 className="text-[27px] font-black leading-none text-[#5a3823] sm:text-[34px] xl:text-[39px]">
          Track Your Order
        </h2>

        <p className="mt-2 font-serif text-sm text-black sm:text-base xl:mt-3 xl:text-lg">
          Enter your official LIC tracking number below.
        </p>
      </div>

      <div className="mt-5 xl:mt-7">
        <div className="relative">
          {!query && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
              <span className="text-[12px] uppercase tracking-wide text-[#aaa] sm:text-[14px]">
                Input Tracking Number
              </span>

              <span className="mt-1 text-[12px] uppercase tracking-wide text-[#aaa] sm:text-[14px]">
                LIC-YYMMDD-XXXXXX
              </span>
            </div>
          )}

          <input
            type="text"
            value={query}
            aria-label="Tracking Number"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value.toUpperCase());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                trackOrder();
              }
            }}
            className="h-[70px] w-full rounded-[24px] border-2 border-[#c9a52d] bg-[#fbf9f5] px-4 text-center text-sm font-semibold uppercase tracking-wide text-[#4b2d1a] outline-none transition focus:border-[#8a612c] focus:ring-4 focus:ring-[#c9a52d]/15 sm:h-[78px] sm:rounded-[28px] sm:px-5 sm:text-base xl:h-[80px]"
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => trackOrder()}
          className="mt-4 w-full rounded-full bg-[#79502e] px-6 py-[14px] text-[17px] font-bold text-white transition hover:bg-[#603d24] disabled:cursor-not-allowed disabled:opacity-70 sm:mt-5 sm:py-4 sm:text-[19px] xl:mt-7 xl:text-[21px]"
        >
          {loading ? "Searching..." : "View Order Status"}
        </button>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}
      </div>
    </>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);

  async function trackOrder(
    searchValue?: string,
    autoScroll = true
  ) {
    const value = searchValue || query;

    if (!value.trim()) {
      setError("Please enter your tracking number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/track?q=${encodeURIComponent(value)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setResult(null);
        setError(data.error || "Tracking number not found.");
      } else {
        setResult(data);
        setLastQuery(value);

        if (autoScroll) {
          setTimeout(() => {
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 150);
        }
      }
    } catch {
      setResult(null);
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!lastQuery) return;

    const interval = setInterval(() => {
      trackOrder(lastQuery, false);
    }, 300000);

    return () => clearInterval(interval);
  }, [lastQuery]);

  const isDelivered = result?.isDelivered === true;

  const isReadyForRelease =
    result?.currentStatus
      ?.toUpperCase()
      .includes("READY FOR RELEASE") && !isDelivered;

  const phaseIndex = result
    ? getCustomerPhaseIndex(result.currentList || "")
    : 0;

  const documents = Array.isArray(result?.documents)
    ? result.documents
    : [];

  const documentCount =
    result?.documentCount ?? documents.length;

  const totalBooklets =
    result?.totalBooklets ??
    documents.reduce(
      (total, document) =>
        total + (document.booklets || 0),
      0
    );

  return (
    <>
      <Script
        src="https://elfsightcdn.com/platform.js"
        strategy="afterInteractive"
      />

      <main className="min-h-screen overflow-hidden bg-[#f8f1e7] text-[#4b2d1a]">
        <section className="tracking-hero">
          <div className="relative mx-auto max-w-[1280px] px-5 pt-7 sm:px-8 xl:px-8 xl:pt-9">
            <div className="relative z-50 pr-[110px] sm:pr-[145px] xl:pr-0">
              <h1 className="text-[32px] font-black uppercase leading-[0.95] tracking-tight text-[#55351f] sm:text-[44px] xl:text-[58px]">
                Order Tracking Portal
              </h1>

              <p className="mt-1 text-[18px] font-medium tracking-wide text-[#c69a19] sm:text-[25px] xl:text-[30px]">
                Track Your Invoice &amp; Receipts Order
              </p>
            </div>

            <div className="small-screen-badge xl:hidden">
              <Image
                src="/21-years.png"
                alt="21 Years of Trust and Genuine Service"
                width={130}
                height={130}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <div className="mt-2 xl:hidden">
              <div className="mobile-description-general">
                <p>
                  Monitor the progress of your receipt and invoice
                  printing order in real time through{" "}
                  <strong>LIC Printing Corporation</strong> secure
                  customer portal.
                </p>
              </div>

              <div className="mt-3 flex justify-center sm:mt-10">
                <div className="tracking-card relative z-30 w-full max-w-[620px] overflow-visible rounded-[30px] border-[3px] border-[#654329] px-5 py-5 shadow-[0_16px_35px_rgba(77,46,28,0.12)] sm:px-8 sm:py-7">
                  <TrackingCard
                    query={query}
                    setQuery={setQuery}
                    loading={loading}
                    error={error}
                    trackOrder={trackOrder}
                  />
                </div>
              </div>

              <div className="h-6 sm:h-8" />
            </div>

            <div className="relative mt-6 hidden min-h-[630px] grid-cols-[57%_43%] gap-4 xl:grid">
              <div className="relative min-h-[630px]">
                <div className="absolute left-[11%] right-[-5%] top-[140px] z-[4] flex min-h-[200px] items-center bg-white px-8">
                  <p className="ml-auto max-w-[420px] text-center font-serif text-[22px] leading-[1.28] text-[#18110d]">
                    Monitor the progress of your receipt and
                    <br />
                    invoice printing order in real time through
                    <br />
                    <strong>LIC Printing Corporation</strong>
                    <br />
                    secure customer portal.
                  </p>
                </div>

                <div className="desktop-woman absolute">
                  <Image
                    src="/tracking-woman.png"
                    alt="LIC Printing Corporation representative holding a package"
                    fill
                    priority
                    sizes="650px"
                    className="object-contain object-bottom"
                  />
                </div>

                <div className="desktop-badge absolute">
                  <Image
                    src="/21-years.png"
                    alt="21 Years of Trust and Genuine Service"
                    width={250}
                    height={250}
                    className="h-[250px] w-[250px] object-contain"
                  />
                </div>
              </div>

              <div className="relative z-40 flex items-start justify-center pb-12">
                <div className="tracking-card w-full max-w-[500px] overflow-hidden rounded-[48px] border-[4px] border-[#654329] px-9 py-8 shadow-[0_16px_35px_rgba(77,46,28,0.12)]">
                  <TrackingCard
                    query={query}
                    setQuery={setQuery}
                    loading={loading}
                    error={error}
                    trackOrder={trackOrder}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {result && (
          <section
            ref={resultRef}
            className="order-result-section scroll-mt-5 px-5 sm:px-8"
          >
            <div className="order-result-container mx-auto">
              <div className="rounded-[30px] border-2 border-[#654329] bg-white px-5 py-7 shadow-[0_18px_45px_rgba(77,46,28,0.12)] sm:rounded-[36px] sm:px-8 sm:py-9 xl:px-10">
                {/* =====================================================
                    ORDER IDENTITY
                ===================================================== */}

                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a27a4f]">
                    Order Details
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-[#51321f] sm:text-3xl">
                    {result.customerName || "Order Found"}
                  </h3>

                  <p className="mt-2 text-sm font-semibold tracking-wide text-[#76553c]">
                    {result.trackingNumber}
                  </p>
                </div>

                {/* =====================================================
                    DOCUMENTS INCLUDED
                ===================================================== */}

                {documents.length > 0 && (
                  <div className="mx-auto mt-8 max-w-[1000px]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a806c]">
                          Documents Included
                        </p>

                        <p className="mt-1 text-sm text-[#7a6658]">
                          Documents included in this printing order.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="rounded-full bg-[#f5ede3] px-4 py-2 text-xs font-bold text-[#5a3823]">
                          {documentCount}{" "}
                          {documentCount === 1
                            ? "Document"
                            : "Documents"}
                        </div>

                        {totalBooklets > 0 && (
                          <div className="rounded-full bg-[#f5ede3] px-4 py-2 text-xs font-bold text-[#5a3823]">
                            {totalBooklets}{" "}
                            {totalBooklets === 1
                              ? "Booklet"
                              : "Booklets"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[24px] border border-[#dfd3c8] bg-[#fffdf9]">
                      {documents.map((document, index) => (
                        <div
                          key={`${document.name}-${index}`}
                          className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-[#ebe3dc] px-5 py-4 last:border-b-0 sm:px-6 sm:py-5"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a38d7d]">
                              Document {index + 1}
                            </p>

                            <p className="mt-1 text-base font-black leading-tight text-[#52321f] sm:text-lg">
                              {document.name}
                            </p>
                          </div>

                          <div className="min-w-[105px] text-right sm:min-w-[140px]">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a38d7d]">
                              Quantity
                            </p>

                            {document.booklets !== null ? (
                              <p className="mt-1 text-xl font-black text-[#5a3823]">
                                {document.booklets}

                                <span className="ml-1 text-xs font-semibold text-[#7a6658] sm:text-sm">
                                  {document.booklets === 1
                                    ? "booklet"
                                    : "booklets"}
                                </span>
                              </p>
                            ) : (
                              <p className="mt-1 text-sm font-semibold text-[#9a806c]">
                                Not specified
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =====================================================
                    READY / DELIVERED MESSAGE
                ===================================================== */}

                {isReadyForRelease && (
                  <div className="mx-auto mt-7 max-w-[1000px] rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 sm:px-6">
                    <p className="font-bold text-amber-900">
                      Your order is ready for release.
                    </p>

                    <p className="mt-1 text-sm leading-5 text-amber-800">
                      Please contact LIC Printing Corporation for
                      pickup or release arrangements.
                    </p>
                  </div>
                )}

                {isDelivered && (
                  <div className="mx-auto mt-7 max-w-[1000px] rounded-2xl border border-green-200 bg-green-50 px-5 py-4 sm:px-6">
                    <p className="font-bold text-green-800">
                      Your order has been delivered.
                    </p>

                    <p className="mt-1 text-sm leading-5 text-green-700">
                      Thank you for choosing LIC Printing Corporation.
                    </p>
                  </div>
                )}

                {/* =====================================================
                    CURRENT STATUS
                ===================================================== */}

                <div className="mx-auto mt-7 max-w-[1000px] rounded-3xl border border-[#dfd3c8] bg-[#faf6f0] p-5 sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a806c]">
                    Current Status
                  </p>

                  <p className="mt-2 text-xl font-black leading-snug text-[#52321f] sm:text-2xl">
                    {result.currentStatus}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#6f6258]">
                      Progress
                    </span>

                    <span className="font-bold text-[#52321f]">
                      {result.progress}%
                    </span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e3ddd7]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDelivered
                          ? "bg-green-600"
                          : "bg-[#b88929]"
                      }`}
                      style={{
                        width: `${Math.min(
                          Number(result.progress) || 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* =====================================================
                    DESKTOP / TABLET TIMELINE
                ===================================================== */}

                <div className="mx-auto mt-10 hidden max-w-[1000px] sm:block">
                  <p className="mb-7 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a806c]">
                    Order Progress
                  </p>

                  <div className="mx-auto flex items-start">
                    {trackingSteps.map((step, index) => {
                      const isDone = isDelivered
                        ? index <= phaseIndex
                        : index < phaseIndex;

                      const isCurrent =
                        index === phaseIndex && !isDelivered;

                      return (
                        <div
                          key={step}
                          className="relative flex flex-1 flex-col items-center"
                        >
                          {index < trackingSteps.length - 1 && (
                            <div
                              className={`absolute left-1/2 top-[17px] h-[3px] w-full ${
                                index < phaseIndex || isDelivered
                                  ? "bg-green-600"
                                  : "bg-[#dfd8d1]"
                              }`}
                            />
                          )}

                          <div
                            className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                              isDone
                                ? "border-green-600 bg-green-600 text-white"
                                : isCurrent
                                  ? "border-[#b88c32] bg-[#fff5d8] text-[#5a3823]"
                                  : "border-[#d6cec7] bg-white text-[#aaa29b]"
                            }`}
                          >
                            {isDone ? "✓" : index + 1}
                          </div>

                          <p
                            className={`mt-3 max-w-[115px] px-1 text-center text-[10px] font-semibold leading-[1.3] ${
                              isDone || isCurrent
                                ? "text-[#503422]"
                                : "text-[#aaa29b]"
                            }`}
                          >
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* =====================================================
                    MOBILE TIMELINE
                ===================================================== */}

                <div className="mt-8 space-y-2 sm:hidden">
                  <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a806c]">
                    Order Progress
                  </p>

                  {trackingSteps.map((step, index) => {
                    const isDone = isDelivered
                      ? index <= phaseIndex
                      : index < phaseIndex;

                    const isCurrent =
                      index === phaseIndex && !isDelivered;

                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                          isDone
                            ? "border-green-200 bg-green-50"
                            : isCurrent
                              ? "border-[#cfad55] bg-[#fff8e7]"
                              : "border-[#e0d9d2] bg-white"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isDone
                              ? "bg-green-600 text-white"
                              : isCurrent
                                ? "bg-[#b88929] text-white"
                                : "bg-[#ebe7e2] text-[#999]"
                          }`}
                        >
                          {isDone ? "✓" : index + 1}
                        </div>

                        <p
                          className={`text-sm font-semibold ${
                            isDone || isCurrent
                              ? "text-[#503422]"
                              : "text-[#a29b95]"
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
          </section>
        )}

        <section className="texture-section">
          <div className="texture-content mx-auto max-w-[1280px] px-5 pb-8 sm:px-8 xl:px-8">
            <h2 className="font-serif text-[30px] font-normal text-white sm:text-[42px] xl:text-[52px]">
              How Tracking Works?
            </h2>

            <div className="mt-7 grid overflow-hidden rounded-[28px] bg-[#fff9ef] px-5 py-6 md:grid-cols-3 md:rounded-[36px] md:px-10 md:py-8">
              {[
                {
                  number: "01",
                  title: "Enter Tracking Number",
                  text: "Use the unique tracking number provided by LIC Printing Corporation.",
                },
                {
                  number: "02",
                  title: "View Production Status",
                  text: "Monitor your order as it moves through production.",
                },
                {
                  number: "03",
                  title: "Ready for Release",
                  text: "Know when your order is completed and ready for pickup or release.",
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className="flex items-start gap-3 border-b border-[#e5d8c8] py-5 last:border-0 md:border-b-0 md:border-r md:px-6 md:py-0 md:last:border-r-0"
                >
                  <span className="shrink-0 text-[46px] font-black leading-none tracking-[-0.06em] text-[#684429] sm:text-[52px]">
                    {item.number}
                  </span>

                  <div className="pt-1">
                    <h3 className="text-[17px] font-black leading-tight text-[#4a2d1c] sm:text-[18px]">
                      {item.title}
                    </h3>

                    <p className="mt-1 max-w-[270px] text-[11px] leading-4 text-[#604f43]">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 overflow-hidden rounded-[28px] bg-[#fff9ef] px-4 py-7 sm:rounded-[36px] sm:px-7 sm:py-8 xl:px-10">
              <div className="min-h-[390px] sm:min-h-[420px]">
                <div
                  className="elfsight-app-603ad0f4-a92f-4e8b-8487-09219a3da948"
                  data-elfsight-app-lazy
                />
              </div>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-6 px-1 text-white sm:px-3 xl:grid-cols-[1fr_auto] xl:items-center">
              <div>
                <h3 className="text-[26px] font-bold leading-tight sm:text-[30px]">
                  Need help with your order
                </h3>

                <p className="mt-1 text-sm text-white/85 sm:text-base">
                  For pickup schedules, release arrangements, and
                  order inquiries, our team is ready to assist.
                </p>
              </div>

              <a
                href="tel:+639434164978"
                className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-[#fff9ef] px-5 py-3 text-sm font-black text-[#23150e] transition duration-200 hover:scale-[1.02] sm:px-7 sm:text-base"
              >
                <Image
                  src="/viber-logo.png"
                  alt="Viber"
                  width={30}
                  height={30}
                  className="h-[30px] w-[30px] object-contain"
                />

                <span>+63 943 416 4978 (Viber)</span>
              </a>
            </div>

            <footer className="mt-12 px-1 pb-5 text-white sm:px-3">
              <div className="grid grid-cols-1 items-center gap-7 xl:grid-cols-[1fr_auto_1fr]">
                <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
                  <a
                    href="https://www.licprintingshop.net/terms-and-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[135px] rounded-lg bg-[#fff9ef] px-5 py-2 text-center text-[11px] text-[#55463c] transition hover:scale-[1.03] hover:bg-white"
                  >
                    Terms &amp; Condition
                  </a>

                  <a
                    href="https://www.licprintingshop.net/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[135px] rounded-lg bg-[#fff9ef] px-5 py-2 text-center text-[11px] text-[#55463c] transition hover:scale-[1.03] hover:bg-white"
                  >
                    Privacy Policy
                  </a>
                </div>

                <a
                  href="https://www.licprintingcorporation.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 text-[15px] font-medium transition hover:opacity-80 sm:text-[20px]"
                >
                  <Image
                    src="/web-logo.png"
                    alt="LIC Printing Corporation Website"
                    width={38}
                    height={38}
                    className="h-[34px] w-[34px] object-contain sm:h-[38px] sm:w-[38px]"
                  />

                  <span className="break-all sm:whitespace-nowrap">
                    www.licprintingcorporation.com
                  </span>
                </a>

                <div className="flex flex-wrap items-center justify-center gap-3 xl:justify-end">
                  <a
                    href="https://www.facebook.com/licprintingshop/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-11 w-11 items-center justify-center transition hover:-translate-y-1 hover:scale-110"
                  >
                    <Image
                      src="/facebook-logo.png"
                      alt="Facebook"
                      width={42}
                      height={42}
                      className="h-[42px] w-[42px] object-contain"
                    />
                  </a>

                  <a
                    href="https://www.instagram.com/lic.printingcorporation"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-11 w-11 items-center justify-center transition hover:-translate-y-1 hover:scale-110"
                  >
                    <Image
                      src="/instagram-logo.png"
                      alt="Instagram"
                      width={42}
                      height={42}
                      className="h-[42px] w-[42px] object-contain"
                    />
                  </a>

                  <a
                    href="https://www.tiktok.com/@lic_birprintingcorp"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="flex h-11 w-11 items-center justify-center transition hover:-translate-y-1 hover:scale-110"
                  >
                    <Image
                      src="/tiktok-logo.png"
                      alt="TikTok"
                      width={42}
                      height={42}
                      className="h-[42px] w-[42px] object-contain"
                    />
                  </a>

                  <span className="w-full text-center text-[16px] font-semibold sm:ml-2 sm:w-auto sm:whitespace-nowrap sm:text-[19px]">
                    @licprintingshop
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}