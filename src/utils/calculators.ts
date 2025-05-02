
import { InvoiceItem, InvoiceWithDetails, Invoice, Company, Customer } from "@/types";

export function calculateItemTotal(item: InvoiceItem): number {
  const subtotal = item.quantity * item.price;
  const discountAmount = subtotal * (item.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (item.tax / 100);
  
  return afterDiscount + taxAmount;
}

export function calculateInvoiceSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
}

export function calculateInvoiceTotalDiscount(items: InvoiceItem[], globalDiscount: number = 0): number {
  const itemDiscounts = items.reduce((sum, item) => {
    const subtotal = item.quantity * item.price;
    return sum + (subtotal * (item.discount / 100));
  }, 0);
  
  const subtotal = calculateInvoiceSubtotal(items);
  const globalDiscountAmount = subtotal * (globalDiscount / 100);
  
  return itemDiscounts + globalDiscountAmount;
}

export function calculateInvoiceTax(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => {
    const subtotal = item.quantity * item.price;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax / 100);
    
    return sum + taxAmount;
  }, 0);
}

export function calculateInvoiceTotal(
  items: InvoiceItem[], 
  globalDiscount: number = 0,
  applyEquivalenceSurcharge: boolean = false
): number {
  const subtotal = calculateInvoiceSubtotal(items);
  const totalDiscount = calculateInvoiceTotalDiscount(items, globalDiscount);
  const afterGlobalDiscount = subtotal - totalDiscount;
  
  let totalTax = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.price;
    const itemDiscount = itemSubtotal * (item.discount / 100);
    const afterDiscount = itemSubtotal - itemDiscount;
    const taxAmount = afterDiscount * (item.tax / 100);
    
    // Calculate equivalence surcharge if applicable
    const equivalenceSurcharge = applyEquivalenceSurcharge ? 
      afterDiscount * (item.tax > 0 ? 0.052 : 0) : 0;
    
    return sum + taxAmount + equivalenceSurcharge;
  }, 0);
  
  return afterGlobalDiscount + totalTax;
}

export function enrichInvoiceWithDetails(
  invoice: Invoice,
  company: Company,
  customer: Customer
): InvoiceWithDetails {
  const totalBeforeTax = calculateInvoiceSubtotal(invoice.items);
  const totalDiscount = calculateInvoiceTotalDiscount(invoice.items, invoice.globalDiscount || 0);
  const totalTax = calculateInvoiceTax(invoice.items);
  const total = calculateInvoiceTotal(
    invoice.items,
    invoice.globalDiscount || 0,
    invoice.applyEquivalenceSurcharge || false
  );

  return {
    ...invoice,
    company,
    customer,
    totalBeforeTax,
    totalTax,
    totalDiscount,
    total
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}
