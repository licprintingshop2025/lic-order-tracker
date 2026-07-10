import { NextResponse } from "next/server";
import { getBoardCards } from "@/lib/trello";

const WORKFLOW = [
  "Station 1 & 2 (Layouting & Encoding)",
  "Admin Head",
  "Quality Checking",
  "Receiving & Pre-Print Formatting",
  "Running",
  "Numbering",
  "Collating",
  "Stapling/Padding",
  "Cutting & Trimming",
  "Browning",
  "Stamping",
  "Packaging & Labelling",
  "Finish Receipt",
  "Ready for Release",
  "Delivered by LIC",
  "Picked Up by Client",
];

const IGNORED_LISTS = [
  "ATP Intake",
  "Non-BIR Intake",
  "Station 3",
  "Station 4",
  "Hold with Problems",
  "Text Messaging",
];

const CUSTOMER_STATUS: Record<string, string> = {
  "Station 1 & 2 (Layouting & Encoding)":
    "We've received your order and our team is preparing it for production.",

  "Admin Head":
    "Your order is currently awaiting approval before moving to production.",

  "Quality Checking":
    "Our team is carefully reviewing your order to ensure everything is accurate.",

  "Receiving & Pre-Print Formatting":
    "Your files are being prepared and formatted for printing.",

  "Running":
    "Great news! Your order is currently being printed.",

  "Numbering":
    "Your documents are now receiving their serial numbering.",

  "Collating":
    "Your printed documents are being organized and arranged.",

  "Stapling/Padding":
    "Your documents are now being assembled and bound together.",

  "Cutting & Trimming":
    "Your order is being trimmed to its final size.",

  "Browning":
    "Your order is in the final finishing process.",

  "Stamping":
    "Your documents are currently being stamped.",

  "Packaging & Labelling":
    "Almost done! Your order is being packed and labeled.",

  "Finish Receipt":
    "We're completing the final checks before releasing your order.",

  "Ready for Release":
    "Your order is complete and ready for pickup or release.",

  "Delivered by LIC":
    "Your order has been successfully delivered.",

  "Picked Up by Client":
    "Your order has been successfully delivered.",
};

function isIgnoredList(listName: string) {
  const upper = listName.toUpperCase();

  return IGNORED_LISTS.some((item) =>
    upper.includes(item.toUpperCase())
  );
}

function findWorkflowStage(listName: string) {
  if (isIgnoredList(listName)) {
    return null;
  }

  const upper = listName.toUpperCase();

  return (
    WORKFLOW.find((stage) =>
      upper.includes(stage.toUpperCase())
    ) || null
  );
}

function getProgress(listName: string) {
  const upper = listName.toUpperCase();

  if (
    upper.includes("DELIVERED BY LIC") ||
    upper.includes("PICKED UP BY CLIENT")
  ) {
    return 100;
  }

  const stage = findWorkflowStage(listName);

  if (!stage) return 0;

  const index = WORKFLOW.findIndex((item) => item === stage);

  return Math.round(((index + 1) / WORKFLOW.length) * 100);
}

function getNextStage(listName: string) {
  const stage = findWorkflowStage(listName);

  if (!stage) return "";

  const index = WORKFLOW.findIndex((item) => item === stage);

  return WORKFLOW[index + 1] || "Completed";
}

function getCustomerStatus(listName: string) {
  if (isIgnoredList(listName)) {
    return "Your order is currently being processed.";
  }

  const stage = findWorkflowStage(listName);

  if (!stage) {
    return "Your order is currently being processed.";
  }

  return CUSTOMER_STATUS[stage] || "Your order is currently being processed.";
}

function extractField(text: string, labels: string[]) {
  for (const label of labels) {
    const regex = new RegExp(`${label}\\s*[:\\-]\\s*(.+)`, "i");
    const match = text.match(regex);

    if (match) {
      return match[1].split("\n")[0].trim();
    }
  }

  return "";
}

function extractTrackingNumber(cardName: string, desc: string) {
  const combined = `${cardName}\n${desc}`;

  return (
    extractField(combined, [
      "Tracking No",
      "Tracking Number",
      "Tracking",
      "TN",
    ]) ||
    combined.match(/LIC\d{2}-[A-Z0-9]{6,20}/i)?.[0]?.toUpperCase() ||
    ""
  );
}

function cleanCustomerName(cardName: string, desc: string) {
  const fromDesc = extractField(desc, [
  "Trade Name",
  "Customer",
  "Customer Name",
  "Client",
  "Client Name",
]);

  if (fromDesc) return fromDesc;

  let name = cardName;

  name = name.replace(/LIC\d{2}-[A-Z0-9]{6,20}/gi, "");
  name = name.replace(/^\([^)]*\)\s*/, "");
  name = name.replace(/\(BRANCH[^)]*\)/gi, "");
  name = name.replace(/\(\d+[A-Z]?\)/gi, "");

  name = name.replace(
    /\b(SI|CR|DR|AR|BI|SERVICE|SALES|OR|INVOICE|RECEIPT)[-\s]?\d*\b.*$/i,
    ""
  );

  name = name.replace(/\(ORUS ATP.*$/i, "");
  name = name.replace(/\(ORIG ATP.*$/i, "");
  name = name.replace(/\(ATP.*$/i, "");

  return name.replace(/\s+/g, " ").trim();
}

function extractDocumentType(cardName: string, desc: string) {
  return (
    extractField(desc, ["Document Type", "Document", "Form Type"]) ||
    cardName
      .toUpperCase()
      .match(
        /\b(SALES-\d+|SI\s*NVAT\s*\d+|SI\s*VAT\s*\d+|SI-\d+|BI-\d+|CR-\d+|OR-\d+|SERVICE-\d+|DR-\d+|AR-\d+|CI-\d+)\b/g
      )
      ?.join(" / ") ||
    ""
  );
}

function extractTaxType(cardName: string, desc: string) {
  const taxFromDesc = extractField(desc, ["Tax Type", "Tax"]);

  if (taxFromDesc) return taxFromDesc.toUpperCase();

  const text = `${cardName}\n${desc}`.toUpperCase();

  if (text.includes("NON-VAT") || text.includes("NVAT")) return "NON-VAT";
  if (text.includes("VAT")) return "VAT";

  return "";
}

async function getListName(idList: string) {
  const response = await fetch(
    `https://api.trello.com/1/lists/${idList}?key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Unable to fetch Trello list.");
  }

  const list = await response.json();

  return list.name;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toUpperCase().trim();

    if (!q) {
      return NextResponse.json(
        { error: "Please enter your tracking number." },
        { status: 400 }
      );
    }

    const cards = await getBoardCards();

    const card = cards.find((item: any) => {
      const name = item.name?.toUpperCase() || "";
      const desc = item.desc?.toUpperCase() || "";

      return name.includes(q) || desc.includes(q);
    });

    if (!card) {
      return NextResponse.json(
        { error: "Tracking number not found." },
        { status: 404 }
      );
    }

    const listName = await getListName(card.idList);
    const stage = findWorkflowStage(listName);
    const upperList = listName.toUpperCase();

    return NextResponse.json({
      success: true,
      multiple: false,

      trackingNumber: extractTrackingNumber(card.name, card.desc || ""),
      customerName: cleanCustomerName(card.name, card.desc || ""),
      documentType: extractDocumentType(card.name, card.desc || ""),
      taxType: extractTaxType(card.name, card.desc || ""),

      cardName: card.name,
      currentList: listName,
      currentStage: stage,
      currentStatus: getCustomerStatus(listName),
      nextStage: getNextStage(listName),
      progress: getProgress(listName),

      courier: extractField(card.desc || "", ["Courier", "Carrier"]),
      releaseDate: extractField(card.desc || "", [
        "Release Date",
        "Pickup Date",
      ]),
      dateReceived: card.dateLastActivity,

      isReady:
        upperList.includes("READY FOR RELEASE") ||
        upperList.includes("DELIVERED BY LIC") ||
        upperList.includes("PICKED UP BY CLIENT"),

      isDelivered:
        upperList.includes("DELIVERED BY LIC") ||
        upperList.includes("PICKED UP BY CLIENT"),

      isIgnored: isIgnoredList(listName),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}