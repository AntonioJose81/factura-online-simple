
import { useState } from "react";
import { Link } from "react-router-dom";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { calculateInvoiceTotal, formatCurrency } from "@/utils/calculators";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { generateInvoicePDF } from "@/utils/pdf-generator";
import { toast } from "@/hooks/use-toast";

export default function InvoiceList() {
  const { invoices, companies, customers, deleteInvoice, getCompany, getCustomer } = useInvoiceContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);

  const filteredInvoices = invoices
    .filter(invoice => {
      const company = getCompany(invoice.companyId);
      const customer = getCustomer(invoice.customerId);
      
      // Apply search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        invoice.number.toLowerCase().includes(searchLower) ||
        company?.name.toLowerCase().includes(searchLower) ||
        customer?.name.toLowerCase().includes(searchLower);
      
      // Apply status filter
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      
      // Apply company filter
      const matchesCompany = !companyFilter || invoice.companyId === companyFilter;
      
      return matchesSearch && matchesStatus && matchesCompany;
    })
    .sort((a, b) => {
      // Sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        throw new Error("Factura no encontrada");
      }
      
      const company = getCompany(invoice.companyId);
      const customer = getCustomer(invoice.customerId);
      
      if (!company || !customer) {
        throw new Error("Datos de empresa o cliente no encontrados");
      }
      
      const enrichedInvoice = {
        ...invoice,
        company,
        customer,
        totalBeforeTax: 0,
        totalTax: 0,
        totalDiscount: 0,
        total: calculateInvoiceTotal(
          invoice.items, 
          invoice.globalDiscount || 0,
          invoice.applyEquivalenceSurcharge || false
        )
      };
      
      const pdfBlob = await generateInvoicePDF(enrichedInvoice);
      
      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF generado",
        description: `La factura ${invoice.number} ha sido descargada correctamente.`
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error al generar PDF",
        description: "Ha ocurrido un error al generar el PDF.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Facturas</h1>
          <p className="text-gray-500">Gestiona todas tus facturas</p>
        </div>
        <Button asChild>
          <Link to="/facturas/nueva">Nueva Factura</Link>
        </Button>
      </div>
      
      {invoices.length === 0 ? (
        <EmptyState
          title="No hay facturas"
          description="Crea tu primera factura para comenzar"
          actionLink="/facturas/nueva"
          actionText="Crear factura"
          icon={
            <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      ) : (
        <>
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div className="col-span-3 md:col-span-1">
                <Input 
                  placeholder="Buscar facturas..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {statusFilter ? (
                        statusFilter === 'paid' ? 'Pagada' :
                        statusFilter === 'sent' ? 'Enviada' :
                        statusFilter === 'draft' ? 'Borrador' :
                        'Cancelada'
                      ) : 'Estado: Todos'}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 ml-2"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
                      Borrador
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('sent')}>
                      Enviada
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('paid')}>
                      Pagada
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>
                      Cancelada
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {companyFilter ? 
                        companies.find(c => c.id === companyFilter)?.name || 'Empresa' : 
                        'Empresa: Todas'}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 ml-2"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setCompanyFilter(null)}>
                      Todas
                    </DropdownMenuItem>
                    {companies.map(company => (
                      <DropdownMenuItem 
                        key={company.id} 
                        onClick={() => setCompanyFilter(company.id)}
                      >
                        {company.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">N° Factura</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Fecha</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Cliente</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Estado</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Total</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          No se encontraron facturas con los filtros seleccionados
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map(invoice => {
                        const company = getCompany(invoice.companyId);
                        const customer = getCustomer(invoice.customerId);
                        
                        return (
                          <tr 
                            key={invoice.id} 
                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                          >
                            <td className="p-4 align-middle">{invoice.number}</td>
                            <td className="p-4 align-middle">
                              {new Date(invoice.date).toLocaleDateString('es-ES')}
                            </td>
                            <td className="p-4 align-middle">{customer?.name || 'Cliente desconocido'}</td>
                            <td className="p-4 align-middle">
                              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'sent' ? 'bg-amber-100 text-amber-800' :
                                invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {invoice.status === 'paid' ? 'Pagada' : 
                                 invoice.status === 'sent' ? 'Enviada' :
                                 invoice.status === 'draft' ? 'Borrador' : 'Cancelada'}
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              {formatCurrency(calculateInvoiceTotal(
                                invoice.items, 
                                invoice.globalDiscount || 0, 
                                invoice.applyEquivalenceSurcharge || false
                              ))}
                            </td>
                            <td className="p-4 align-middle text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => downloadInvoice(invoice.id)}
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    className="mr-1"
                                  >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                  PDF
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/facturas/${invoice.id}`}>
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="16" 
                                      height="16" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                      className="mr-1"
                                    >
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Editar
                                  </Link>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    if (confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
                                      deleteInvoice(invoice.id);
                                      toast({
                                        title: "Factura eliminada",
                                        description: "La factura ha sido eliminada correctamente."
                                      });
                                    }
                                  }}
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    className="mr-1"
                                  >
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                  </svg>
                                  Eliminar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
