import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { SalesInvoice, ReturnInvoice } from "@/context/AppContext";

function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} JOD`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function buildSalesHtml(invoice: SalesInvoice): string {
  const itemRows = invoice.items
    .map(
      (item) => `
    <tr>
      <td>${item.productName}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${formatCurrency(item.price)}</td>
      <td style="text-align:right">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `
    )
    .join("");

  const companySection = invoice.companyName
    ? `<div class="meta-item"><label>Company</label><p>${invoice.companyName}</p></div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 40px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #1A73E8; }
        .brand { display: flex; flex-direction: column; gap: 4px; }
        .brand-name { font-size: 13px; font-weight: 600; color: #1A73E8; text-transform: uppercase; letter-spacing: 1px; }
        .invoice-type { font-size: 28px; font-weight: 700; color: #111; }
        .invoice-meta { text-align: right; }
        .invoice-number { font-size: 20px; font-weight: 700; color: #1A73E8; }
        .invoice-date { font-size: 14px; color: #666; margin-top: 4px; }
        .info-grid { display: flex; gap: 24px; margin-bottom: 32px; background: #F8FAFC; padding: 20px 24px; border-radius: 12px; border-left: 4px solid #1A73E8; }
        .info-item { flex: 1; }
        .info-item label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; display: block; margin-bottom: 4px; }
        .info-item p { font-size: 15px; font-weight: 600; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        .table-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; margin-bottom: 24px; }
        thead tr { background: #1A73E8; }
        thead th { padding: 13px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
        thead th:not(:first-child) { text-align: right; }
        tbody tr:nth-child(even) { background: #F8FAFC; }
        tbody tr:nth-child(odd) { background: #fff; }
        tbody td { padding: 12px 16px; font-size: 14px; color: #333; border-bottom: 1px solid #F3F4F6; }
        .total-section { display: flex; justify-content: flex-end; margin-bottom: 32px; }
        .total-box { background: #1A73E8; color: white; padding: 16px 24px; border-radius: 12px; display: flex; gap: 40px; align-items: center; }
        .total-label { font-size: 13px; font-weight: 600; opacity: 0.85; }
        .total-value { font-size: 22px; font-weight: 700; }
        .footer { text-align: center; font-size: 13px; color: #999; padding-top: 24px; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <div class="brand-name">Sales Invoice</div>
          <div class="invoice-type">${invoice.companyName || "Invoice"}</div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-number">${invoice.invoiceNumber}</div>
          <div class="invoice-date">${formatDate(invoice.date)}</div>
        </div>
      </div>

      <div class="info-grid">
        ${companySection}
        <div class="info-item">
          <label>Customer</label>
          <p>${invoice.customerName || "—"}</p>
        </div>
        <div class="info-item">
          <label>Invoice Date</label>
          <p>${formatDate(invoice.date)}</p>
        </div>
        <div class="info-item">
          <label>Currency</label>
          <p>Jordanian Dinar (JOD)</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align:right">Qty</th>
              <th style="text-align:right">Unit Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <div class="total-box">
          <div class="total-label">Grand Total</div>
          <div class="total-value">${formatCurrency(invoice.total)}</div>
        </div>
      </div>

      <div class="footer">Thank you for your business &bull; ${invoice.invoiceNumber}</div>
    </body>
    </html>
  `;
}

function buildReturnHtml(invoice: ReturnInvoice): string {
  const itemRows = invoice.items
    .map(
      (item) => `
    <tr>
      <td>${item.productName}</td>
      <td style="text-align:right">${item.quantity}</td>
      <td style="text-align:right">${formatCurrency(item.price)}</td>
      <td style="text-align:right">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `
    )
    .join("");

  const companySection = invoice.companyName
    ? `<div class="info-item"><label>Company</label><p>${invoice.companyName}</p></div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 40px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #EA4335; }
        .brand { display: flex; flex-direction: column; gap: 4px; }
        .brand-name { font-size: 13px; font-weight: 600; color: #EA4335; text-transform: uppercase; letter-spacing: 1px; }
        .invoice-type { font-size: 28px; font-weight: 700; color: #111; }
        .invoice-meta { text-align: right; }
        .invoice-number { font-size: 20px; font-weight: 700; color: #EA4335; }
        .invoice-date { font-size: 14px; color: #666; margin-top: 4px; }
        .info-grid { display: flex; gap: 24px; margin-bottom: 32px; background: #FFF9F9; padding: 20px 24px; border-radius: 12px; border-left: 4px solid #EA4335; }
        .info-item { flex: 1; }
        .info-item label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; display: block; margin-bottom: 4px; }
        .info-item p { font-size: 15px; font-weight: 600; color: #111; }
        table { width: 100%; border-collapse: collapse; }
        .table-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; margin-bottom: 24px; }
        thead tr { background: #EA4335; }
        thead th { padding: 13px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
        thead th:not(:first-child) { text-align: right; }
        tbody tr:nth-child(even) { background: #FFF9F9; }
        tbody tr:nth-child(odd) { background: #fff; }
        tbody td { padding: 12px 16px; font-size: 14px; color: #333; border-bottom: 1px solid #F3F4F6; }
        .total-section { display: flex; justify-content: flex-end; margin-bottom: 32px; }
        .total-box { background: #EA4335; color: white; padding: 16px 24px; border-radius: 12px; display: flex; gap: 40px; align-items: center; }
        .total-label { font-size: 13px; font-weight: 600; opacity: 0.85; }
        .total-value { font-size: 22px; font-weight: 700; }
        .footer { text-align: center; font-size: 13px; color: #999; padding-top: 24px; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <div class="brand-name">Return Invoice</div>
          <div class="invoice-type">${invoice.companyName || "Return"}</div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-number">${invoice.returnNumber}</div>
          <div class="invoice-date">${formatDate(invoice.date)}</div>
        </div>
      </div>

      <div class="info-grid">
        ${companySection}
        <div class="info-item">
          <label>Customer</label>
          <p>${invoice.customerName || "—"}</p>
        </div>
        <div class="info-item">
          <label>Original Invoice</label>
          <p>${invoice.originalInvoiceNumber}</p>
        </div>
        <div class="info-item">
          <label>Return Date</label>
          <p>${formatDate(invoice.date)}</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align:right">Qty Returned</th>
              <th style="text-align:right">Unit Price</th>
              <th style="text-align:right">Refund</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <div class="total-box">
          <div class="total-label">Total Refund</div>
          <div class="total-value">${formatCurrency(invoice.total)}</div>
        </div>
      </div>

      <div class="footer">Return processed &bull; ${invoice.returnNumber} &bull; Currency: Jordanian Dinar (JOD)</div>
    </body>
    </html>
  `;
}

export async function generateAndShareSalesPDF(invoice: SalesInvoice): Promise<void> {
  if (Platform.OS === "web") {
    const html = buildSalesHtml(invoice);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 400);
    }
    return;
  }
  const html = buildSalesHtml(invoice);
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

export async function generateAndShareReturnPDF(invoice: ReturnInvoice): Promise<void> {
  if (Platform.OS === "web") {
    const html = buildReturnHtml(invoice);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 400);
    }
    return;
  }
  const html = buildReturnHtml(invoice);
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

export async function downloadSalesPDF(invoice: SalesInvoice): Promise<void> {
  const html = buildSalesHtml(invoice);
  if (Platform.OS === "web") {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Print.printAsync({ html });
}

export async function downloadReturnPDF(invoice: ReturnInvoice): Promise<void> {
  const html = buildReturnHtml(invoice);
  if (Platform.OS === "web") {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.returnNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Print.printAsync({ html });
}
