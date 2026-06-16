import { NextResponse } from "next/server";
import { getBoardCards } from "@/lib/trello";

function getProgress(listName: string) {
  const name = listName.toUpperCase();

  if (name.includes("STATION 1")) return 5;
  if (name.includes("ADMIN HEAD")) return 12;
  if (name.includes("QUALITY CHECKING")) return 20;
  if (name.includes("RECEIVING") || name.includes("PRE-PRINT")) return 28;
  if (name.includes("RUNNING")) return 36;
  if (name.includes("NUMBERING")) return 44;
  if (name.includes("COLLATING")) return 52;
  if (name.includes("STAPLING") || name.includes("PADDING")) return 60;
  if (name.includes("CUTTING") || name.includes("TRIMMING")) return 68;
  if (name.includes("BROWNING")) return 76;
  if (name.includes("STAMPING")) return 84;
  if (name.includes("PACKAGING") || name.includes("LABELLING")) return 92;
  if (name.includes("FINISH RECEIPT")) return 96;
  if (name.includes("READY FOR RELEASE")) return 100;

  return 0;
}

function extractTrackingNumber(cardName: string) {
  const match = cardName.toUpperCase().match(/LIC\d{2}-[A-Z0-9]{8,16}/);
  return match ? match[0] : "";
}

function cleanCustomerName(cardName: string) {
  let name = cardName;

  // Remove tracking number
  name = name.replace(/^LIC\d{2}-[A-Z0-9]{8,16}\s*/i, "");

  // Remove staff name
  name = name.replace(/^\([^)]*\)\s*/, "");

  // Remove branch
  name = name.replace(/\(BRANCH\s*[^)]*\)/gi, "");

  // Remove RDO
  name = name.replace(/\(\d+[A-Z]?\)/gi, "");

  // Remove invoice references
  name = name.replace(/\b(SALES|SI|BI|CR|OR|SERVICE|DR|AR|CI)[-\s]?\d+.*$/i, "");

  // Remove words like INVOICE / RECEIPT
  name = name.replace(/\b(INVOICE|RECEIPT|SALES INVOICE|SERVICE INVOICE)\b.*$/i, "");

  // Remove VAT text
  name = name.replace(/\b(VAT|NON-VAT|NVAT)\b.*$/i, "");

  // Remove month/date text
  name = name.replace(
    /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|AUG|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\b.*$/i,
    ""
  );

  return name.replace(/\s+/g, " ").trim();
}

function extractDocumentType(cardName: string) {
  const match = cardName
    .toUpperCase()
    .match(/\b(SALES-\d+|SI\s*NVAT\s*\d+|SI\s*VAT\s*\d+|SI-\d+|BI-\d+|CR-\d+|OR-\d+|SERVICE-\d+|DR-\d+|AR-\d+|CI-\d+)\b/g);

  return match ? match.join(" / ") : "";
}

function extractTaxType(cardName: string) {
  const name = cardName.toUpperCase();

  if (name.includes("NON-VAT") || name.includes("NVAT")) return "NON-VAT";
  if (name.includes("VAT")) return "VAT";

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

    const trackingPattern = /^LIC\d{2}-[A-Z0-9]{8,16}$/;

    if (!trackingPattern.test(q)) {
      return NextResponse.json(
        { error: "Please enter a valid LIC tracking number." },
        { status: 400 }
      );
    }

    const cards = await getBoardCards();

    const card = cards.find((item: any) =>
      item.name.toUpperCase().includes(q)
    );

    if (!card) {
      return NextResponse.json(
        { error: "Tracking number not found." },
        { status: 404 }
      );
    }

    const listName = await getListName(card.idList);

    return NextResponse.json({
      success: true,
      multiple: false,
      trackingNumber: extractTrackingNumber(card.name),
      customerName: cleanCustomerName(card.name),
      documentType: extractDocumentType(card.name),
      taxType: extractTaxType(card.name),
      cardName: card.name,
      currentList: listName,
      currentStatus: listName,
      progress: getProgress(listName),
      dateReceived: card.dateLastActivity,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}