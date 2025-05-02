
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Customer } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { exportToJson, exportToXml } from "@/utils/exporters";

export default function ClientList() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useInvoiceContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Customer, "id">>({
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

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.taxId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
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
    setIsEditMode(false);
    setCurrentCustomerId(null);
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setFormData({
        name: customer.name,
        taxId: customer.taxId,
        address: customer.address,
        postalCode: customer.postalCode,
        city: customer.city,
        province: customer.province,
        country: customer.country,
        phone: customer.phone || "",
        email: customer.email || ""
      });
      setIsEditMode(true);
      setCurrentCustomerId(customer.id);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.taxId) {
      toast({
        title: "Error",
        description: "Nombre y NIF/CIF son obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (isEditMode && currentCustomerId) {
      updateCustomer({ ...formData, id: currentCustomerId });
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados"
      });
    } else {
      addCustomer(formData);
      toast({
        title: "Cliente añadido",
        description: "El cliente ha sido añadido correctamente"
      });
    }

    handleCloseDialog();
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      deleteCustomer(id);
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente"
      });
    }
  };

  const exportCustomers = (format: 'json' | 'xml') => {
    try {
      if (format === 'json') {
        exportToJson(customers, 'clientes');
      } else {
        exportToXml(customers, 'clientes');
      }
      toast({
        title: `Exportación ${format.toUpperCase()} completada`,
        description: `Los datos han sido exportados en formato ${format.toUpperCase()}`
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gestiona tus clientes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">NIF/CIF *</Label>
                    <Input
                      id="taxId"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">Provincia</Label>
                    <Input
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {isEditMode ? "Actualizar" : "Añadir"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={() => exportCustomers('json')} 
              variant="outline" 
              size="sm"
            >
              Exportar JSON
            </Button>
            <Button 
              onClick={() => exportCustomers('xml')} 
              variant="outline" 
              size="sm"
            >
              Exportar XML
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por nombre o CIF/NIF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-md">
              <p className="text-gray-500">
                No hay clientes que coincidan con tu búsqueda
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left font-medium">Nombre</th>
                      <th className="p-3 text-left font-medium">CIF/NIF</th>
                      <th className="p-3 text-left font-medium">Ciudad</th>
                      <th className="p-3 text-left font-medium">Teléfono</th>
                      <th className="p-3 text-left font-medium">Email</th>
                      <th className="p-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-t">
                        <td className="p-3">{customer.name}</td>
                        <td className="p-3">{customer.taxId}</td>
                        <td className="p-3">{customer.city}</td>
                        <td className="p-3">{customer.phone || "-"}</td>
                        <td className="p-3">{customer.email || "-"}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenDialog(customer)}
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
                            onClick={() => handleDeleteCustomer(customer.id)}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
