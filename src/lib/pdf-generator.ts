import jsPDF from "jspdf";
import QRCode from "qrcode";

const LOGO_URL = "/images/seven-trip-logo.png";
let cachedLogoBase64: string | null = null;

// Company info — single source of truth for all PDFs
const COMPANY = {
  name: "Seven Trip",
  parent: "Evan International",
  phone: "+880 1749-373748",
  email: "support@seven-trip.com",
  address: "Beena Kanon, Flat-4A, House-03, Road-17, Block-E, Banani, Dhaka-1213",
  addressShort: "Banani, Dhaka-1213",
  website: "www.seven-trip.com",
};

async function loadLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = LOGO_URL;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    cachedLogoBase64 = canvas.toDataURL("image/png");
    return cachedLogoBase64;
  } catch {
    return null;
  }
}

async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function addLogo(doc: jsPDF, logo: string | null, x: number, y: number, w: number, h: number) {
  if (!logo) return;
  try {
    doc.addImage(logo, "PNG", x, y, w, h);
  } catch { /* fallback */ }
}

async function generateQRDataUrl(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, { width: 120, margin: 1 });
  } catch {
    return null;
  }
}

/**
 * Draws the standard company header matching the reference PDF exactly:
 * - Purple decorative top stripe
 * - Large logo (~50mm wide)
 * - Company contact info below logo
 * - QR code in top-right corner
 */
function drawReferenceHeader(doc: jsPDF, logo: string | null, w: number, qr: string | null): number {
  // Purple decorative stripe at very top
  doc.setFillColor(120, 90, 220);
  doc.rect(0, 0, w, 4, "F");

  // Large logo
  if (logo) {
    addLogo(doc, logo, 20, 10, 50, 18);
  } else {
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 180, 160);
    doc.text("Seven Trip", 20, 24);
  }

  // QR code top-right
  if (qr) {
    try { doc.addImage(qr, "PNG", w - 42, 8, 22, 22); } catch { /* skip */ }
  }

  // Company contact info below logo
  let y = 32;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(`Call: ${COMPANY.phone}`, 20, y);
  y += 4;
  doc.text("Beena Kanon, Flat-4A, House-03,", 20, y);
  y += 4;
  doc.text("Road-17, Block-E, Banani, Dhaka-1213", 20, y);
  y += 8;

  return y;
}

function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Lakh", "Crore"];

  const num = Math.floor(Math.abs(n));
  if (num === 0) return "Zero";

  // Split into groups: last 3 digits, then pairs
  const groups: number[] = [];
  let remaining = num;
  groups.push(remaining % 1000);
  remaining = Math.floor(remaining / 1000);
  while (remaining > 0) {
    groups.push(remaining % 100);
    remaining = Math.floor(remaining / 100);
  }

  function groupToWords(g: number): string {
    if (g === 0) return "";
    if (g < 20) return ones[g];
    if (g < 100) return tens[Math.floor(g / 10)] + (g % 10 ? " " + ones[g % 10] : "");
    return ones[Math.floor(g / 100)] + " Hundred" + (g % 100 ? " " + groupToWords(g % 100) : "");
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) {
      parts.push(groupToWords(groups[i]) + (scales[i] ? " " + scales[i] : ""));
    }
  }
  return parts.join(" ") + " Taka Only";
}

/* ════════════════════════════════════════════════════════════════════
   MONEY RECEIPT PDF — Matches uploaded format
   ════════════════════════════════════════════════════════════════════ */

export interface MoneyReceiptData {
  receiptNo?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<{
    description: string;
    pax: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  due: number;
  discount: number;
  grandTotal: number;
  receivedBy?: string;
  date: string;
}

export async function generateMoneyReceiptPDF(data: MoneyReceiptData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const logo = await loadLogoBase64();
  const qrText = `SevenTrip Receipt | ${data.receiptNo || "N/A"} | ${data.customerName} | BDT ${data.grandTotal} | ${data.date}`;
  const qr = await generateQRDataUrl(qrText);

  let y = drawReferenceHeader(doc, logo, w, qr);

  // Title: "Money Receipt" — large bold text (NOT in a filled bar)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Money Receipt", 20, y);
  y += 10;

  // Receipt for section
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60);
  doc.text("Receipt for-", 20, y);
  y += 6;

  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName, 20, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  if (data.customerPhone) { doc.text(data.customerPhone, 20, y); y += 5; }
  if (data.customerAddress) { doc.text(data.customerAddress, 20, y); y += 5; }
  y += 6;

  // ── Table matching reference exactly ──
  const tableLeft = 20;
  const tableRight = w - 20;
  const tableW = tableRight - tableLeft;
  const colNo = tableLeft;
  const colDesc = tableLeft + 25;
  const colPax = tableLeft + tableW * 0.55;
  const colUnit = tableLeft + tableW * 0.68;
  const colTotal = tableRight;
  const rowH = 10;

  // Table header — light cyan/blue background
  doc.setFillColor(200, 235, 245);
  doc.rect(tableLeft, y, tableW, rowH, "F");
  doc.setDrawColor(180, 220, 235);
  doc.rect(tableLeft, y, tableW, rowH, "S");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text("No", colNo + 4, y + 7);
  doc.text("Description", colDesc, y + 7);
  doc.text("Pax", colPax, y + 7, { align: "center" });
  doc.text("Unit Price", colUnit + 10, y + 7, { align: "center" });
  doc.text("Total price", colTotal - 4, y + 7, { align: "right" });
  y += rowH;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0);

  const totalRows = Math.max(3, data.items.length);
  for (let i = 0; i < totalRows; i++) {
    // Alternate row background: white / very light gray
    if (i % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(tableLeft, y, tableW, rowH, "F");
    }
    doc.setDrawColor(220, 220, 220);
    doc.rect(tableLeft, y, tableW, rowH, "S");

    const item = data.items[i];
    doc.setTextColor(0);
    doc.text(String(i + 1).padStart(2, "0"), colNo + 4, y + 7);
    if (item) {
      doc.text(item.description, colDesc, y + 7, { maxWidth: colPax - colDesc - 5 });
      doc.text(String(item.pax), colPax, y + 7, { align: "center" });
      doc.text(`${item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, colUnit + 10, y + 7, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(`${item.totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, colTotal - 4, y + 7, { align: "right" });
      doc.setFont("helvetica", "normal");
    }
    y += rowH;
  }

  // ── Totals section — right-aligned with pink/lavender background ──
  y += 2;
  const totalsLabelX = colUnit - 10;
  const totalsValueX = colTotal - 4;
  const totalsRowH = 9;

  // Total Fair
  doc.setFillColor(235, 245, 235);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "F");
  doc.setDrawColor(220);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "S");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Total Fair", totalsValueX - 45, y + 6, { align: "right" });
  doc.text(`${data.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, totalsValueX, y + 6, { align: "right" });
  y += totalsRowH;

  // Due
  doc.setFillColor(240, 230, 245);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "F");
  doc.setDrawColor(220);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "S");
  doc.setFont("helvetica", "bold");
  doc.text("Due", totalsValueX - 45, y + 6, { align: "right" });
  doc.text(`${data.due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, totalsValueX, y + 6, { align: "right" });
  y += totalsRowH;

  // Adjustment/Discount
  doc.setFillColor(240, 230, 245);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "F");
  doc.setDrawColor(220);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "S");
  doc.setFont("helvetica", "bold");
  doc.text("Adjustment/Discount", totalsValueX - 45, y + 6, { align: "right" });
  doc.text(`${data.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, totalsValueX, y + 6, { align: "right" });
  y += totalsRowH;

  // Grand Total — pink background
  doc.setFillColor(235, 210, 230);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "F");
  doc.setDrawColor(220);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "S");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total", totalsValueX - 45, y + 6, { align: "right" });
  doc.text(`${data.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, totalsValueX, y + 6, { align: "right" });
  y += totalsRowH;

  // In Words
  y += 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.text("In Words-", 20, y + 5);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(numberToWords(data.grandTotal), 20, y + 5);
  y += 14;

  // Received with gratitude — mint green box
  doc.setFillColor(220, 245, 230);
  const gratitudeText = `Received with gratitude from ${data.customerName}, the amount of ${numberToWords(data.grandTotal)} (BDT ${data.grandTotal.toLocaleString()}/-) towards ${data.items.map(i => i.description).join(", ")}.`;
  const gratLines = doc.splitTextToSize(gratitudeText, w - 50);
  const gratH = gratLines.length * 5 + 8;
  doc.rect(20, y, w - 40, gratH, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30);
  doc.text(gratLines, 25, y + 6);
  y += gratH + 20;

  // Signature — right-aligned, no horizontal line
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  if (data.receivedBy) {
    doc.text(data.receivedBy, w - 30, y, { align: "right" });
    y += 5;
  }
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, w - 30, y, { align: "right" });
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Signature & Date", w - 30, y, { align: "right" });

  doc.save(`MoneyReceipt-${data.receiptNo || "receipt"}.pdf`);
}

export async function printMoneyReceiptPDF(data: MoneyReceiptData) {
  // Generate same as above but open for printing
  await generateMoneyReceiptPDF(data);
}

/* ════════════════════════════════════════════════════════════════════
   INVOICE PDF — Matches uploaded format with QR
   ════════════════════════════════════════════════════════════════════ */

export interface InvoiceLineItem {
  name: string;
  description?: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  extra?: Record<string, string | number>;
}

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  bookingRef: string;
  subtotal: number;
  tax: number;
  discount: number;
  amount: number;
  status: string;
  serviceType?: string;
  lineItems?: InvoiceLineItem[];
}

async function buildInvoiceDoc(inv: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const logo = await loadLogoBase64();
  const qrText = `SevenTrip Invoice | ${inv.invoiceNo} | ${inv.customerName} | BDT ${inv.amount} | ${inv.date}`;
  const qr = await generateQRDataUrl(qrText);

  let y = drawReferenceHeader(doc, logo, w, qr);

  // Title: "Invoice" — large bold text (NOT in a filled bar)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Invoice", 20, y);
  y += 10;

  // Invoice for (left) + Invoice details (right)
  doc.setTextColor(60);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice for", 20, y);
  doc.text("Invoice Details", w - 70, y);
  y += 6;

  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(inv.customerName, 20, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`# ${inv.invoiceNo}`, w - 70, y);
  y += 5;

  doc.setTextColor(80);
  doc.setFontSize(8);
  if (inv.customerPhone) { doc.text(inv.customerPhone, 20, y); }
  doc.text(`Submitted on ${inv.date}`, w - 70, y);
  y += 5;
  if (inv.customerEmail) { doc.text(inv.customerEmail, 20, y); y += 5; }
  if (inv.customerAddress) { doc.text(inv.customerAddress, 20, y); y += 5; }
  y += 6;

  // Build effective line items
  const effectiveItems: InvoiceLineItem[] = (inv.lineItems && inv.lineItems.length > 0)
    ? inv.lineItems
    : [{
        name: inv.serviceType
          ? `${inv.serviceType.charAt(0).toUpperCase() + inv.serviceType.slice(1)} Booking`
          : "Service",
        description: inv.bookingRef ? `Ref: ${inv.bookingRef}` : undefined,
        quantity: 1,
        unitPrice: inv.subtotal || inv.amount || 0,
        totalPrice: inv.subtotal || inv.amount || 0,
      }];

  const extraKeys = effectiveItems[0]?.extra ? Object.keys(effectiveItems[0].extra) : [];

  // ── Table matching reference exactly ──
  const tableLeft = 20;
  const tableRight = w - 20;
  const tableW = tableRight - tableLeft;
  const rowH = 10;

  // Table header — light cyan/blue background
  doc.setFillColor(200, 235, 245);
  doc.rect(tableLeft, y, tableW, rowH, "F");
  doc.setDrawColor(180, 220, 235);
  doc.rect(tableLeft, y, tableW, rowH, "S");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);

  let hx = tableLeft + 4;
  doc.text("No", hx, y + 7); hx += 15;
  doc.text("Name", hx, y + 7); hx += 55;
  extraKeys.forEach(k => {
    doc.text(k, hx, y + 7); hx += 25;
  });
  if (effectiveItems[0]?.quantity !== undefined) {
    doc.text("Qty", tableRight - 65, y + 7, { align: "center" });
  }
  doc.text("Unit Price", tableRight - 38, y + 7, { align: "center" });
  doc.text("Total Price", tableRight - 4, y + 7, { align: "right" });
  y += rowH;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0);

  const totalRows = Math.max(3, effectiveItems.length);
  for (let i = 0; i < totalRows; i++) {
    if (y > 260) {
      doc.addPage();
      y = 20;
      // Repeat header
      doc.setFillColor(200, 235, 245);
      doc.rect(tableLeft, y, tableW, rowH, "F");
      doc.setDrawColor(180, 220, 235);
      doc.rect(tableLeft, y, tableW, rowH, "S");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30);
      let rhx = tableLeft + 4;
      doc.text("No", rhx, y + 7); rhx += 15;
      doc.text("Name", rhx, y + 7); rhx += 55;
      extraKeys.forEach(k => { doc.text(k, rhx, y + 7); rhx += 25; });
      doc.text("Total Price", tableRight - 4, y + 7, { align: "right" });
      y += rowH;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0);
    }

    // Alternate row background
    if (i % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(tableLeft, y, tableW, rowH, "F");
    }
    doc.setDrawColor(220, 220, 220);
    doc.rect(tableLeft, y, tableW, rowH, "S");

    const item = effectiveItems[i];
    doc.setTextColor(0);
    doc.text(String(i + 1).padStart(2, "0"), tableLeft + 4, y + 7);
    if (item) {
      doc.text(item.name.substring(0, 32), tableLeft + 19, y + 7);
      let exX = tableLeft + 74;
      extraKeys.forEach(k => {
        const val = item.extra?.[k];
        doc.text(String(val ?? ""), exX, y + 7); exX += 25;
      });
      if (item.quantity !== undefined) {
        doc.text(String(item.quantity), tableRight - 65, y + 7, { align: "center" });
      }
      doc.text(`${item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, tableRight - 38, y + 7, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(`${item.totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, tableRight - 4, y + 7, { align: "right" });
      doc.setFont("helvetica", "normal");
    }
    y += rowH;
  }

  // ── Totals — matching reference with colored backgrounds ──
  y += 2;
  const totalsLabelX = tableRight - 85;
  const totalsValueX = tableRight - 4;
  const totalsRowH = 9;

  // Subtotal
  doc.setFillColor(235, 245, 235);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "F");
  doc.setDrawColor(220);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "S");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Subtotal", totalsValueX - 45, y + 6, { align: "right" });
  doc.text(`${(inv.subtotal || inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, totalsValueX, y + 6, { align: "right" });
  y += totalsRowH;

  // Tax (if applicable)
  if (inv.tax > 0) {
    doc.setFillColor(240, 230, 245);
    doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "F");
    doc.setDrawColor(220);
    doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "S");
    doc.text("Tax", totalsValueX - 45, y + 6, { align: "right" });
    doc.text(`${inv.tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, totalsValueX, y + 6, { align: "right" });
    y += totalsRowH;
  }

  // Discount (if applicable)
  if (inv.discount > 0) {
    doc.setFillColor(240, 230, 245);
    doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "F");
    doc.setDrawColor(220);
    doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "S");
    doc.setTextColor(0, 130, 0);
    doc.text("Discount", totalsValueX - 45, y + 6, { align: "right" });
    doc.text(`-${inv.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, totalsValueX, y + 6, { align: "right" });
    doc.setTextColor(0);
    y += totalsRowH;
  }

  // Grand Total — pink background
  doc.setFillColor(235, 210, 230);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "F");
  doc.setDrawColor(220);
  doc.rect(totalsLabelX - 5, y, tableRight - totalsLabelX + 5, totalsRowH, "S");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Grand Total", totalsValueX - 45, y + 6, { align: "right" });
  doc.text(`${inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}৳`, totalsValueX, y + 6, { align: "right" });
  y += totalsRowH;

  // In words
  y += 4;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.text("In Words-", 20, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(numberToWords(inv.amount), 20, y);
  y += 12;

  // Footer
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130);
  doc.text(`Thank you for choosing ${COMPANY.name}. For queries, contact ${COMPANY.email}`, w / 2, y, { align: "center" });
  y += 4;
  doc.text("This is a computer-generated invoice and does not require a signature.", w / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(6);
  doc.text(`${COMPANY.name} — A concern of ${COMPANY.parent} | ${COMPANY.website} | ${COMPANY.phone}`, w / 2, y, { align: "center" });

  return doc;
}

export async function generateInvoicePDF(inv: InvoiceData) {
  const doc = await buildInvoiceDoc(inv);
  doc.save(`${inv.invoiceNo}.pdf`);
}

export async function printInvoicePDF(inv: InvoiceData) {
  const doc = await buildInvoiceDoc(inv);
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => { printWindow.print(); };
  }
}

/* ════════════════════════════════════════════════════════════════════
   ENTERPRISE E-TICKET / TRAVEL ITINERARY PDF
   Matches the reference PDF layout exactly
   ════════════════════════════════════════════════════════════════════ */

interface FlightSegment {
  airline: string;
  airlineCode?: string;
  flightNumber: string;
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  departureTime: string;
  arrivalTime: string;
  duration?: string;
  cabinClass?: string;
  aircraft?: string;
  terminal?: string;
  arrivalTerminal?: string;
  stops?: number;
  baggage?: string;
  status?: string;
  meal?: string;
  distance?: number;
  emission?: string;
}

interface PassengerInfo {
  title?: string;
  firstName: string;
  lastName: string;
  passport?: string;
  seat?: string;
  ticketNumber?: string;
}

interface TicketData {
  id?: string;
  airline?: string;
  flightNo?: string;
  from?: string;
  to?: string;
  date?: string;
  time?: string;
  passenger?: string;
  pnr?: string;
  seat?: string;
  class?: string;
  bookingRef?: string;
  airlineReservationCode?: string;
  isRoundTrip?: boolean;
  outbound?: FlightSegment[];
  returnSegments?: FlightSegment[];
  passengers?: PassengerInfo[];
  meal?: string;
  extraBaggage?: string[];
  totalFare?: number;
  currency?: string;
}


/** Parse time from ISO or other formats, return HH:mm */
function safeTime(dt?: string): string {
  if (!dt) return "--:--";
  try {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
  } catch { /* fall through */ }
  const m = dt.match(/(\d{1,2}:\d{2})/);
  if (m) return m[1];
  return "--:--";
}

function safeDateLong(dt?: string): string {
  if (!dt) return "";
  try {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short" }).toUpperCase();
    }
  } catch { /* fall through */ }
  return dt;
}

function safeDateShort(dt?: string): string {
  if (!dt) return "";
  try {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    }
  } catch { /* fall through */ }
  return dt;
}




function drawBox(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h);
}

function drawFilledBox(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, g: number, b: number) {
  doc.setFillColor(r, g, b);
  doc.rect(x, y, w, h, "F");
}

async function drawFlightSegment(
  doc: jsPDF,
  seg: FlightSegment,
  y: number,
  pageW: number,
  airlineLogo: string | null,
  direction: string,
): Promise<number> {
  const lm = 15;
  const boxW = pageW - 30;

  // ── Orange departure header bar ──
  drawFilledBox(doc, lm, y, boxW, 8, 200, 120, 20);
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`DEPARTURE: ${direction.toUpperCase()}`, lm + 4, y + 5.5);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("Please verify flight times prior to departure", lm + 90, y + 5.5);
  y += 10;

  // ── Segment content box ──
  const segBoxH = 62;
  drawBox(doc, lm, y, boxW, segBoxH);

  // Column widths
  const col1W = 42;
  const col2W = 42;
  const col3W = 42;
  // col4 takes remainder

  const col2X = lm + col1W;
  const col3X = col2X + col2W;
  const col4X = col3X + col3W;

  // Vertical dividers
  doc.setDrawColor(200);
  doc.line(col2X, y + 1, col2X, y + segBoxH - 1);
  doc.line(col3X, y + 1, col3X, y + segBoxH - 1);
  doc.line(col4X, y + 1, col4X, y + segBoxH - 1);

  // ── COL 1: Airline info ──
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  let logoOffsetY = 0;
  if (airlineLogo) {
    try { doc.addImage(airlineLogo, "PNG", lm + 3, y + 3, 12, 12); logoOffsetY = 0; } catch { /* skip */ }
  }

  doc.text(seg.airline.toUpperCase(), lm + (airlineLogo ? 17 : 4), y + 9);
  doc.setFontSize(11);
  doc.text(seg.flightNumber, lm + 4, y + 19);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  let infoY = y + 26;
  doc.text("Duration:", lm + 4, infoY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(seg.duration || "--", lm + 4, infoY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  infoY += 12;
  doc.text("Cabin:", lm + 4, infoY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(seg.cabinClass || "Economy", lm + 4, infoY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  infoY += 12;
  doc.text("Status:", lm + 4, infoY);
  doc.setTextColor(0, 130, 0);
  doc.setFont("helvetica", "bold");
  doc.text(seg.status || "Confirmed", lm + 4, infoY + 5);
  doc.setTextColor(80);
  doc.setFont("helvetica", "normal");

  // ── COL 2: Origin ──
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(seg.origin, col2X + 4, y + 12);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  const originCityText = seg.originCity?.toUpperCase() || "";
  if (originCityText) {
    const cityLines = doc.splitTextToSize(originCityText, col2W - 8);
    doc.text(cityLines, col2X + 4, y + 17);
  }

  // Arrow
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(">", col2X + col2W - 8, y + 12);

  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.setFont("helvetica", "normal");
  doc.text("Departing At:", col2X + 4, y + 28);
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(safeTime(seg.departureTime), col2X + 4, y + 37);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  if (seg.terminal) {
    doc.text("Terminal:", col2X + 4, y + 44);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(seg.terminal.toUpperCase(), col2X + 4, y + 49);
  }

  // ── COL 3: Destination ──
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(seg.destination, col3X + 4, y + 12);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  const destCityText = seg.destinationCity?.toUpperCase() || "";
  if (destCityText) {
    const destLines = doc.splitTextToSize(destCityText, col3W - 8);
    doc.text(destLines, col3X + 4, y + 17);
  }

  doc.setFontSize(7);
  doc.text("Arriving At:", col3X + 4, y + 28);
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(safeTime(seg.arrivalTime), col3X + 4, y + 37);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  if (seg.arrivalTerminal) {
    doc.text("Terminal:", col3X + 4, y + 44);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(seg.arrivalTerminal.toUpperCase(), col3X + 4, y + 49);
  }

  // ── COL 4: Details (Aircraft, Distance, Meals, Baggage, Emission) ──
  const col4InnerW = boxW - (col4X - lm);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  let detY = y + 6;

  // Aircraft
  doc.text("Aircraft:", col4X + 3, detY);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(seg.aircraft || "--", col4X + 3, detY + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  detY += 10;

  // Distance
  if (seg.distance) {
    doc.text("Distance (in", col4X + 3, detY);
    doc.text("Miles):", col4X + 3, detY + 4);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(String(seg.distance), col4X + col4InnerW - 5, detY + 2, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    detY += 9;
  }

  // Meals
  doc.text("Meals:", col4X + 3, detY);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(seg.meal || "Meals", col4X + 3, detY + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  detY += 9;

  // Baggage
  doc.text("Baggage:", col4X + 3, detY);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(seg.baggage || "20Kg", col4X + 3, detY + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  detY += 9;

  // Emission
  if (seg.emission) {
    doc.text("Est. emission:", col4X + 3, detY);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(seg.emission, col4X + 3, detY + 4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
  }

  y += segBoxH + 2;
  return y;
}

export async function generateTicketPDF(ticket: TicketData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const logo = await loadLogoBase64();
  const lm = 15;

  const outboundSegments: FlightSegment[] = ticket.outbound || [];
  const returnSegments: FlightSegment[] = ticket.returnSegments || [];

  if (outboundSegments.length === 0 && ticket.from) {
    outboundSegments.push({
      airline: ticket.airline || "Seven Trip",
      airlineCode: (ticket as any).airlineCode || "",
      flightNumber: ticket.flightNo || "",
      origin: ticket.from || "",
      destination: ticket.to || "",
      departureTime: ticket.time || ticket.date || "",
      arrivalTime: "",
      duration: "",
      cabinClass: ticket.class || "Economy",
      baggage: "20kg",
      status: "Confirmed",
    });
  }

  const passengers: PassengerInfo[] = ticket.passengers || [
    { firstName: ticket.passenger || "Traveller", lastName: "", seat: ticket.seat, ticketNumber: ticket.id },
  ];

  const bookingRef = ticket.bookingRef || ticket.pnr || ticket.id || "";
  const departDate = ticket.date || (outboundSegments[0]?.departureTime ? new Date(outboundSegments[0].departureTime).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "");
  const destCity = outboundSegments[outboundSegments.length - 1]?.destinationCity || outboundSegments[outboundSegments.length - 1]?.destination || ticket.to || "";

  // HEADER BAR
  drawFilledBox(doc, 0, 0, w, 22, 30, 30, 30);
  if (logo) {
    // Preserve aspect ratio: measure natural size, fit within 40×16 box
    try {
      const imgProps = doc.getImageProperties(logo);
      const maxW = 40, maxH = 16;
      const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height);
      const logoW = imgProps.width * ratio;
      const logoH = imgProps.height * ratio;
      const logoY = (22 - logoH) / 2; // vertically center in header
      doc.addImage(logo, "PNG", lm, logoY, logoW, logoH);
    } catch { /* skip */ }
  } else {
    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, lm, 14);
  }

  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`${departDate}  >  TRIP TO ${destCity.toUpperCase()}`, lm + (logo ? 45 : 52), 9);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY.parent} | ${COMPANY.website} | ${COMPANY.phone}`, lm + (logo ? 45 : 52), 16);

  let y = 28;

  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.text("PREPARED FOR", lm, y);
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  y += 6;
  passengers.forEach((p) => {
    doc.text(`${p.lastName ? `${p.lastName.toUpperCase()}/${p.firstName.toUpperCase()}` : p.firstName.toUpperCase()} ${p.title?.toUpperCase() || ""}`.trim(), lm, y);
    y += 6;
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("RESERVATION CODE", w - 60, 28);
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(bookingRef, w - 60, 35);

  if (ticket.airlineReservationCode) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("AIRLINE RESERVATION CODE", w - 60, 41);
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(ticket.airlineReservationCode, w - 60, 47);
  }

  y += 4;
  doc.setDrawColor(180);
  doc.line(lm, y, w - lm, y);
  y += 6;

  const firstCode = outboundSegments[0]?.airlineCode || "";
  let airlineLogo: string | null = null;
  if (firstCode) {
    airlineLogo = await loadImageBase64(`https://images.kiwi.com/airlines/64/${firstCode}.png`);
  }

  const outDate = outboundSegments[0]?.departureTime
    ? new Date(outboundSegments[0].departureTime).toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short" }).toUpperCase()
    : departDate.toUpperCase();

  for (const seg of outboundSegments) {
    y = await drawFlightSegment(doc, seg, y, w, airlineLogo, outDate);

    drawFilledBox(doc, lm, y, w - 30, 6, 230, 230, 230);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60);
    doc.text("Passenger Name:", lm + 3, y + 4);
    doc.text("Seats:", w - 50, y + 4);
    y += 7;

    passengers.forEach((p) => {
      doc.setTextColor(0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const name = `» ${p.lastName ? `${p.lastName.toUpperCase()}/${p.firstName.toUpperCase()}` : p.firstName.toUpperCase()} ${p.title?.toUpperCase() || ""}`.trim();
      doc.text(name, lm + 3, y + 3);
      doc.text(p.seat || "Check-In Required", w - 50, y + 3);
      y += 6;
    });

    y += 4;
  }

  if (returnSegments.length > 0) {
    const retDate = returnSegments[0]?.departureTime
      ? new Date(returnSegments[0].departureTime).toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short" }).toUpperCase()
      : "";

    const retCode = returnSegments[0]?.airlineCode || firstCode;
    let retLogo = airlineLogo;
    if (retCode && retCode !== firstCode) {
      retLogo = await loadImageBase64(`https://images.kiwi.com/airlines/64/${retCode}.png`);
    }

    for (const seg of returnSegments) {
      if (y > 240) { doc.addPage(); y = 15; }

      y = await drawFlightSegment(doc, seg, y, w, retLogo, retDate);

      drawFilledBox(doc, lm, y, w - 30, 6, 230, 230, 230);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60);
      doc.text("Passenger Name:", lm + 3, y + 4);
      doc.text("Seats:", w - 50, y + 4);
      y += 7;

      passengers.forEach((p) => {
        doc.setTextColor(0);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const name = `» ${p.lastName ? `${p.lastName.toUpperCase()}/${p.firstName.toUpperCase()}` : p.firstName.toUpperCase()} ${p.title?.toUpperCase() || ""}`.trim();
        doc.text(name, lm + 3, y + 3);
        doc.text(p.seat || "Check-In Required", w - 50, y + 3);
        y += 6;
      });

      y += 4;
    }
  }

  // FOOTER
  if (y > 260) { doc.addPage(); y = 15; }
  y += 4;
  drawFilledBox(doc, lm, y, w - 30, 18, 240, 240, 240);
  doc.setTextColor(60);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TRAVEL CONSULTANT", lm + 4, y + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY.parent} (${COMPANY.name})`, lm + 4, y + 11);
  doc.text(`${COMPANY.email} | ${COMPANY.phone}`, lm + 4, y + 15);

  doc.setTextColor(100);
  doc.setFontSize(6);
  doc.text("This is a computer-generated travel itinerary. Please arrive at the airport at least 2 hours before departure for domestic and 3 hours for international flights.", w / 2, y + 24, { align: "center" });
  doc.text(`Powered by ${COMPANY.name} — ${COMPANY.website}`, w / 2, y + 28, { align: "center" });

  doc.save(`E-Ticket-${bookingRef}.pdf`);
}

export async function printTicketPDF(ticket: TicketData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const logo = await loadLogoBase64();
  const lm = 15;

  const outboundSegments: FlightSegment[] = ticket.outbound || [];
  const returnSegments: FlightSegment[] = ticket.returnSegments || [];

  if (outboundSegments.length === 0 && ticket.from) {
    outboundSegments.push({
      airline: ticket.airline || "Seven Trip",
      airlineCode: (ticket as any).airlineCode || "",
      flightNumber: ticket.flightNo || "",
      origin: ticket.from || "",
      destination: ticket.to || "",
      departureTime: ticket.time || ticket.date || "",
      arrivalTime: "",
      cabinClass: ticket.class || "Economy",
      baggage: "20kg",
      status: "Confirmed",
    });
  }

  const passengers: PassengerInfo[] = ticket.passengers || [
    { firstName: ticket.passenger || "Traveller", lastName: "", seat: ticket.seat },
  ];

  const bookingRef = ticket.bookingRef || ticket.pnr || ticket.id || "";

  drawFilledBox(doc, 0, 0, w, 22, 30, 30, 30);
  if (logo) {
    try { doc.addImage(logo, "PNG", lm, 3, 40, 10); } catch { /* */ }
  }
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TRAVEL ITINERARY", w - lm, 12, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY.parent} (${COMPANY.name})`, w - lm, 18, { align: "right" });

  let y = 30;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  passengers.forEach((p) => {
    doc.text(`${p.lastName ? `${p.lastName.toUpperCase()}/${p.firstName.toUpperCase()}` : p.firstName.toUpperCase()}`, lm, y);
    y += 6;
  });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Reservation: ${bookingRef}`, lm, y);
  y += 8;

  const firstCode = outboundSegments[0]?.airlineCode || "";
  let airlineLogo: string | null = null;
  if (firstCode) {
    airlineLogo = await loadImageBase64(`https://images.kiwi.com/airlines/64/${firstCode}.png`);
  }

  for (const seg of outboundSegments) {
    y = await drawFlightSegment(doc, seg, y, w, airlineLogo, "OUTBOUND");
    y += 2;
  }

  for (const seg of returnSegments) {
    if (y > 240) { doc.addPage(); y = 15; }
    const retCode = seg.airlineCode || firstCode;
    let retLogo = airlineLogo;
    if (retCode !== firstCode) {
      retLogo = await loadImageBase64(`https://images.kiwi.com/airlines/64/${retCode}.png`);
    }
    y = await drawFlightSegment(doc, seg, y, w, retLogo, "RETURN");
    y += 2;
  }

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => { printWindow.print(); };
  }
}
