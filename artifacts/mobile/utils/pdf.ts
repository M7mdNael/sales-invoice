import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { SalesInvoice, ReturnInvoice } from "@/context/AppContext";

export type PdfLang = "en" | "ar";

function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} JOD`;
}

function formatDate(dateStr: string, lang: PdfLang): string {
  const d = new Date(dateStr);
  if (lang === "ar") {
    return d.toLocaleDateString("ar-JO", { day: "2-digit", month: "long", year: "numeric" });
  }
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

const L = {
  en: {
    salesInvoice: "Sales Invoice",
    returnInvoice: "Return Invoice",
    invoice: "Invoice",
    return: "Return",
    company: "Company",
    customer: "Customer",
    invoiceDate: "Invoice Date",
    returnDate: "Return Date",
    currency: "Currency",
    originalInvoice: "Original Invoice",
    product: "Product",
    qty: "Qty",
    qtyReturned: "Qty Returned",
    unitPrice: "Unit Price",
    total: "Total",
    grandTotal: "Grand Total",
    totalRefund: "Total Refund",
    refund: "Refund",
    thankyou: "Thank you for your business",
    returnProcessed: "Return processed",
    jordanianDinar: "Jordanian Dinar (JOD)",
  },
  ar: {
    salesInvoice: "فاتورة مبيعات",
    returnInvoice: "فاتورة مرتجع",
    invoice: "فاتورة",
    return: "مرتجع",
    company: "الشركة",
    customer: "العميل",
    invoiceDate: "تاريخ الفاتورة",
    returnDate: "تاريخ المرتجع",
    currency: "العملة",
    originalInvoice: "الفاتورة الأصلية",
    product: "المنتج",
    qty: "الكمية",
    qtyReturned: "الكمية المرتجعة",
    unitPrice: "سعر الوحدة",
    total: "المجموع",
    grandTotal: "المجموع الكلي",
    totalRefund: "إجمالي الاسترداد",
    refund: "الاسترداد",
    thankyou: "شكراً لتعاملكم معنا",
    returnProcessed: "تمت معالجة المرتجع",
    jordanianDinar: "دينار أردني (JOD)",
  },
} as const;

function buildSalesHtml(invoice: SalesInvoice, lang: PdfLang): string {
  const l = L[lang];
  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const color = "#1A73E8";
  const bgLight = "#F8FAFC";
  const font = isRTL
    ? "'Cairo', 'Amiri', 'Noto Naskh Arabic', Arial, sans-serif"
    : "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const fontImport = isRTL
    ? `<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">`
    : "";
  const alignStart = isRTL ? "right" : "left";
  const alignEnd = isRTL ? "left" : "right";
  const borderSide = isRTL ? "border-right" : "border-left";
  const totalJustify = isRTL ? "flex-start" : "flex-end";

  const companySection = invoice.companyName
    ? `<div class="info-item"><label>${l.company}</label><p>${invoice.companyName}</p></div>`
    : "";

  const itemRows = invoice.items
    .map((item) => `
    <tr>
      <td>${item.productName}</td>
      <td class="num">${item.quantity}</td>
      <td class="num">${formatCurrency(item.price)}</td>
      <td class="num">${formatCurrency(item.price * item.quantity)}</td>
    </tr>`)
    .join("");

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="utf-8"/>
  ${fontImport}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${font}; color: #111; padding: 40px; background: #fff; direction: ${dir}; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid ${color}; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .brand-name { font-size: 13px; font-weight: 700; color: ${color}; letter-spacing: ${isRTL ? "0" : "1px"}; }
    .invoice-type { font-size: 28px; font-weight: 700; color: #111; }
    .invoice-meta { text-align: ${alignEnd}; }
    .invoice-number { font-size: 20px; font-weight: 700; color: ${color}; }
    .invoice-date { font-size: 14px; color: #666; margin-top: 4px; }
    .info-grid { display: flex; gap: 24px; margin-bottom: 32px; background: ${bgLight}; padding: 20px 24px; border-radius: 12px; ${borderSide}: 4px solid ${color}; }
    .info-item { flex: 1; }
    .info-item label { font-size: 11px; color: #888; letter-spacing: 0.8px; font-weight: 600; display: block; margin-bottom: 4px; }
    .info-item p { font-size: 15px; font-weight: 600; color: #111; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    .table-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; margin-bottom: 24px; }
    thead tr { background: ${color}; }
    thead th { padding: 13px 16px; text-align: ${alignStart}; font-size: 12px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }
    thead th.num { text-align: ${alignEnd}; }
    tbody tr:nth-child(even) { background: ${bgLight}; }
    tbody tr:nth-child(odd) { background: #fff; }
    tbody td { padding: 12px 16px; font-size: 14px; color: #333; border-bottom: 1px solid #F3F4F6; text-align: ${alignStart}; }
    tbody td.num { text-align: ${alignEnd}; }
    .total-section { display: flex; justify-content: ${totalJustify}; margin-bottom: 32px; }
    .total-box { background: ${color}; color: white; padding: 16px 24px; border-radius: 12px; display: flex; gap: 40px; align-items: center; }
    .total-label { font-size: 13px; font-weight: 600; opacity: 0.85; }
    .total-value { font-size: 22px; font-weight: 700; }
    .footer { text-align: center; font-size: 13px; color: #999; padding-top: 24px; border-top: 1px solid #E5E7EB; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-name">${l.salesInvoice}</div>
      <div class="invoice-type">${invoice.companyName || l.invoice}</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">${invoice.invoiceNumber}</div>
      <div class="invoice-date">${formatDate(invoice.date, lang)}</div>
    </div>
  </div>

  <div class="info-grid">
    ${companySection}
    <div class="info-item">
      <label>${l.customer}</label>
      <p>${invoice.customerName || "—"}</p>
    </div>
    <div class="info-item">
      <label>${l.invoiceDate}</label>
      <p>${formatDate(invoice.date, lang)}</p>
    </div>
    <div class="info-item">
      <label>${l.currency}</label>
      <p>${l.jordanianDinar}</p>
    </div>
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>${l.product}</th>
          <th class="num">${l.qty}</th>
          <th class="num">${l.unitPrice}</th>
          <th class="num">${l.total}</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-box">
      <div class="total-label">${l.grandTotal}</div>
      <div class="total-value">${formatCurrency(invoice.total)}</div>
    </div>
  </div>

  <div class="footer">${l.thankyou} &bull; ${invoice.invoiceNumber}</div>
</body>
</html>`;
}

function buildReturnHtml(invoice: ReturnInvoice, lang: PdfLang): string {
  const l = L[lang];
  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const color = "#EA4335";
  const bgLight = "#FFF9F9";
  const font = isRTL
    ? "'Cairo', 'Amiri', 'Noto Naskh Arabic', Arial, sans-serif"
    : "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const fontImport = isRTL
    ? `<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">`
    : "";
  const alignStart = isRTL ? "right" : "left";
  const alignEnd = isRTL ? "left" : "right";
  const borderSide = isRTL ? "border-right" : "border-left";
  const totalJustify = isRTL ? "flex-start" : "flex-end";

  const companySection = invoice.companyName
    ? `<div class="info-item"><label>${l.company}</label><p>${invoice.companyName}</p></div>`
    : "";

  const originalInvSection = invoice.originalInvoiceNumber
    ? `<div class="info-item"><label>${l.originalInvoice}</label><p>${invoice.originalInvoiceNumber}</p></div>`
    : "";

  const itemRows = invoice.items
    .map((item) => `
    <tr>
      <td>${item.productName}</td>
      <td class="num">${item.quantity}</td>
      <td class="num">${formatCurrency(item.price)}</td>
      <td class="num">${formatCurrency(item.price * item.quantity)}</td>
    </tr>`)
    .join("");

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="utf-8"/>
  ${fontImport}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${font}; color: #111; padding: 40px; background: #fff; direction: ${dir}; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid ${color}; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .brand-name { font-size: 13px; font-weight: 700; color: ${color}; letter-spacing: ${isRTL ? "0" : "1px"}; }
    .invoice-type { font-size: 28px; font-weight: 700; color: #111; }
    .invoice-meta { text-align: ${alignEnd}; }
    .invoice-number { font-size: 20px; font-weight: 700; color: ${color}; }
    .invoice-date { font-size: 14px; color: #666; margin-top: 4px; }
    .info-grid { display: flex; gap: 24px; margin-bottom: 32px; background: ${bgLight}; padding: 20px 24px; border-radius: 12px; ${borderSide}: 4px solid ${color}; }
    .info-item { flex: 1; }
    .info-item label { font-size: 11px; color: #888; letter-spacing: 0.8px; font-weight: 600; display: block; margin-bottom: 4px; }
    .info-item p { font-size: 15px; font-weight: 600; color: #111; }
    table { width: 100%; border-collapse: collapse; }
    .table-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; margin-bottom: 24px; }
    thead tr { background: ${color}; }
    thead th { padding: 13px 16px; text-align: ${alignStart}; font-size: 12px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }
    thead th.num { text-align: ${alignEnd}; }
    tbody tr:nth-child(even) { background: ${bgLight}; }
    tbody tr:nth-child(odd) { background: #fff; }
    tbody td { padding: 12px 16px; font-size: 14px; color: #333; border-bottom: 1px solid #F3F4F6; text-align: ${alignStart}; }
    tbody td.num { text-align: ${alignEnd}; }
    .total-section { display: flex; justify-content: ${totalJustify}; margin-bottom: 32px; }
    .total-box { background: ${color}; color: white; padding: 16px 24px; border-radius: 12px; display: flex; gap: 40px; align-items: center; }
    .total-label { font-size: 13px; font-weight: 600; opacity: 0.85; }
    .total-value { font-size: 22px; font-weight: 700; }
    .footer { text-align: center; font-size: 13px; color: #999; padding-top: 24px; border-top: 1px solid #E5E7EB; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-name">${l.returnInvoice}</div>
      <div class="invoice-type">${invoice.companyName || l.return}</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">${invoice.returnNumber}</div>
      <div class="invoice-date">${formatDate(invoice.date, lang)}</div>
    </div>
  </div>

  <div class="info-grid">
    ${companySection}
    <div class="info-item">
      <label>${l.customer}</label>
      <p>${invoice.customerName || "—"}</p>
    </div>
    ${originalInvSection}
    <div class="info-item">
      <label>${l.returnDate}</label>
      <p>${formatDate(invoice.date, lang)}</p>
    </div>
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>${l.product}</th>
          <th class="num">${l.qtyReturned}</th>
          <th class="num">${l.unitPrice}</th>
          <th class="num">${l.refund}</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-box">
      <div class="total-label">${l.totalRefund}</div>
      <div class="total-value">${formatCurrency(invoice.total)}</div>
    </div>
  </div>

  <div class="footer">${l.returnProcessed} &bull; ${invoice.returnNumber} &bull; ${l.jordanianDinar}</div>
</body>
</html>`;
}

export async function generateAndShareSalesPDF(invoice: SalesInvoice, lang: PdfLang = "en"): Promise<void> {
  const html = buildSalesHtml(invoice, lang);
  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 400);
    }
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Invoice ${invoice.invoiceNumber}`,
      UTI: "com.adobe.pdf",
    });
  }
}

export async function generateAndShareReturnPDF(invoice: ReturnInvoice, lang: PdfLang = "en"): Promise<void> {
  const html = buildReturnHtml(invoice, lang);
  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 400);
    }
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Return ${invoice.returnNumber}`,
      UTI: "com.adobe.pdf",
    });
  }
}

export async function downloadSalesPDF(invoice: SalesInvoice, lang: PdfLang = "en"): Promise<void> {
  const html = buildSalesHtml(invoice, lang);
  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 400);
    }
    return;
  }
  await Print.printAsync({ html });
}

export async function downloadReturnPDF(invoice: ReturnInvoice, lang: PdfLang = "en"): Promise<void> {
  const html = buildReturnHtml(invoice, lang);
  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 400);
    }
    return;
  }
  await Print.printAsync({ html });
}
