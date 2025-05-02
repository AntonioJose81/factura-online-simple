
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Company, Customer, Invoice, InvoiceItem } from "@/types";
import { 
  calculateInvoiceTotal, 
  formatCurrency, 
  calculateWithholdingTax,
  calculateInvoiceSubtotal 
} from "@/utils/calculators";
import { generateInvoicePDF } from "@/utils/pdf-generator";

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
};

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    companies, 
    customers, 
    invoices, 
    getInvoice, 
    addInvoice, 
    updateInvoice, 
    addCustomer 
  } = useInvoiceContext();

  const [activeTab, setActiveTab] = useState("details");

  // Invoice state
  const [invoice, setInvoice] = useState<Omit<Invoice, "id">>({
    number: "",
    date: new Date().toISOString().substring(0, 10),
    dueDate: "",
    companyId: companies.length > 0 ? companies[0].id : "",
    customerId: "",
    items: [],
    notes: "",
    globalDiscount: 0,
    applyEquivalenceSurcharge: false,
    applyWithholdingTax: false,
    withholdingTaxRate: 15,
    status: "draft"
  });

  // Customer form state
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, "id">>({
    name: "",
    taxId: "",
    address: "",
    postalCode: "",
    city: "",
    province: "",
    country: "España",
    phone: "",
    email: ""
  });

  // Item state
  const [currentItem, setCurrentItem] = useState<Omit<InvoiceItem, "id">>({
    description: "",
    quantity: 1,
    price: 0,
    tax: 21,
    discount: 0
  });

  // Load invoice data if editing
  useEffect(() => {
    if (id) {
      const existingInvoice = getInvoice(id);
      if (existingInvoice) {
        setInvoice(existingInvoice);
      } else {
        toast({
          title: "Error",
          description: "No se encontró la factura especificada",
          variant: "destructive"
        });
        navigate("/facturas");
      }
    }
  }, [id, getInvoice, navigate]);

  // Generate invoice number if new
  useEffect(() => {
    if (!id && invoice.number === "") {
      // Get the current year and month
      const now = new Date();
      const year = now.getFullYear().toString().substring(2); // Last two digits of year
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Count existing invoices for this month
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getFullYear() === now.getFullYear() && 
               invDate.getMonth() === now.getMonth();
      });
      
      // Generate number: FRA-YY-MM-XXX (XXX is sequential number)
      const sequentialNumber = (monthInvoices.length + 1).toString().padStart(3, '0');
      const invoiceNumber = `FRA-${year}-${month}-${sequentialNumber}`;
      
      setInvoice(prev => ({ ...prev, number: invoiceNumber }));
    }
  }, [id, invoice.number, invoices]);

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCustomer({ ...newCustomer, [name]: value });
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "quantity" || name === "price" || name === "tax" || name === "discount") {
      // Convert to number and ensure it's not negative
      let numValue = parseFloat(value);
      numValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
      
      // For percentages (tax, discount), ensure it's not above 100
      if ((name === "tax" || name === "discount") && numValue > 100) {
        numValue = 100;
      }
      
      setCurrentItem({ ...currentItem, [name]: numValue });
    } else {
      setCurrentItem({ ...currentItem, [name]: value });
    }
  };

  const addItem = () => {
    if (!currentItem.description || currentItem.quantity <= 0 || currentItem.price <= 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const newItem: InvoiceItem = {
      ...currentItem,
      id: uuidv4()
    };

    setInvoice({
      ...invoice,
      items: [...invoice.items, newItem]
    });

    // Reset current item
    setCurrentItem({
      description: "",
      quantity: 1,
      price: 0,
      tax: 21,
      discount: 0
    });
  };

  const editItem = (index: number) => {
    const item = invoice.items[index];
    setCurrentItem({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      tax: item.tax,
      discount: item.discount
    });
    
    // Remove the item from the invoice
    const updatedItems = [...invoice.items];
    updatedItems.splice(index, 1);
    setInvoice({ ...invoice, items: updatedItems });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...invoice.items];
    updatedItems.splice(index, 1);
    setInvoice({ ...invoice, items: updatedItems });
  };

  const addNewCustomer = () => {
    if (!newCustomer.name || !newCustomer.taxId) {
      toast({
        title: "Error",
        description: "El nombre y NIF/CIF son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const addedCustomer = addCustomer(newCustomer);
    setInvoice({ ...invoice, customerId: addedCustomer.id });
    setIsCustomerDialogOpen(false);
    
    // Reset new customer form
    setNewCustomer({
      name: "",
      taxId: "",
      address: "",
      postalCode: "",
      city: "",
      province: "",
      country: "España",
      phone: "",
      email: ""
    });
    
    toast({
      title: "Cliente añadido",
      description: "El cliente ha sido añadido correctamente"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice.companyId) {
      toast({
        title: "Error",
        description: "Debe seleccionar una empresa",
        variant: "destructive"
      });
      return;
    }
    
    if (!invoice.customerId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive"
      });
      return;
    }
    
    if (invoice.items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un artículo a la factura",
        variant: "destructive"
      });
      return;
    }
    
    if (id) {
      // Update existing invoice
      updateInvoice({ ...invoice, id });
      toast({
        title: "Factura actualizada",
        description: "La factura ha sido actualizada correctamente"
      });
    } else {
      // Add new invoice
      addInvoice(invoice);
      toast({
        title: "Factura creada",
        description: "La factura ha sido creada correctamente"
      });
    }
    
    navigate("/facturas");
  };

  const downloadInvoice = async () => {
    try {
      const company = companies.find(c => c.id === invoice.companyId);
      const customer = customers.find(c => c.id === invoice.customerId);
      
      if (!company || !customer) {
        throw new Error("Datos de empresa o cliente no encontrados");
      }
      
      const invoiceWithDetails = {
        ...(id ? { id } : { id: "temp" }),
        ...invoice,
        company,
        customer,
        totalBeforeTax: 0,
        totalTax: 0,
        totalDiscount: 0,
        totalWithholdingTax: invoice.applyWithholdingTax ? 
          calculateWithholdingTax(
            calculateInvoiceSubtotal(invoice.items) - 
            (calculateInvoiceSubtotal(invoice.items) * (invoice.globalDiscount || 0) / 100),
            true,
            invoice.withholdingTaxRate || 0
          ) : 0,
        total: calculateInvoiceTotal(
          invoice.items, 
          invoice.globalDiscount || 0,
          invoice.applyEquivalenceSurcharge || false,
          invoice.applyWithholdingTax || false,
          invoice.withholdingTaxRate || 0
        )
      };
      
      const pdfBlob = await generateInvoicePDF(invoiceWithDetails);
      
      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${invoice.number || 'borrador'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF generado",
        description: "La factura ha sido descargada correctamente"
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error al generar PDF",
        description: "Ha ocurrido un error al generar el PDF",
        variant: "destructive"
      });
    }
  };

  // Calculate totals
  const subtotal = invoice.items.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );
  
  const discountAmount = subtotal * (invoice.globalDiscount || 0) / 100;
  
  const taxAmount = invoice.items.reduce((total, item) => {
    const itemSubtotal = item.quantity * item.price;
    const itemDiscountAmount = itemSubtotal * (item.discount / 100);
    const afterDiscount = itemSubtotal - itemDiscountAmount;
    return total + (afterDiscount * (item.tax / 100));
  }, 0);
  
  const equivalenceSurchargeAmount = invoice.applyEquivalenceSurcharge
    ? invoice.items.reduce((total, item) => {
        const itemSubtotal = item.quantity * item.price;
        const itemDiscountAmount = itemSubtotal * (item.discount / 100);
        const afterDiscount = itemSubtotal - itemDiscountAmount;
        // Apply 5.2% equivalence surcharge for items with tax
        return total + (item.tax > 0 ? afterDiscount * 0.052 : 0);
      }, 0)
    : 0;
  
  const afterDiscount = subtotal - discountAmount;
  
  const withholdingTaxAmount = invoice.applyWithholdingTax && invoice.withholdingTaxRate 
    ? afterDiscount * (invoice.withholdingTaxRate / 100)
    : 0;
  
  const total = calculateInvoiceTotal(
    invoice.items,
    invoice.globalDiscount || 0,
    invoice.applyEquivalenceSurcharge || false,
    invoice.applyWithholdingTax || false,
    invoice.withholdingTaxRate || 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{id ? "Editar Factura" : "Nueva Factura"}</h1>
          <p className="text-gray-500">{id ? `Editando factura ${invoice.number}` : "Crea una nueva factura"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadInvoice}>
            Previsualizar PDF
          </Button>
          <Button onClick={handleSubmit}>
            {id ? "Actualizar Factura" : "Crear Factura"}
          </Button>
        </div>
      </div>

      {companies.length === 0 ? (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-amber-800">Configuración requerida</h3>
                <p className="text-amber-700">
                  Antes de crear facturas, debes configurar al menos una empresa.{" "}
                  <Button variant="link" className="p-0 text-amber-800 underline" onClick={() => navigate('/empresas')}>
                    Configurar ahora
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details">Detalles de Factura</TabsTrigger>
              <TabsTrigger value="items">Artículos</TabsTrigger>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="number">Número de Factura</Label>
                      <Input
                        id="number"
                        name="number"
                        value={invoice.number}
                        onChange={handleInvoiceChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Estado</Label>
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => setInvoice({ ...invoice, status: value as Invoice['status'] })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="sent">Enviada</SelectItem>
                          <SelectItem value="paid">Pagada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha de Emisión</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={invoice.date}
                        onChange={handleInvoiceChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                      <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        value={invoice.dueDate || ''}
                        onChange={handleInvoiceChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Empresa Emisora</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Seleccionar Empresa</Label>
                    <Select
                      value={invoice.companyId}
                      onValueChange={(value) => setInvoice({ ...invoice, companyId: value })}
                    >
                      <SelectTrigger id="companyId">
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="customerId">Seleccionar Cliente</Label>
                      <Select
                        value={invoice.customerId}
                        onValueChange={(value) => setInvoice({ ...invoice, customerId: value })}
                      >
                        <SelectTrigger id="customerId">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">Nuevo Cliente</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Nombre *</Label>
                              <Input
                                id="name"
                                name="name"
                                value={newCustomer.name}
                                onChange={handleCustomerChange}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="taxId">NIF/CIF *</Label>
                              <Input
                                id="taxId"
                                name="taxId"
                                value={newCustomer.taxId}
                                onChange={handleCustomerChange}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Textarea
                              id="address"
                              name="address"
                              value={newCustomer.address}
                              onChange={handleCustomerChange}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="postalCode">Código Postal</Label>
                              <Input
                                id="postalCode"
                                name="postalCode"
                                value={newCustomer.postalCode}
                                onChange={handleCustomerChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="city">Ciudad</Label>
                              <Input
                                id="city"
                                name="city"
                                value={newCustomer.city}
                                onChange={handleCustomerChange}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="province">Provincia</Label>
                              <Input
                                id="province"
                                name="province"
                                value={newCustomer.province}
                                onChange={handleCustomerChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country">País</Label>
                              <Input
                                id="country"
                                name="country"
                                value={newCustomer.country}
                                onChange={handleCustomerChange}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="phone">Teléfono</Label>
                              <Input
                                id="phone"
                                name="phone"
                                value={newCustomer.phone || ""}
                                onChange={handleCustomerChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={newCustomer.email || ""}
                                onChange={handleCustomerChange}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={addNewCustomer}>
                            Añadir Cliente
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opciones Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="globalDiscount">Descuento Global (%)</Label>
                        <Input
                          id="globalDiscount"
                          name="globalDiscount"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={invoice.globalDiscount || 0}
                          onChange={handleInvoiceChange}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Switch
                          id="equivalenceSurcharge"
                          checked={invoice.applyEquivalenceSurcharge || false}
                          onCheckedChange={(checked) =>
                            setInvoice({ ...invoice, applyEquivalenceSurcharge: checked })
                          }
                        />
                        <Label htmlFor="equivalenceSurcharge">
                          Aplicar Recargo de Equivalencia
                        </Label>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="applyWithholdingTax"
                          checked={invoice.applyWithholdingTax || false}
                          onCheckedChange={(checked) =>
                            setInvoice({ ...invoice, applyWithholdingTax: checked })
                          }
                        />
                        <Label htmlFor="applyWithholdingTax">
                          Aplicar Retención
                        </Label>
                      </div>
                      
                      {invoice.applyWithholdingTax && (
                        <div className="space-y-2">
                          <Label htmlFor="withholdingTaxRate">Porcentaje de Retención (%)</Label>
                          <Input
                            id="withholdingTaxRate"
                            name="withholdingTaxRate"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={invoice.withholdingTaxRate || 15}
                            onChange={handleInvoiceChange}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas / Observaciones</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Añade notas o comentarios que aparecerán en la factura"
                        value={invoice.notes || ""}
                        onChange={handleInvoiceChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="items" className="py-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Añadir Artículo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={currentItem.description}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={currentItem.quantity}
                          onChange={handleItemChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Precio Unitario (€)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={currentItem.price}
                          onChange={handleItemChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tax">IVA (%)</Label>
                        <Input
                          id="tax"
                          name="tax"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={currentItem.tax}
                          onChange={handleItemChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount">Descuento (%)</Label>
                        <Input
                          id="discount"
                          name="discount"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={currentItem.discount}
                          onChange={handleItemChange}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={addItem}>
                        Añadir Artículo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Artículos de la Factura</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoice.items.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-md">
                      <p className="text-gray-500">
                        No hay artículos en la factura. Añade uno utilizando el formulario superior.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="p-3 text-left font-medium">Descripción</th>
                              <th className="p-3 text-right font-medium">Cantidad</th>
                              <th className="p-3 text-right font-medium">Precio</th>
                              <th className="p-3 text-right font-medium">IVA</th>
                              <th className="p-3 text-right font-medium">Descuento</th>
                              <th className="p-3 text-right font-medium">Total</th>
                              <th className="p-3 text-right font-medium">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.items.map((item, index) => {
                              const subtotal = item.quantity * item.price;
                              const discountAmount = subtotal * (item.discount / 100);
                              const afterDiscount = subtotal - discountAmount;
                              const taxAmount = afterDiscount * (item.tax / 100);
                              const total = afterDiscount + taxAmount;
                              
                              return (
                                <tr key={item.id} className="border-t">
                                  <td className="p-3">{item.description}</td>
                                  <td className="p-3 text-right">{item.quantity}</td>
                                  <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                                  <td className="p-3 text-right">{item.tax}%</td>
                                  <td className="p-3 text-right">{item.discount}%</td>
                                  <td className="p-3 text-right font-medium">{formatCurrency(total)}</td>
                                  <td className="p-3 text-right whitespace-nowrap">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => editItem(index)}
                                      className="h-8 px-2"
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
                                      >
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                      </svg>
                                    </Button>
                                    <Button
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => removeItem(index)}
                                      className="h-8 px-2 text-red-500 hover:text-red-600"
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
                                      >
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                      </svg>
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa de Factura</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white shadow-sm border rounded-md p-8 min-h-[600px]">
                    <div className="flex justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">FACTURA</h2>
                        <p className="text-sm">Nº: <strong>{invoice.number || "[Pendiente]"}</strong></p>
                        <p className="text-sm">Fecha: <strong>{formatDate(invoice.date)}</strong></p>
                        {invoice.dueDate && (
                          <p className="text-sm">Vencimiento: <strong>{formatDate(invoice.dueDate)}</strong></p>
                        )}
                      </div>
                      
                      {/* Placeholder for company logo */}
                      <div className="w-32 h-16 bg-gray-100 flex items-center justify-center rounded">
                        <span className="text-xs text-gray-400">Logo</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-8">
                      <div>
                        <h3 className="text-gray-500 text-sm mb-2">DATOS EMISOR</h3>
                        {invoice.companyId && companies.length > 0 && (
                          <div className="text-sm space-y-1">
                            {(() => {
                              const company = companies.find(c => c.id === invoice.companyId);
                              return company ? (
                                <>
                                  <p className="font-semibold">{company.name}</p>
                                  <p>CIF/NIF: {company.taxId}</p>
                                  <p>{company.address}</p>
                                  <p>{company.postalCode} {company.city}</p>
                                  <p>{company.province}, {company.country}</p>
                                  {company.phone && <p>Tel: {company.phone}</p>}
                                  {company.email && <p>Email: {company.email}</p>}
                                </>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-gray-500 text-sm mb-2">DATOS CLIENTE</h3>
                        {invoice.customerId && customers.length > 0 && (
                          <div className="text-sm space-y-1">
                            {(() => {
                              const customer = customers.find(c => c.id === invoice.customerId);
                              return customer ? (
                                <>
                                  <p className="font-semibold">{customer.name}</p>
                                  <p>CIF/NIF: {customer.taxId}</p>
                                  <p>{customer.address}</p>
                                  <p>{customer.postalCode} {customer.city}</p>
                                  <p>{customer.province}, {customer.country}</p>
                                  {customer.phone && <p>Tel: {customer.phone}</p>}
                                  {customer.email && <p>Email: {customer.email}</p>}
                                </>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-12">
                      <h3 className="font-medium mb-2">CONCEPTOS</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2 text-left">Descripción</th>
                              <th className="p-2 text-right">Cant.</th>
                              <th className="p-2 text-right">Precio</th>
                              <th className="p-2 text-right">Dto.</th>
                              <th className="p-2 text-right">Subtotal</th>
                              <th className="p-2 text-right">IVA</th>
                              <th className="p-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.items.map((item) => {
                              const itemSubtotal = item.quantity * item.price;
                              const itemDiscountAmount = itemSubtotal * (item.discount / 100);
                              const itemAfterDiscount = itemSubtotal - itemDiscountAmount;
                              const itemTaxAmount = itemAfterDiscount * (item.tax / 100);
                              
                              return (
                                <tr key={item.id} className="border-t">
                                  <td className="p-2">{item.description}</td>
                                  <td className="p-2 text-right">{item.quantity}</td>
                                  <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                                  <td className="p-2 text-right">{item.discount > 0 ? `${item.discount}%` : "-"}</td>
                                  <td className="p-2 text-right">{formatCurrency(itemAfterDiscount)}</td>
                                  <td className="p-2 text-right">{item.tax}%</td>
                                  <td className="p-2 text-right font-medium">
                                    {formatCurrency(itemAfterDiscount + itemTaxAmount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <div className="max-w-md">
                        {invoice.notes && (
                          <div>
                            <h3 className="font-medium mb-1">OBSERVACIONES</h3>
                            <p className="text-sm whitespace-pre-wrap border p-2 rounded-md">{invoice.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="w-64 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        
                        {invoice.globalDiscount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Descuento global ({invoice.globalDiscount}%):</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-sm">
                          <span>IVA:</span>
                          <span>{formatCurrency(taxAmount)}</span>
                        </div>
                        
                        {invoice.applyEquivalenceSurcharge && (
                          <div className="flex justify-between text-sm">
                            <span>Recargo equivalencia:</span>
                            <span>{formatCurrency(equivalenceSurchargeAmount)}</span>
                          </div>
                        )}
                        
                        {invoice.applyWithholdingTax && (
                          <div className="flex justify-between text-sm">
                            <span>Retención ({invoice.withholdingTaxRate}%):</span>
                            <span>-{formatCurrency(withholdingTaxAmount)}</span>
                          </div>
                        )}
                        
                        <div className="pt-1 mt-1 border-t flex justify-between font-bold">
                          <span>TOTAL:</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
