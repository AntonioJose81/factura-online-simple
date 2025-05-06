
import React from "react";
import { AppearanceSettings } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/calculators";

interface InvoiceAppearancePreviewProps {
  appearance: AppearanceSettings;
}

export function InvoiceAppearancePreview({ appearance }: InvoiceAppearancePreviewProps) {
  const { primaryColor, accentColor, fontFamily, showLogo, colorScheme } = appearance;

  // Sample data for preview
  const invoiceData = {
    number: "FRA-23-04-001",
    date: "15/04/2023",
    dueDate: "15/05/2023",
    company: {
      name: "Mi Empresa, S.L.",
      taxId: "B12345678",
      address: "Calle Principal 123",
      postalCode: "28001",
      city: "Madrid",
      province: "Madrid",
      country: "España",
      phone: "912345678",
      email: "info@miempresa.com"
    },
    customer: {
      name: "Cliente Ejemplo, S.A.",
      taxId: "A87654321",
      address: "Avenida del Cliente 45",
      postalCode: "08001",
      city: "Barcelona",
      province: "Barcelona",
      country: "España"
    },
    items: [
      {
        description: "Desarrollo web",
        quantity: 1,
        price: 1500,
        discount: 0,
        tax: 21
      },
      {
        description: "Diseño gráfico",
        quantity: 1,
        price: 500,
        discount: 10,
        tax: 21
      }
    ],
    subtotal: 1950,
    tax: 409.50,
    total: 2359.50
  };

  // Style classes based on appearance settings
  const containerClass = cn(
    "min-w-[600px] font-sans overflow-hidden",
    {
      "font-['Inter']": fontFamily === "inter",
      "font-['Poppins']": fontFamily === "poppins",
      "font-['Roboto']": fontFamily === "roboto",
      "font-['Georgia']": fontFamily === "georgia",
    }
  );
  
  // Header styles based on color scheme
  const headerClass = cn(
    "p-6",
    {
      "bg-white border-b": colorScheme === "default",
      [`bg-[${primaryColor}] text-white`]: colorScheme === "modern",
      "bg-white": colorScheme === "minimal",
      [`bg-[${primaryColor}] text-white border-b-8 border-[${accentColor}]`]: colorScheme === "bold",
    }
  );

  // Title styles based on color scheme
  const titleClass = cn(
    "text-2xl font-bold",
    {
      [`text-[${primaryColor}]`]: colorScheme === "default" || colorScheme === "minimal",
      "text-white": colorScheme === "modern" || colorScheme === "bold",
    }
  );

  // Table header styles based on color scheme
  const tableHeaderClass = cn(
    "p-2 text-left",
    {
      "bg-gray-100": colorScheme === "default" || colorScheme === "minimal",
      [`bg-[${accentColor}] text-white`]: colorScheme === "modern" || colorScheme === "bold",
    }
  );

  // Total section styles based on color scheme
  const totalSectionClass = cn(
    "border p-4 rounded-md",
    {
      "bg-gray-50": colorScheme === "default",
      [`bg-[${primaryColor}] bg-opacity-10`]: colorScheme === "modern" || colorScheme === "bold",
      "bg-gray-50 border-t-2": colorScheme === "minimal",
    }
  );

  // Calculate totals for the preview
  const calculateItemTotal = (item: any) => {
    const subtotal = item.quantity * item.price;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax / 100);
    return afterDiscount + taxAmount;
  };

  return (
    <div className={containerClass} style={{ zoom: "0.8" }}>
      {/* Header section */}
      <div className={headerClass}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className={titleClass}>FACTURA</h2>
            <p className="text-sm mt-2">Nº: <strong>{invoiceData.number}</strong></p>
            <p className="text-sm">Fecha: <strong>{invoiceData.date}</strong></p>
            <p className="text-sm">Vencimiento: <strong>{invoiceData.dueDate}</strong></p>
          </div>
          
          {/* Logo */}
          {showLogo && (
            <div className="w-24 h-16 bg-gray-200 flex items-center justify-center rounded">
              <span className="text-xs text-gray-500">Logo empresa</span>
            </div>
          )}
        </div>
      </div>

      {/* Company and customer info */}
      <div className="p-6 grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-gray-600 text-xs mb-2" style={{ color: primaryColor }}>DATOS EMISOR</h3>
          <div className="text-sm space-y-1">
            <p className="font-semibold">{invoiceData.company.name}</p>
            <p>CIF/NIF: {invoiceData.company.taxId}</p>
            <p>{invoiceData.company.address}</p>
            <p>{invoiceData.company.postalCode} {invoiceData.company.city}</p>
            <p>{invoiceData.company.province}, {invoiceData.company.country}</p>
            <p>Tel: {invoiceData.company.phone}</p>
            <p>Email: {invoiceData.company.email}</p>
          </div>
        </div>

        <div>
          <h3 className="text-gray-600 text-xs mb-2" style={{ color: primaryColor }}>DATOS CLIENTE</h3>
          <div className="text-sm space-y-1">
            <p className="font-semibold">{invoiceData.customer.name}</p>
            <p>CIF/NIF: {invoiceData.customer.taxId}</p>
            <p>{invoiceData.customer.address}</p>
            <p>{invoiceData.customer.postalCode} {invoiceData.customer.city}</p>
            <p>{invoiceData.customer.province}, {invoiceData.customer.country}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-6">
        <h3 className="font-medium mb-3" style={{ color: primaryColor }}>CONCEPTOS</h3>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeaderClass}>Descripción</th>
                <th className={`${tableHeaderClass} text-right`}>Cant.</th>
                <th className={`${tableHeaderClass} text-right`}>Precio</th>
                <th className={`${tableHeaderClass} text-right`}>Dto.</th>
                <th className={`${tableHeaderClass} text-right`}>Base Imp.</th>
                <th className={`${tableHeaderClass} text-right`}>IVA</th>
                <th className={`${tableHeaderClass} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => {
                const itemSubtotal = item.quantity * item.price;
                const itemDiscountAmount = itemSubtotal * (item.discount / 100);
                const itemAfterDiscount = itemSubtotal - itemDiscountAmount;
                
                return (
                  <tr key={index} className="border-t">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                    <td className="p-2 text-right">{item.discount > 0 ? `${item.discount}%` : "-"}</td>
                    <td className="p-2 text-right">{formatCurrency(itemAfterDiscount)}</td>
                    <td className="p-2 text-right">{`${item.tax}%`}</td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(calculateItemTotal(item))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="p-6 flex justify-end">
        <div className={totalSectionClass} style={{ width: '250px' }}>
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoiceData.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm my-1">
            <span>IVA (21%):</span>
            <span>{formatCurrency(invoiceData.tax)}</span>
          </div>
          <div style={{ borderTopColor: primaryColor }} className="flex justify-between font-bold mt-2 pt-2 border-t">
            <span>TOTAL:</span>
            <span>{formatCurrency(invoiceData.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
