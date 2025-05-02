
export interface Company {
  id: string;
  name: string;
  taxId: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export interface Customer {
  id: string;
  name: string;
  taxId: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  tax: number;
  discount: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  companyId: string;
  customerId: string;
  items: InvoiceItem[];
  notes?: string;
  globalDiscount?: number;
  applyEquivalenceSurcharge?: boolean;
  applyWithholdingTax?: boolean;
  withholdingTaxRate?: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
}

export interface InvoiceWithDetails extends Invoice {
  company: Company;
  customer: Customer;
  totalBeforeTax: number;
  totalTax: number;
  totalDiscount: number;
  totalWithholdingTax?: number;
  total: number;
}
