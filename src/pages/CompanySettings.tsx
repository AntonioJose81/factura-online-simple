import { useState, useEffect } from "react";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Palette } from "lucide-react";
import type { Company, AppearanceSettings } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvoiceAppearancePreview } from "@/components/InvoiceAppearancePreview";

// Default appearance settings
const defaultAppearance: AppearanceSettings = {
  primaryColor: "#3b82f6", // Blue color
  accentColor: "#6366f1", // Indigo color
  fontFamily: "inter",
  showLogo: true,
  colorScheme: "default",
};

export default function CompanySettings() {
  const { companies, addCompany, updateCompany, deleteCompany, exportData, importData, appearance, updateAppearance } = useInvoiceContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentAppearance, setCurrentAppearance] = useState<AppearanceSettings>(
    appearance || defaultAppearance
  );
  const [previewInvoice, setPreviewInvoice] = useState(false);

  // Load appearance settings on mount
  useEffect(() => {
    if (appearance) {
      setCurrentAppearance(appearance);
    }
  }, [appearance]);

  // Handle appearance settings changes
  const handleAppearanceChange = (field: keyof AppearanceSettings, value: any) => {
    const updatedAppearance = { ...currentAppearance, [field]: value };
    setCurrentAppearance(updatedAppearance);
  };

  // Save appearance settings
  const saveAppearanceSettings = () => {
    updateAppearance(currentAppearance);
    toast({
      title: "Apariencia actualizada",
      description: "Los cambios han sido guardados correctamente."
    });
  };

  // Import/Export functionality
  const handleExport = () => {
    const jsonData = exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facturafacil-datos-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Datos exportados",
      description: "Los datos han sido exportados correctamente."
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        if (importData(jsonData)) {
          toast({
            title: "Datos importados",
            description: "Los datos han sido importados correctamente."
          });
        } else {
          toast({
            title: "Error al importar",
            description: "Formato de archivo no válido.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error al importar",
          description: "Ha ocurrido un error al procesar el archivo.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Configuración de Empresas</h1>
        <p className="text-gray-500">Gestiona tus empresas y configuración general</p>
      </div>

      <div className="flex justify-between">
        <div className="space-x-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>Añadir Empresa</Button>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleExport}>Exportar Datos</Button>
          <Button variant="outline" asChild>
            <label>
              Importar Datos
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleImport} 
              />
            </label>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-6 pt-4">
          {companies.length === 0 ? (
            <EmptyState
              title="No hay empresas configuradas"
              description="Añade tu primera empresa para empezar a crear facturas"
              actionText="Añadir Empresa"
              actionLink="#"
              icon={
                <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <CompanyCard 
                  key={company.id} 
                  company={company}
                  onUpdate={updateCompany}
                  onDelete={deleteCompany}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="appearance" className="pt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apariencia de Facturas
              </CardTitle>
              <CardDescription>
                Personaliza el aspecto de tus facturas para adaptarlas a tu marca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Esquema de colores</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Color primario</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            id="primaryColor"
                            value={currentAppearance.primaryColor}
                            onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={currentAppearance.primaryColor}
                            onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accentColor">Color secundario</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            id="accentColor"
                            value={currentAppearance.accentColor}
                            onChange={(e) => handleAppearanceChange('accentColor', e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={currentAppearance.accentColor}
                            onChange={(e) => handleAppearanceChange('accentColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Estilo de factura</h3>
                    <RadioGroup 
                      defaultValue={currentAppearance.colorScheme}
                      onValueChange={(value) => handleAppearanceChange('colorScheme', value)}
                      className="flex flex-wrap gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="default" />
                        <Label htmlFor="default">Clásico</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="modern" id="modern" />
                        <Label htmlFor="modern">Moderno</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="minimal" id="minimal" />
                        <Label htmlFor="minimal">Minimalista</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bold" id="bold" />
                        <Label htmlFor="bold">Destacado</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Tipografía</h3>
                    <RadioGroup 
                      defaultValue={currentAppearance.fontFamily}
                      onValueChange={(value) => handleAppearanceChange('fontFamily', value)}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="inter" id="inter" />
                        <Label htmlFor="inter" className="font-['Inter']">Inter (Actual)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="poppins" id="poppins" />
                        <Label htmlFor="poppins" className="font-['Poppins']">Poppins</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="roboto" id="roboto" />
                        <Label htmlFor="roboto" className="font-['Roboto']">Roboto</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="georgia" id="georgia" />
                        <Label htmlFor="georgia" className="font-['Georgia']">Georgia</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="showLogo"
                      checked={currentAppearance.showLogo}
                      onCheckedChange={(checked) => handleAppearanceChange('showLogo', checked)}
                    />
                    <Label htmlFor="showLogo">Mostrar logo en facturas</Label>
                  </div>

                  <div className="pt-4">
                    <Button onClick={saveAppearanceSettings}>Guardar cambios</Button>
                    <Button 
                      variant="outline" 
                      className="ml-2"
                      onClick={() => setPreviewInvoice(!previewInvoice)}
                    >
                      {previewInvoice ? "Ocultar vista previa" : "Ver vista previa"}
                    </Button>
                  </div>
                </div>

                {previewInvoice && (
                  <div className="border rounded-md p-4 bg-white">
                    <h3 className="font-medium text-sm mb-3 text-gray-500">Vista previa</h3>
                    <div className="overflow-auto max-h-[500px]">
                      <InvoiceAppearancePreview appearance={currentAppearance} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddCompanyDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={addCompany}
      />
    </div>
  );
}

interface CompanyCardProps {
  company: Company;
  onUpdate: (company: Company) => void;
  onDelete: (id: string) => void;
}

function CompanyCard({ company, onUpdate, onDelete }: CompanyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState<Company>(company);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(company.logo);

  useEffect(() => {
    // Update local state when company changes
    setEditedCompany(company);
    setLogoPreview(company.logo);
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedCompany({ ...editedCompany, [name]: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Logo = event.target?.result as string;
        setLogoPreview(base64Logo);
        setEditedCompany({ ...editedCompany, logo: base64Logo });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdate(editedCompany);
    setIsEditing(false);
    toast({
      title: "Empresa actualizada",
      description: "Los datos de la empresa han sido actualizados correctamente."
    });
  };

  const handleDelete = () => {
    onDelete(company.id);
    toast({
      title: "Empresa eliminada",
      description: "La empresa ha sido eliminada correctamente."
    });
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Editar Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor={`logo-${company.id}`}>Logo</Label>
              <div className="mt-1 flex items-center">
                {logoPreview ? (
                  <div className="mb-3">
                    <img 
                      src={logoPreview} 
                      alt="Logo de la empresa" 
                      className="h-16 w-auto object-contain mb-2"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setLogoPreview(undefined);
                        setEditedCompany({ ...editedCompany, logo: undefined });
                      }}
                    >
                      Eliminar logo
                    </Button>
                  </div>
                ) : (
                  <div className="mb-3">
                    <Button variant="outline" asChild>
                      <label htmlFor={`logo-${company.id}`}>
                        Subir logo
                        <input 
                          id={`logo-${company.id}`}
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleLogoChange} 
                        />
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor={`name-${company.id}`}>Nombre</Label>
              <Input 
                id={`name-${company.id}`}
                name="name" 
                value={editedCompany.name} 
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <Label htmlFor={`taxId-${company.id}`}>NIF/CIF</Label>
              <Input 
                id={`taxId-${company.id}`}
                name="taxId" 
                value={editedCompany.taxId} 
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <Label htmlFor={`address-${company.id}`}>Dirección</Label>
              <Textarea 
                id={`address-${company.id}`}
                name="address" 
                value={editedCompany.address} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`postalCode-${company.id}`}>Código Postal</Label>
                <Input 
                  id={`postalCode-${company.id}`}
                  name="postalCode" 
                  value={editedCompany.postalCode} 
                  onChange={handleChange} 
                />
              </div>
              
              <div>
                <Label htmlFor={`city-${company.id}`}>Ciudad</Label>
                <Input 
                  id={`city-${company.id}`}
                  name="city" 
                  value={editedCompany.city} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`province-${company.id}`}>Provincia</Label>
                <Input 
                  id={`province-${company.id}`}
                  name="province" 
                  value={editedCompany.province} 
                  onChange={handleChange} 
                />
              </div>
              
              <div>
                <Label htmlFor={`country-${company.id}`}>País</Label>
                <Input 
                  id={`country-${company.id}`}
                  name="country" 
                  value={editedCompany.country} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`phone-${company.id}`}>Teléfono</Label>
                <Input 
                  id={`phone-${company.id}`}
                  name="phone" 
                  value={editedCompany.phone || ''} 
                  onChange={handleChange} 
                />
              </div>
              
              <div>
                <Label htmlFor={`email-${company.id}`}>Email</Label>
                <Input 
                  id={`email-${company.id}`}
                  name="email" 
                  value={editedCompany.email || ''} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{company.name}</CardTitle>
            <CardDescription>CIF/NIF: {company.taxId}</CardDescription>
          </div>
          {company.logo && (
            <div className="h-10 w-10 relative">
              <img 
                src={company.logo} 
                alt={`Logo de ${company.name}`} 
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <p>{company.address}</p>
          <p>{company.postalCode} {company.city}</p>
          <p>{company.province}, {company.country}</p>
          {company.phone && <p>Tel: {company.phone}</p>}
          {company.email && <p>Email: {company.email}</p>}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (company: Omit<Company, "id">) => void;
}

function AddCompanyDialog({ isOpen, onClose, onAdd }: AddCompanyDialogProps) {
  const [newCompany, setNewCompany] = useState<Omit<Company, "id">>({
    name: "",
    taxId: "",
    address: "",
    postalCode: "",
    city: "",
    province: "",
    country: "España",
    phone: "",
    email: "",
  });
  
  const [logoPreview, setLogoPreview] = useState<string | undefined>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCompany({ ...newCompany, [name]: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Logo = event.target?.result as string;
        setLogoPreview(base64Logo);
        setNewCompany({ ...newCompany, logo: base64Logo });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCompany = () => {
    if (!newCompany.name || !newCompany.taxId) {
      toast({
        title: "Datos incompletos",
        description: "El nombre y NIF/CIF son obligatorios.",
        variant: "destructive"
      });
      return;
    }

    onAdd(newCompany);
    onClose();
    
    // Reset form
    setNewCompany({
      name: "",
      taxId: "",
      address: "",
      postalCode: "",
      city: "",
      province: "",
      country: "España",
      phone: "",
      email: "",
    });
    setLogoPreview(undefined);
    
    toast({
      title: "Empresa añadida",
      description: "La empresa ha sido añadida correctamente."
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Empresa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="logo">Logo</Label>
            <div className="mt-1">
              {logoPreview ? (
                <div className="mb-3">
                  <img 
                    src={logoPreview} 
                    alt="Logo de la empresa" 
                    className="h-16 w-auto object-contain mb-2"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setLogoPreview(undefined);
                      setNewCompany({ ...newCompany, logo: undefined });
                    }}
                  >
                    Eliminar logo
                  </Button>
                </div>
              ) : (
                <div className="mb-3">
                  <Button variant="outline" asChild>
                    <label htmlFor="logo">
                      Subir logo
                      <input 
                        id="logo"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoChange} 
                      />
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input 
              id="name"
              name="name" 
              value={newCompany.name} 
              onChange={handleChange} 
              required
            />
          </div>
          
          <div>
            <Label htmlFor="taxId">NIF/CIF *</Label>
            <Input 
              id="taxId"
              name="taxId" 
              value={newCompany.taxId} 
              onChange={handleChange} 
              required
            />
          </div>
          
          <div>
            <Label htmlFor="address">Dirección</Label>
            <Textarea 
              id="address"
              name="address" 
              value={newCompany.address} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input 
                id="postalCode"
                name="postalCode" 
                value={newCompany.postalCode} 
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input 
                id="city"
                name="city" 
                value={newCompany.city} 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input 
                id="province"
                name="province" 
                value={newCompany.province} 
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <Label htmlFor="country">País</Label>
              <Input 
                id="country"
                name="country" 
                value={newCompany.country} 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input 
                id="phone"
                name="phone" 
                value={newCompany.phone} 
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email" 
                type="email"
                value={newCompany.email} 
                onChange={handleChange} 
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAddCompany}>
            Añadir Empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
