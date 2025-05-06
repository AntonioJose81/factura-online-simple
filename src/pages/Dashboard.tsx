import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateInvoiceTotal } from "@/utils/calculators";
import { formatCurrency } from "@/utils/calculators";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { exportAllData } from "@/utils/exporters";
import { toast } from "@/hooks/use-toast";

// Constants for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { invoices, companies, customers } = useInvoiceContext();
  
  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;
  const cancelledInvoices = invoices.filter(inv => inv.status === 'cancelled').length;
  
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

  // Prepare data for the status chart
  const statusChartData = [
    { name: 'Borrador', value: draftInvoices },
    { name: 'Enviada', value: pendingInvoices },
    { name: 'Pagada', value: paidInvoices },
    { name: 'Cancelada', value: cancelledInvoices },
  ].filter(item => item.value > 0);

  // Prepare monthly data
  const monthlySales = getMonthlyData(invoices);

  // Prepare data for customers with most invoices
  const customerInvoiceCounts = invoices.reduce<{[key: string]: number}>((acc, invoice) => {
    acc[invoice.customerId] = (acc[invoice.customerId] || 0) + 1;
    return acc;
  }, {});

  const topCustomersData = Object.entries(customerInvoiceCounts)
    .map(([customerId, count]) => {
      const customer = customers.find(c => c.id === customerId);
      return { 
        name: customer ? customer.name : 'Cliente desconocido', 
        value: count 
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const handleExportAll = () => {
    try {
      exportAllData(companies, customers, invoices);
      toast({
        title: "Exportación completada",
        description: "Todos los datos han sido exportados correctamente"
      });
    } catch (error) {
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los datos",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Resumen de tu actividad de facturación</p>
        </div>
        <div>
          <Button variant="outline" onClick={handleExportAll}>
            Exportar Todos los Datos
          </Button>
        </div>
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
            {/* Monthly Revenue Chart */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Facturación Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlySales.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlySales}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          interval={0}
                        />
                        <YAxis />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                          name="Importe"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#82ca9d" 
                          yAxisId="right" 
                          name="Facturas" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de facturación para mostrar
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status Chart */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Estado de Facturas</CardTitle>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} facturas`, "Cantidad"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de facturas para mostrar
                  </div>
                )}
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
            
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Clientes Principales</CardTitle>
              </CardHeader>
              <CardContent>
                {topCustomersData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topCustomersData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Facturas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de clientes para mostrar
                  </div>
                )}
                <div className="mt-6 flex justify-between">
                  <div className="text-sm">
                    Total de clientes: <span className="font-bold">{customers.length}</span>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/clientes">Ver todos los clientes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Custom label component for pie chart
const RADIAN = Math.PI / 180;
function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// Helper function to get monthly data
function getMonthlyData(invoices: any[]) {
  if (invoices.length === 0) return [];
  
  const monthlyData: {[key: string]: {amount: number, count: number}} = {};
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  // Get range of dates
  const dates = invoices.map(inv => new Date(inv.date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Initialize all months in the range
  let currentDate = new Date(minDate);
  currentDate.setDate(1);
  while (currentDate <= maxDate) {
    const monthKey = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    monthlyData[monthKey] = { amount: 0, count: 0 };
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // Fill data
  invoices.forEach(invoice => {
    const date = new Date(invoice.date);
    const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
    
    const amount = calculateInvoiceTotal(
      invoice.items, 
      invoice.globalDiscount || 0, 
      invoice.applyEquivalenceSurcharge || false
    );
    
    monthlyData[monthKey].amount += amount;
    monthlyData[monthKey].count += 1;
  });
  
  // Convert to array for chart
  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    amount: data.amount,
    count: data.count
  }));
}
