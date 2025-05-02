
import jsPDF from 'jspdf';
import { InvoiceWithDetails, InvoiceItem } from '@/types';
import { formatCurrency } from './calculators';
import autoTable from 'jspdf-autotable';

export async function generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Blob> {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Add company logo if exists
  if (invoice.company.logo) {
    try {
      const img = await loadImage(invoice.company.logo);
      doc.addImage(img, 'JPEG', 15, 15, 50, 25);
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }
  
  // Company information - top right
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  let companyYPos = 15;
  doc.text('EMISOR:', 140, companyYPos);
  companyYPos += 6;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.company.name, 140, companyYPos);
  companyYPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`CIF/NIF: ${invoice.company.taxId}`, 140, companyYPos);
  companyYPos += 4;
  doc.text(invoice.company.address, 140, companyYPos);
  companyYPos += 4;
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, 140, companyYPos);
  companyYPos += 4;
  doc.text(`${invoice.company.province}, ${invoice.company.country}`, 140, companyYPos);
  
  if (invoice.company.phone) {
    companyYPos += 4;
    doc.text(`Tel: ${invoice.company.phone}`, 140, companyYPos);
  }
  
  if (invoice.company.email) {
    companyYPos += 4;
    doc.text(`Email: ${invoice.company.email}`, 140, companyYPos);
  }
  
  // Invoice title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', 15, 55);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nº Factura: ${invoice.number}`, 15, 65);
  doc.text(`Fecha: ${formatDate(invoice.date)}`, 15, 70);
  if (invoice.dueDate) {
    doc.text(`Fecha vencimiento: ${formatDate(invoice.dueDate)}`, 15, 75);
  }
  
  // Customer information
  const customerYStart = 85;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('CLIENTE:', 15, customerYStart);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.customer.name, 15, customerYStart + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`CIF/NIF: ${invoice.customer.taxId}`, 15, customerYStart + 11);
  doc.text(invoice.customer.address, 15, customerYStart + 16);
  doc.text(`${invoice.customer.postalCode} ${invoice.customer.city}`, 15, customerYStart + 21);
  doc.text(`${invoice.customer.province}, ${invoice.customer.country}`, 15, customerYStart + 26);
  
  // Invoice items table
  doc.setFontSize(10);
  const tableColumns = [
    'Descripción', 
    'Cantidad', 
    'Precio', 
    'Descuento', 
    'Base Imponible', 
    'IVA', 
    'Total'
  ];
  
  const tableRows = invoice.items.map((item: InvoiceItem) => {
    const subtotal = item.quantity * item.price;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax / 100);
    return [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.price),
      `${item.discount.toFixed(2)}%`,
      formatCurrency(afterDiscount),
      `${item.tax.toFixed(2)}%`,
      formatCurrency(afterDiscount + taxAmount)
    ];
  });
  
  autoTable(doc, {
    startY: customerYStart + 35,
    head: [tableColumns],
    body: tableRows,
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 }, // Description column wider
    },
  });
  
  // Get the last Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Add notes if they exist
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas:', 15, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Split long notes into multiple lines
    const splitNotes = doc.splitTextToSize(invoice.notes, 120);
    doc.text(splitNotes, 15, finalY + 5);
  }
  
  // Summary table (right side)
  doc.setFontSize(9);
  
  const summaryY = invoice.notes ? 
    finalY + 5 + Math.min(doc.getTextDimensions(invoice.notes).h, 40) : finalY;
  
  // Summary box
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(249, 249, 249);
  doc.roundedRect(120, summaryY, 75, 40, 2, 2, 'DF');
  
  // Summary content
  doc.setFont('helvetica', 'normal');
  let summaryLineY = summaryY + 8;
  doc.text('Subtotal:', 125, summaryLineY);
  doc.text(formatCurrency(invoice.totalBeforeTax), 175, summaryLineY, { align: 'right' });
  
  if (invoice.totalDiscount > 0) {
    summaryLineY += 7;
    doc.text('Descuento:', 125, summaryLineY);
    doc.text(`- ${formatCurrency(invoice.totalDiscount)}`, 175, summaryLineY, { align: 'right' });
  }
  
  summaryLineY += 7;
  doc.text('IVA:', 125, summaryLineY);
  doc.text(formatCurrency(invoice.totalTax), 175, summaryLineY, { align: 'right' });
  
  if (invoice.applyEquivalenceSurcharge) {
    summaryLineY += 7;
    doc.text('Recargo Equivalencia:', 125, summaryLineY);
    doc.text(formatCurrency(invoice.totalBeforeTax * 0.052), 175, summaryLineY, { align: 'right' });
  }
  
  // Draw a line before total
  summaryLineY += 3;
  doc.setDrawColor(150, 150, 150);
  doc.line(125, summaryLineY, 175, summaryLineY);
  
  // Total
  summaryLineY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', 125, summaryLineY);
  doc.text(formatCurrency(invoice.total), 175, summaryLineY, { align: 'right' });
  
  return doc.output('blob');
}

// Utility function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
}

// Utility function to load image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
