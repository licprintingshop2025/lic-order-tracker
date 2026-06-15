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

function cleanCustomerName(cardName: string) {
  return cardName
    .replace(/^LIC\d{2}-[A-Z0-9]{12,16}\s*\|\s*/i, "")
    .replace(/^\([^)]*\)\s*/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/SERVICE-\d+/gi, "")
    .replace(/SALES-\d+/gi, "")
    .replace(/SI\s*NVAT\s*\d+/gi, "")
    .replace(/SI\s*VAT\s*\d+/gi, "")
    .replace(/NON-VAT/gi, "")
    .replace(/VAT/gi, "")
    .replace(/\bJANUARY\b.*$/i, "")
    .replace(/\bFEBRUARY\b.*$/i, "")
    .replace(/\bMARCH\b.*$/i, "")
    .replace(/\bAPRIL\b.*$/i, "")
    .replace(/\bMAY\b.*$/i, "")
    .replace(/\bJUNE\b.*$/i, "")
    .replace(/\bJULY\b.*$/i, "")
    .replace(/\bAUGUST\b.*$/i, "")
    .replace(/\bAUG\b.*$/i, "")
    .replace(/\bSEPTEMBER\b.*$/i, "")
    .replace(/\bOCTOBER\b.*$/i, "")
    .replace(/\bNOVEMBER\b.*$/i, "")
    .replace(/\bDECEMBER\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTrackingNumber(cardName: string) {
  const match = cardName.toUpperCase().match(/LIC\d{2}-[A-Z0-9]{12,16}/);
  return match ? match[0] : "";
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

    const trackingPattern = /^LIC\d{2}-[A-Z0-9]{12,16}$/;

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