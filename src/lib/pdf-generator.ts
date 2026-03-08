import jsPDF from "jspdf";

interface InvoiceData {
  invoiceNo: string;
  date: string;
  customerName: string;
  customerEmail: string;
  bookingRef: string;
  subtotal: number;
  tax: number;
  discount: number;
  amount: number;
  status: string;
  serviceType?: string;
}

export function generateInvoicePDF(inv: InvoiceData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Seven Trip", 20, 25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Seven Trip Bangladesh Ltd", 20, 32);
  doc.text("Dhaka, Bangladesh | support@seventrip.com", 20, 37);

  // Invoice info (right)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(inv.invoiceNo, w - 20, 25, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Date: ${inv.date}`, w - 20, 32, { align: "right" });
  doc.text(`Status: ${inv.status}`, w - 20, 37, { align: "right" });

  // Line
  doc.setDrawColor(200);
  doc.line(20, 44, w - 20, 44);

  // Bill To
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("BILL TO", 20, 54);
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(inv.customerName, 20, 61);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(inv.customerEmail, 20, 67);

  // Booking ref
  doc.setTextColor(100);
  doc.text("BOOKING REFERENCE", w / 2, 54);
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(inv.bookingRef, w / 2, 61);
  if (inv.serviceType) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(inv.serviceType.charAt(0).toUpperCase() + inv.serviceType.slice(1), w / 2, 67);
  }

  // Table header
  const tableY = 82;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, tableY - 5, w - 40, 10, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);
  doc.text("Description", 25, tableY + 1);
  doc.text("Amount", w - 25, tableY + 1, { align: "right" });

  // Table rows
  let y = tableY + 14;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.setFontSize(10);

  doc.text("Subtotal", 25, y);
  doc.text(`BDT ${inv.subtotal?.toLocaleString()}`, w - 25, y, { align: "right" });
  y += 10;

  if (inv.tax > 0) {
    doc.text("Tax (5%)", 25, y);
    doc.text(`BDT ${inv.tax?.toLocaleString()}`, w - 25, y, { align: "right" });
    y += 10;
  }

  if (inv.discount > 0) {
    doc.setTextColor(0, 150, 0);
    doc.text("Discount", 25, y);
    doc.text(`-BDT ${inv.discount?.toLocaleString()}`, w - 25, y, { align: "right" });
    doc.setTextColor(0);
    y += 10;
  }

  // Total line
  doc.setDrawColor(200);
  doc.line(20, y, w - 20, y);
  y += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Total", 25, y);
  doc.text(`BDT ${inv.amount?.toLocaleString()}`, w - 25, y, { align: "right" });

  // Footer
  y += 25;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text("Thank you for choosing Seven Trip. For queries, contact support@seventrip.com", w / 2, y, { align: "center" });
  doc.text("This is a computer-generated invoice and does not require a signature.", w / 2, y + 6, { align: "center" });

  doc.save(`${inv.invoiceNo}.pdf`);
}

export function printInvoicePDF(inv: InvoiceData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Seven Trip", 20, 25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Seven Trip Bangladesh Ltd", 20, 32);
  doc.text("Dhaka, Bangladesh | support@seventrip.com", 20, 37);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(inv.invoiceNo, w - 20, 25, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Date: ${inv.date}`, w - 20, 32, { align: "right" });
  doc.text(`Status: ${inv.status}`, w - 20, 37, { align: "right" });

  doc.setDrawColor(200);
  doc.line(20, 44, w - 20, 44);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("BILL TO", 20, 54);
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(inv.customerName, 20, 61);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(inv.customerEmail, 20, 67);

  doc.setTextColor(100);
  doc.text("BOOKING REFERENCE", w / 2, 54);
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(inv.bookingRef, w / 2, 61);

  const tableY = 82;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, tableY - 5, w - 40, 10, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);
  doc.text("Description", 25, tableY + 1);
  doc.text("Amount", w - 25, tableY + 1, { align: "right" });

  let y = tableY + 14;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text("Subtotal", 25, y);
  doc.text(`BDT ${inv.subtotal?.toLocaleString()}`, w - 25, y, { align: "right" });
  y += 10;
  if (inv.tax > 0) {
    doc.text("Tax (5%)", 25, y);
    doc.text(`BDT ${inv.tax?.toLocaleString()}`, w - 25, y, { align: "right" });
    y += 10;
  }
  if (inv.discount > 0) {
    doc.setTextColor(0, 150, 0);
    doc.text("Discount", 25, y);
    doc.text(`-BDT ${inv.discount?.toLocaleString()}`, w - 25, y, { align: "right" });
    doc.setTextColor(0);
    y += 10;
  }
  doc.setDrawColor(200);
  doc.line(20, y, w - 20, y);
  y += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Total", 25, y);
  doc.text(`BDT ${inv.amount?.toLocaleString()}`, w - 25, y, { align: "right" });

  y += 25;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text("Thank you for choosing Seven Trip.", w / 2, y, { align: "center" });

  // Open in new window for printing
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => { printWindow.print(); };
  }
}

export function printTicketPDF(ticket: TicketData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("E-Ticket", 20, 25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Seven Trip Bangladesh Ltd", 20, 32);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(ticket.id, w - 20, 25, { align: "right" });

  doc.setDrawColor(200);
  doc.line(20, 40, w - 20, 40);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${ticket.airline} — ${ticket.flightNo}`, 20, 52);
  doc.setFontSize(28);
  doc.text(ticket.from, 30, 72);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("→", w / 2, 70, { align: "center" });
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(ticket.to, w - 30, 72, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(ticket.time, 30, 80);
  doc.text(ticket.date, w / 2, 80, { align: "center" });
  doc.line(20, 88, w - 20, 88);

  const details = [
    ["Passenger", ticket.passenger], ["PNR", ticket.pnr],
    ["Seat", ticket.seat], ["Class", ticket.class],
    ["Date", ticket.date], ["Departure", ticket.time],
  ];
  let y = 100;
  doc.setFontSize(9);
  details.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? 25 : w / 2;
    doc.setTextColor(100);
    doc.text(label, x, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(value, x, y + 7);
    doc.setFont("helvetica", "normal");
    if (i % 2 === 1) y += 18;
  });

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => { printWindow.print(); };
  }
}

interface TicketData {
  id: string;
  airline: string;
  flightNo: string;
  from: string;
  to: string;
  date: string;
  time: string;
  passenger: string;
  pnr: string;
  seat: string;
  class: string;
}

export function generateTicketPDF(ticket: TicketData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("E-Ticket", 20, 25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Seven Trip Bangladesh Ltd", 20, 32);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(ticket.id, w - 20, 25, { align: "right" });

  doc.setDrawColor(200);
  doc.line(20, 40, w - 20, 40);

  // Flight info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(`${ticket.airline} — ${ticket.flightNo}`, 20, 52);

  doc.setFontSize(28);
  doc.text(ticket.from, 30, 72);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("→", w / 2, 70, { align: "center" });
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(ticket.to, w - 30, 72, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(ticket.time, 30, 80);
  doc.text(ticket.date, w / 2, 80, { align: "center" });

  doc.line(20, 88, w - 20, 88);

  // Details grid
  const details = [
    ["Passenger", ticket.passenger],
    ["PNR", ticket.pnr],
    ["Seat", ticket.seat],
    ["Class", ticket.class],
    ["Date", ticket.date],
    ["Departure", ticket.time],
  ];

  let y = 100;
  doc.setFontSize(9);
  details.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? 25 : w / 2;
    doc.setTextColor(100);
    doc.text(label, x, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(value, x, y + 7);
    doc.setFont("helvetica", "normal");
    if (i % 2 === 1) y += 18;
  });

  // Footer
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Please arrive at the airport at least 2 hours before departure.", w / 2, y, { align: "center" });
  doc.text("Powered by Seven Trip — www.seventrip.com", w / 2, y + 6, { align: "center" });

  doc.save(`E-Ticket-${ticket.pnr}.pdf`);
}
