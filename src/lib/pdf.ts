import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatThaiDate, toThaiDigits } from "./thai";

export interface CertificateRenderData {
  recipientName: string;
  projectName: string;
  trainingLocation: string;
  dateStart: string | null;
  dateEnd: string | null;
  idpHours: string | null;
  templateUrl: string;
  signatureUrl: string;
  signerName: string;
  signerPosition1: string;
  signerPosition2?: string | null;
  signerPosition3?: string | null;
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function embedImageSafe(pdfDoc: PDFDocument, url: string) {
  const bytes = await fetchBytes(url);
  if (!bytes) return null;
  // Detect PNG vs JPEG by magic bytes
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  try {
    return isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  } catch {
    try {
      return isPng ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
    } catch {
      return null;
    }
  }
}

function drawCenteredText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  y: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth = 760
) {
  if (!text) return;
  const { width } = page.getSize();
  // Wrap if wider than maxWidth
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  let currY = y;
  for (const line of lines) {
    const textWidth = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: (width - textWidth) / 2,
      y: currY,
      size,
      font,
      color: rgb(0.08, 0.08, 0.08),
    });
    currY -= size * 1.15;
  }
}

export async function generateCertificatePdfBytes(
  items: CertificateRenderData[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    fetchBytes("/font/THSarabun/THSarabun.ttf"),
    fetchBytes("/font/THSarabun/THSarabun%20Bold.ttf"),
  ]);

  if (!regularBytes || !boldBytes) {
    throw new Error("ไม่พบไฟล์ฟอนต์ THSarabun ใน /font/THSarabun/");
  }

  const fontRegular = await pdfDoc.embedFont(regularBytes);
  const fontBold = await pdfDoc.embedFont(boldBytes);

  // Cache embedded images by URL so batch printing is fast
  const imageCache = new Map<string, Awaited<ReturnType<typeof embedImageSafe>>>();
  const getImage = async (url: string) => {
    if (!url) return null;
    if (imageCache.has(url)) return imageCache.get(url) || null;
    const img = await embedImageSafe(pdfDoc, url);
    imageCache.set(url, img);
    return img;
  };

  // A4 Landscape: 841.89 x 595.28 pt
  const pageWidth = 841.89;
  const pageHeight = 595.28;

  for (const item of items) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // 1. Background Template
    const bgImg = await getImage(item.templateUrl);
    if (bgImg) {
      page.drawImage(bgImg, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    }

    // 2. Recipient Name
    drawCenteredText(page, item.recipientName, 365, fontBold, 34, 720);

    // 3. Project Name
    drawCenteredText(page, toThaiDigits(item.projectName), 322, fontBold, 22, 740);

    // 4. Date & Hours
    const dStart = formatThaiDate(item.dateStart, false);
    const dEnd = item.dateEnd ? formatThaiDate(item.dateEnd, false) : "";
    const idpNum = Number(item.idpHours || 0);
    const idpText = idpNum > 0 ? `จำนวน ${toThaiDigits(idpNum)} ชั่วโมง` : "";
    const dateLine = dEnd
      ? `ระหว่างวันที่ ${dStart} ถึง ${dEnd}${idpText ? "  " + idpText : ""}`
      : `ในวันที่ ${dStart}${idpText ? "  " + idpText : ""}`;
    drawCenteredText(page, dateLine, 286, fontBold, 20, 740);

    // 5. Location
    if (item.trainingLocation) {
      drawCenteredText(
        page,
        toThaiDigits(item.trainingLocation),
        255,
        fontBold,
        20,
        740
      );
    }

    // 6. Issue Date
    const issueDate = formatThaiDate(item.dateStart, true);
    if (issueDate) {
      drawCenteredText(page, `ให้ไว้ ณ วันที่ ${issueDate}`, 220, fontBold, 20, 740);
    }

    // 7. Signature Image
    const sigImg = await getImage(item.signatureUrl);
    if (sigImg) {
      const sigW = 110;
      const sigH = (sigImg.height / sigImg.width) * sigW;
      const clampedH = Math.min(sigH, 55);
      const clampedW = (sigImg.width / sigImg.height) * clampedH;
      page.drawImage(sigImg, {
        x: (pageWidth - clampedW) / 2,
        y: 145,
        width: clampedW,
        height: clampedH,
      });
    }

    // 8. Signer Name & Positions
    drawCenteredText(page, item.signerName, 125, fontBold, 20, 700);
    drawCenteredText(page, item.signerPosition1, 102, fontBold, 19, 700);
    if (item.signerPosition2) {
      drawCenteredText(page, item.signerPosition2, 82, fontBold, 19, 700);
    }
    if (item.signerPosition3) {
      drawCenteredText(page, item.signerPosition3, 62, fontBold, 19, 700);
    }
  }

  return pdfDoc.save();
}

export function openPdfInNewTab(bytes: Uint8Array, filename = "certificate.pdf") {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }
}
