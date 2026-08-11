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

  Running:
    "Great news! Your order is currently being printed.",

  Numbering:
    "Your documents are now receiving their serial numbering.",

  Collating:
    "Your printed documents are being organized and arranged.",

  "Stapling/Padding":
    "Your documents are now being assembled and bound together.",

  "Cutting & Trimming":
    "Your order is being trimmed to its final size.",

  Browning:
    "Your order is in the final finishing process.",

  Stamping:
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

type OrderDocument = {
  name: string;
  booklets: number | null;
  serial?: string;
  paper?: string;
  ply?: string;
  size?: string;
  special?: string;
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

  if (!stage) {
    return 0;
  }

  const index = WORKFLOW.findIndex(
    (item) => item === stage
  );

  return Math.round(
    ((index + 1) / WORKFLOW.length) * 100
  );
}

function getNextStage(listName: string) {
  const stage = findWorkflowStage(listName);

  if (!stage) {
    return "";
  }

  const index = WORKFLOW.findIndex(
    (item) => item === stage
  );

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

  return (
    CUSTOMER_STATUS[stage] ||
    "Your order is currently being processed."
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractField(
  text: string,
  labels: string[]
) {
  for (const label of labels) {
    const regex = new RegExp(
      `(?:^|\\n)\\s*${escapeRegex(
        label
      )}\\s*[:\\-]\\s*(.+)`,
      "i"
    );

    const match = text.match(regex);

    if (match) {
      return match[1]
        .split("\n")[0]
        .trim();
    }
  }

  return "";
}

function extractNextLineField(
  text: string,
  labels: string[]
) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const upperLabels = labels.map((label) =>
    label.toUpperCase()
  );

  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i].toUpperCase();

    if (upperLabels.includes(current)) {
      const value = lines[i + 1]?.trim();

      if (value) {
        return value;
      }
    }
  }

  return "";
}

function extractTrackingNumber(
  cardName: string,
  desc: string
) {
  const combined = `${cardName}\n${desc}`;

  return (
    extractField(combined, [
      "Tracking No",
      "Tracking No.",
      "Tracking Number",
      "Tracking",
      "TN",
    ]) ||
    extractNextLineField(combined, [
      "Tracking No",
      "Tracking No.",
      "Tracking Number",
      "Tracking",
      "TN",
    ]) ||
    combined
      .match(
        /\bLIC-\d{6}-[A-Z0-9]{4,20}\b/i
      )?.[0]
      ?.toUpperCase() ||
    ""
  );
}

function cleanCustomerName(
  cardName: string,
  desc: string
) {
  const labels = [
    "Trade Name",
    "Business Name",
    "Business",
    "Customer",
    "Customer Name",
    "Client",
    "Client Name",
  ];

  const directField = extractField(
    desc,
    labels
  );

  if (directField) {
    return directField;
  }

  const nextLineField =
    extractNextLineField(
      desc,
      labels
    );

  if (nextLineField) {
    return nextLineField;
  }

  let name = cardName;

  name = name.replace(
    /\bLIC-\d{6}-[A-Z0-9]{4,20}\b/gi,
    ""
  );

  name = name.replace(
    /^\([^)]*\)\s*/i,
    ""
  );

  name = name.replace(
    /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2},?\s+\d{4}\b/gi,
    ""
  );

  name = name.replace(
    /\(NON-BIR\)/gi,
    ""
  );

  name = name.replace(
    /\(NON BIR\)/gi,
    ""
  );

  name = name.replace(
    /\(NON-VAT\)/gi,
    ""
  );

  name = name.replace(
    /\(VAT\)/gi,
    ""
  );

  name = name.replace(
    /\b(SERVICE INVOICE|SALES INVOICE|OFFICIAL RECEIPT|COLLECTION RECEIPT|DELIVERY RECEIPT|BILLING INVOICE|CASH INVOICE|INVOICE|RECEIPT)\s*[-–—]?\s*\d+\b.*$/i,
    ""
  );

  name = name.replace(
    /\(BRANCH[^)]*\)/gi,
    ""
  );

  name = name.replace(
    /\(ORUS ATP.*$/i,
    ""
  );

  name = name.replace(
    /\(ORIG ATP.*$/i,
    ""
  );

  name = name.replace(
    /\(ATP.*$/i,
    ""
  );

  return name
    .replace(/\s+/g, " ")
    .replace(/\s*[-|/]\s*$/, "")
    .trim();
}

function extractTaxType(
  cardName: string,
  desc: string
) {
  const labels = [
    "Tax Type",
    "Tax",
    "Order Type",
  ];

  const directField = extractField(
    desc,
    labels
  );

  if (directField) {
    return directField.toUpperCase();
  }

  const nextLineField =
    extractNextLineField(
      desc,
      labels
    );

  if (nextLineField) {
    return nextLineField.toUpperCase();
  }

  const text =
    `${cardName}\n${desc}`.toUpperCase();

  if (text.includes("NON-BIR")) {
    return "NON-BIR";
  }

  if (
    text.includes("NON-VAT") ||
    text.includes("NON VAT") ||
    text.includes("NVAT")
  ) {
    return "NON-VAT";
  }

  if (text.includes("VAT")) {
    return "VAT";
  }

  return "";
}

function extractStructuredDocuments(
  desc: string
): OrderDocument[] {
  const blockMatch = desc.match(
    /DOCUMENT SPECIFICATIONS START([\s\S]*?)DOCUMENT SPECIFICATIONS END/i
  );

  if (!blockMatch) {
    return [];
  }

  const block = blockMatch[1];

  const sections = block
    .split(
      /(?=DOCUMENT\s+\d+\s*(?:\r?\n|$))/i
    )
    .map((section) => section.trim())
    .filter(Boolean);

  const documents: OrderDocument[] = [];

  for (const section of sections) {
    const documentNumberMatch =
      section.match(
        /^DOCUMENT\s+(\d+)/i
      );

    if (!documentNumberMatch) {
      continue;
    }

    const type = extractField(
      section,
      [
        "TYPE",
        "Document Type",
        "Description",
      ]
    );

    const qtyText = extractField(
      section,
      [
        "QTY",
        "Quantity",
        "Booklets",
      ]
    );

    const serial = extractField(
      section,
      [
        "SERIAL",
        "Serial Number",
      ]
    );

    const paper = extractField(
      section,
      ["PAPER"]
    );

    const ply = extractField(
      section,
      ["PLY"]
    );

    const size = extractField(
      section,
      ["SIZE"]
    );

    const special = extractField(
      section,
      ["SPECIAL"]
    );

    const parsedQty = Number(
      (qtyText || "").replace(
        /[^\d]/g,
        ""
      )
    );

    documents.push({
      name:
        type ||
        `Document ${documentNumberMatch[1]}`,

      booklets:
        qtyText &&
        Number.isFinite(parsedQty)
          ? parsedQty
          : null,

      serial:
        serial || undefined,

      paper:
        paper || undefined,

      ply:
        ply || undefined,

      size:
        size || undefined,

      special:
        special &&
        special !== "-"
          ? special
          : undefined,
    });
  }

  return documents;
}

function extractLegacyDocumentList(
  desc: string
): OrderDocument[] {
  const documentLine = extractField(
    desc,
    [
      "DOCUMENT",
      "DOCUMENTS",
      "Document Type",
    ]
  );

  const qtyLine = extractField(
    desc,
    [
      "QTY",
      "Quantity",
    ]
  );

  if (!documentLine) {
    return [];
  }

  const documentNames =
    documentLine
      .split("/")
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);

  const quantities =
    qtyLine
      ? qtyLine
          .split("/")
          .map((item) => {
            const parsed =
              Number(
                item.replace(
                  /[^\d]/g,
                  ""
                )
              );

            return Number.isFinite(
              parsed
            )
              ? parsed
              : null;
          })
      : [];

  return documentNames.map(
    (name, index) => ({
      name,

      booklets:
        quantities[index] ??
        null,
    })
  );
}

function extractNonBirIntakeDocuments(
  desc: string
): OrderDocument[] {
  const lines = desc
    .split(/\r?\n/)
    .map((line) => line.trim());

  const documentsIndex =
    lines.findIndex(
      (line) =>
        line.toUpperCase() ===
        "DOCUMENTS INCLUDED"
    );

  if (documentsIndex === -1) {
    return [];
  }

  const documents: OrderDocument[] = [];

  let index =
    documentsIndex + 1;

  while (index < lines.length) {
    const line = lines[index];

    if (!line) {
      index++;
      continue;
    }

    const documentNumberMatch =
      line.match(/^(\d+)$/);

    if (!documentNumberMatch) {
      index++;
      continue;
    }

    const sectionLines: string[] = [];

    index++;

    while (index < lines.length) {
      const current =
        lines[index].trim();

      if (
        /^\d+$/.test(current)
      ) {
        break;
      }

      if (
        [
          "SALES ASSIGNED",
          "ORDER TYPE",
          "PRIORITY",
          "DELIVERY STRATEGY",
          "STATUS",
        ].includes(
          current.toUpperCase()
        )
      ) {
        break;
      }

      sectionLines.push(current);
      index++;
    }

    const section =
      sectionLines.join("\n");

    const name =
      extractField(
        section,
        [
          "Description",
          "Document",
          "Type",
        ]
      );

    const bookletsText =
      extractField(
        section,
        [
          "Booklets",
          "QTY",
          "Quantity",
        ]
      );

    const serial =
      extractField(
        section,
        [
          "Serial",
          "Serial Number",
        ]
      );

    const parsedBooklets =
      Number(
        (bookletsText || "")
          .replace(/[^\d]/g, "")
      );

    if (name) {
      documents.push({
        name,

        booklets:
          bookletsText &&
          Number.isFinite(
            parsedBooklets
          )
            ? parsedBooklets
            : null,

        serial:
          serial || undefined,
      });
    }
  }

  return documents;
}

function extractDocuments(
  cardName: string,
  desc: string
): OrderDocument[] {
  const structured =
    extractStructuredDocuments(
      desc
    );

  if (structured.length > 0) {
    return structured;
  }

  const nonBirIntake =
    extractNonBirIntakeDocuments(
      desc
    );

  if (nonBirIntake.length > 0) {
    return nonBirIntake;
  }

  const legacy =
    extractLegacyDocumentList(
      desc
    );

  if (legacy.length > 0) {
    return legacy;
  }

  return [];
}

function getTotalBooklets(
  documents: OrderDocument[]
) {
  return documents.reduce(
    (total, document) =>
      total +
      (document.booklets || 0),
    0
  );
}

async function getListName(
  idList: string
) {
  const response = await fetch(
    `https://api.trello.com/1/lists/${idList}?key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to fetch Trello list."
    );
  }

  const list =
    await response.json();

  return list.name;
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const q =
      searchParams
        .get("q")
        ?.toUpperCase()
        .trim();

    if (!q) {
      return NextResponse.json(
        {
          error:
            "Please enter your tracking number.",
        },
        {
          status: 400,
        }
      );
    }

    const cards =
      await getBoardCards();

    const card = cards.find(
      (item: any) => {
        const name =
          item.name
            ?.toUpperCase() || "";

        const desc =
          item.desc
            ?.toUpperCase() || "";

        return (
          name.includes(q) ||
          desc.includes(q)
        );
      }
    );

    if (!card) {
      return NextResponse.json(
        {
          error:
            "Tracking number not found.",
        },
        {
          status: 404,
        }
      );
    }

    const cardDescription =
      card.desc || "";

    const listName =
      await getListName(
        card.idList
      );

    const stage =
      findWorkflowStage(
        listName
      );

    const upperList =
      listName.toUpperCase();

    const documents =
      extractDocuments(
        card.name,
        cardDescription
      );

    const totalBooklets =
      getTotalBooklets(
        documents
      );

    return NextResponse.json({
      success: true,
      multiple: false,

      trackingNumber:
        extractTrackingNumber(
          card.name,
          cardDescription
        ),

      customerName:
        cleanCustomerName(
          card.name,
          cardDescription
        ),

      taxType:
        extractTaxType(
          card.name,
          cardDescription
        ),

      documents,

      documentCount:
        documents.length,

      totalBooklets,

      cardName:
        card.name,

      currentList:
        listName,

      currentStage:
        stage,

      currentStatus:
        getCustomerStatus(
          listName
        ),

      nextStage:
        getNextStage(
          listName
        ),

      progress:
        getProgress(
          listName
        ),

      courier:
        extractField(
          cardDescription,
          [
            "Courier",
            "Carrier",
          ]
        ) ||
        extractNextLineField(
          cardDescription,
          [
            "Courier",
            "Carrier",
          ]
        ),

      releaseDate:
        extractField(
          cardDescription,
          [
            "Release Date",
            "Pickup Date",
          ]
        ) ||
        extractNextLineField(
          cardDescription,
          [
            "Release Date",
            "Pickup Date",
          ]
        ),

      dateReceived:
        card.dateLastActivity,

      isReady:
        upperList.includes(
          "READY FOR RELEASE"
        ) ||
        upperList.includes(
          "DELIVERED BY LIC"
        ) ||
        upperList.includes(
          "PICKED UP BY CLIENT"
        ),

      isDelivered:
        upperList.includes(
          "DELIVERED BY LIC"
        ) ||
        upperList.includes(
          "PICKED UP BY CLIENT"
        ),

      isIgnored:
        isIgnoredList(
          listName
        ),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}