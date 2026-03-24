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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .company { font-size: 24px; font-weight: 700; color: #1A73E8; }
        .invoice-label { font-size: 28px; font-weight: 700; color: #111; }
        .invoice-number { font-size: 16px; color: #666; margin-top: 4px; }
        .meta { display: flex; gap: 40px; margin-bottom: 32px; background: #F8FAFC; padding: 20px; border-radius: 8px; }
        .meta-item label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .meta-item p { font-size: 15px; font-weight: 600; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead tr { background: #1A73E8; color: white; }
        thead th { padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; }
        thead th:not(:first-child) { text-align: right; }
        tbody tr { border-bottom: 1px solid #F3F4F6; }
        tbody td { padding: 12px 16px; font-size: 14px; }
        .total-row { background: #F8FAFC; }
        .total-row td { font-weight: 700; font-size: 16px; padding: 16px; }
        .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">Sales Invoice</div>
        </div>
        <div style="text-align:right">
          <div class="invoice-label">${invoice.invoiceNumber}</div>
          <div class="invoice-number">${formatDate(invoice.date)}</div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-item">
          <label>Customer</label>
          <p>${invoice.customerName}</p>
        </div>
        <div class="meta-item">
          <label>Invoice Date</label>
          <p>${formatDate(invoice.date)}</p>
        </div>
        <div class="meta-item">
          <label>Currency</label>
          <p>Jordanian Dinar (JOD)</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Unit Price</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr class="total-row">
            <td colspan="3" style="text-align:right">Grand Total</td>
            <td style="text-align:right">${formatCurrency(invoice.total)}</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">Thank you for your business</div>
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
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${formatCurrency(item.price)}</td>
      <td style="text-align:right">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .company { font-size: 24px; font-weight: 700; color: #EA4335; }
        .invoice-label { font-size: 28px; font-weight: 700; color: #111; }
        .invoice-number { font-size: 16px; color: #666; margin-top: 4px; }
        .meta { display: flex; gap: 40px; margin-bottom: 32px; background: #FEF3CD; padding: 20px; border-radius: 8px; }
        .meta-item label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .meta-item p { font-size: 15px; font-weight: 600; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead tr { background: #EA4335; color: white; }
        thead th { padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; }
        thead th:not(:first-child) { text-align: right; }
        tbody tr { border-bottom: 1px solid #F3F4F6; }
        tbody td { padding: 12px 16px; font-size: 14px; }
        .total-row { background: #FCE8E6; }
        .total-row td { font-weight: 700; font-size: 16px; padding: 16px; color: #EA4335; }
        .ref { font-size: 13px; color: #666; margin-bottom: 24px; }
        .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">Return Invoice</div>
        </div>
        <div style="text-align:right">
          <div class="invoice-label">${invoice.returnNumber}</div>
          <div class="invoice-number">${formatDate(invoice.date)}</div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-item">
          <label>Customer</label>
          <p>${invoice.customerName}</p>
        </div>
        <div class="meta-item">
          <label>Original Invoice</label>
          <p>${invoice.originalInvoiceNumber}</p>
        </div>
        <div class="meta-item">
          <label>Return Date</label>
          <p>${formatDate(invoice.date)}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center">Qty Returned</th>
            <th style="text-align:right">Unit Price</th>
            <th style="text-align:right">Refund</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr class="total-row">
            <td colspan="3" style="text-align:right">Total Refund</td>
            <td style="text-align:right">${formatCurrency(invoice.total)}</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">Return processed — currency: Jordanian Dinar (JOD)</div>
    </body>
    </html>
  `;
}

export async function generateAndShareSalesPDF(
  invoice: SalesInvoice
): Promise<void> {
  if (Platform.OS === "web") {
    alert("PDF sharing is not supported on web. Please use the mobile app.");
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

export async function generateAndShareReturnPDF(
  invoice: ReturnInvoice
): Promise<void> {
  if (Platform.OS === "web") {
    alert("PDF sharing is not supported on web. Please use the mobile app.");
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
