
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateInvoiceTotal } from "@/utils/calculators";
import { formatCurrency } from "@/utils/calculators";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { invoices, companies, customers } = useInvoiceContext();
  
  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  
  const totalAmount = invoices.reduce((total, invoice) => {
    return total + calculateInvoiceTotal(
      invoice.items, 
      invoice.globalDiscount || 0, 
      invoice.applyEquivalenceSurcharge || false
    );
  }, 0);
  
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen de tu actividad de facturación</p>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          title="Configura tu primera empresa"
          description="Para empezar a crear facturas, primero debes configurar tu empresa o negocio."
          actionLink="/empresas"
          actionText="Configurar empresa"
          icon={
            <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Facturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInvoices}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Facturas Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{pendingInvoices}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Facturas Pagadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Facturado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Facturas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {recentInvoices.map(invoice => (
                      <div key={invoice.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-md">
                        <div className="space-y-1">
                          <div className="font-medium">Factura #{invoice.number}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(invoice.date).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-3 py-1 rounded-full text-xs ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'sent' ? 'bg-amber-100 text-amber-800' :
                            invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status === 'paid' ? 'Pagada' : 
                             invoice.status === 'sent' ? 'Enviada' :
                             invoice.status === 'draft' ? 'Borrador' : 'Cancelada'}
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/facturas/${invoice.id}`}>
                              Ver
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay facturas recientes
                  </div>
                )}
                
                <div className="mt-6">
                  <Button asChild>
                    <Link to="/facturas/nueva">Crear factura</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-4">{customers.length}</div>
                  {customers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No hay clientes registrados
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      Los clientes se agregan automáticamente al crear facturas
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Empresas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-4">{companies.length}</div>
                  <div className="mt-2">
                    <Button variant="outline" asChild>
                      <Link to="/empresas">Gestionar empresas</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
