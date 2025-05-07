import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Company, Customer, Invoice, AppearanceSettings } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { exportToJson, exportToXml } from '@/utils/exporters';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

// Default appearance settings
const defaultAppearance: AppearanceSettings = {
  primaryColor: "#3b82f6", // Blue color
  accentColor: "#6366f1", // Indigo color
  fontFamily: "inter",
  showLogo: true,
  colorScheme: "default",
};

type InvoiceContextType = {
  companies: Company[];
  customers: Customer[];
  invoices: Invoice[];
  appearance: AppearanceSettings;
  addCompany: (company: Omit<Company, 'id'>) => Promise<Company>;
  updateCompany: (company: Company) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  getCompany: (id: string) => Company | undefined;
  getCustomer: (id: string) => Customer | undefined;
  deleteInvoice: (id: string) => Promise<void>;
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;
  updateAppearance: (settings: AppearanceSettings) => void;
  syncWithSupabase: () => Promise<void>;
  loading: boolean;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Cargar datos desde localStorage inicialmente
  useEffect(() => {
    const loadInitialData = () => {
      const storedCompanies = localStorage.getItem('companies');
      if (storedCompanies) {
        setCompanies(JSON.parse(storedCompanies));
      }

      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      }

      const storedInvoices = localStorage.getItem('invoices');
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      }
      
      // Load appearance settings
      const storedAppearance = localStorage.getItem('appearance');
      if (storedAppearance) {
        setAppearance(JSON.parse(storedAppearance));
      }

      setLoading(false);
    };

    loadInitialData();
  }, []);

  // Cargar datos desde Supabase cuando el usuario inicia sesión
  useEffect(() => {
    if (user) {
      fetchDataFromSupabase();
    }
  }, [user]);

  const fetchDataFromSupabase = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Cargar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id);
      
      if (companiesError) throw companiesError;
      
      if (companiesData) {
        const formattedCompanies = companiesData.map(company => ({
          id: company.id,
          name: company.name,
          taxId: company.tax_id,
          address: company.address,
          postalCode: company.postal_code,
          city: company.city,
          province: company.province,
          country: company.country,
          phone: company.phone,
          email: company.email,
          logo: company.logo
        }));
        
        setCompanies(formattedCompanies);
        localStorage.setItem('companies', JSON.stringify(formattedCompanies));
      }
      
      // Cargar clientes
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);
      
      if (customersError) throw customersError;
      
      if (customersData) {
        const formattedCustomers = customersData.map(customer => ({
          id: customer.id,
          name: customer.name,
          taxId: customer.tax_id,
          address: customer.address,
          postalCode: customer.postal_code,
          city: customer.city,
          province: customer.province,
          country: customer.country,
          phone: customer.phone,
          email: customer.email
        }));
        
        setCustomers(formattedCustomers);
        localStorage.setItem('customers', JSON.stringify(formattedCustomers));
      }
      
      // Cargar facturas
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('user_id', user.id);
      
      if (invoicesError) throw invoicesError;
      
      if (invoicesData) {
        const formattedInvoices = invoicesData.map(invoice => {
          const items = invoice.invoice_items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            price: Number(item.price),
            tax: Number(item.tax),
            discount: Number(item.discount)
          }));
          
          // Aseguramos que el status sea uno de los valores permitidos
          const status = ['draft', 'sent', 'paid', 'cancelled'].includes(invoice.status) 
            ? invoice.status as "draft" | "sent" | "paid" | "cancelled" 
            : "draft";
          
          return {
            id: invoice.id,
            number: invoice.number,
            date: invoice.date,
            dueDate: invoice.due_date,
            companyId: invoice.company_id,
            customerId: invoice.customer_id,
            items,
            notes: invoice.notes,
            status: status,
            globalDiscount: invoice.global_discount ? Number(invoice.global_discount) : 0,
            applyEquivalenceSurcharge: invoice.apply_equivalence_surcharge || false,
            applyWithholdingTax: invoice.apply_withholding_tax || false,
            withholdingTaxRate: invoice.withholding_tax_rate ? Number(invoice.withholding_tax_rate) : 0
          };
        });
        
        setInvoices(formattedInvoices);
        localStorage.setItem('invoices', JSON.stringify(formattedInvoices));
      }
    } catch (error) {
      console.error('Error al cargar datos desde Supabase:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos desde el servidor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithSupabase = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para sincronizar datos',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Sincronizar empresas
      for (const company of companies) {
        const { error } = await supabase
          .from('companies')
          .upsert({
            id: company.id,
            user_id: user.id,
            name: company.name,
            tax_id: company.taxId,
            address: company.address,
            postal_code: company.postalCode,
            city: company.city,
            province: company.province,
            country: company.country,
            phone: company.phone,
            email: company.email,
            logo: company.logo
          });
          
        if (error) throw error;
      }
      
      // Sincronizar clientes
      for (const customer of customers) {
        const { error } = await supabase
          .from('customers')
          .upsert({
            id: customer.id,
            user_id: user.id,
            name: customer.name,
            tax_id: customer.taxId,
            address: customer.address,
            postal_code: customer.postalCode,
            city: customer.city,
            province: customer.province,
            country: customer.country,
            phone: customer.phone,
            email: customer.email
          });
          
        if (error) throw error;
      }
      
      // Sincronizar facturas e ítems
      for (const invoice of invoices) {
        // Insertar o actualizar factura
        const { error: invoiceError } = await supabase
          .from('invoices')
          .upsert({
            id: invoice.id,
            user_id: user.id,
            number: invoice.number,
            date: invoice.date,
            due_date: invoice.dueDate,
            company_id: invoice.companyId,
            customer_id: invoice.customerId,
            notes: invoice.notes,
            status: invoice.status,
            global_discount: invoice.globalDiscount,
            apply_equivalence_surcharge: invoice.applyEquivalenceSurcharge,
            apply_withholding_tax: invoice.applyWithholdingTax,
            withholding_tax_rate: invoice.withholdingTaxRate
          });
          
        if (invoiceError) throw invoiceError;
        
        // Primero eliminar los ítems existentes para evitar duplicados
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoice.id);
          
        if (deleteError) throw deleteError;
        
        // Insertar los ítems actualizados
        if (invoice.items && invoice.items.length > 0) {
          const itemsToInsert = invoice.items.map(item => ({
            id: item.id || uuidv4(),
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax,
            discount: item.discount
          }));
          
          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);
            
          if (itemsError) throw itemsError;
        }
      }
      
      toast({
        title: 'Sincronización completada',
        description: 'Todos los datos han sido sincronizados correctamente'
      });
      
      // Actualizar los datos después de la sincronización
      await fetchDataFromSupabase();
    } catch (error: any) {
      console.error('Error al sincronizar con Supabase:', error);
      toast({
        title: 'Error de sincronización',
        description: error.message || 'No se pudieron sincronizar los datos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addCompany = async (company: Omit<Company, 'id'>): Promise<Company> => {
    const newCompany = {
      ...company,
      id: uuidv4()
    };

    const updatedCompanies = [...companies, newCompany];
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));

    // Si el usuario está autenticado, guardar en Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('companies')
          .insert({
            id: newCompany.id,
            user_id: user.id,
            name: newCompany.name,
            tax_id: newCompany.taxId,
            address: newCompany.address,
            postal_code: newCompany.postalCode,
            city: newCompany.city,
            province: newCompany.province,
            country: newCompany.country,
            phone: newCompany.phone,
            email: newCompany.email,
            logo: newCompany.logo
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error al guardar empresa en Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo guardar la empresa en el servidor',
          variant: 'destructive'
        });
      }
    }

    return newCompany;
  };

  const updateCompany = async (company: Company) => {
    const updatedCompanies = companies.map(c =>
      c.id === company.id ? company : c
    );
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));

    // Si el usuario está autenticado, actualizar en Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('companies')
          .update({
            name: company.name,
            tax_id: company.taxId,
            address: company.address,
            postal_code: company.postalCode,
            city: company.city,
            province: company.province,
            country: company.country,
            phone: company.phone,
            email: company.email,
            logo: company.logo
          })
          .eq('id', company.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error al actualizar empresa en Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la empresa en el servidor',
          variant: 'destructive'
        });
      }
    }
  };

  const deleteCompany = async (id: string) => {
    // Check if the company is used in any invoice
    const isCompanyUsed = invoices.some(invoice => invoice.companyId === id);
    if (isCompanyUsed) {
      throw new Error("No se puede eliminar una empresa que tiene facturas asociadas");
    }

    // If not used, delete the company
    const updatedCompanies = companies.filter(company => company.id !== id);
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));

    // Si el usuario está autenticado, eliminar de Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error al eliminar empresa de Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la empresa del servidor',
          variant: 'destructive'
        });
      }
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const newCustomer = {
      ...customer,
      id: uuidv4()
    };
    
    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Si el usuario está autenticado, guardar en Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('customers')
          .insert({
            id: newCustomer.id,
            user_id: user.id,
            name: newCustomer.name,
            tax_id: newCustomer.taxId,
            address: newCustomer.address,
            postal_code: newCustomer.postalCode,
            city: newCustomer.city,
            province: newCustomer.province,
            country: newCustomer.country,
            phone: newCustomer.phone,
            email: newCustomer.email
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error al guardar cliente en Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo guardar el cliente en el servidor',
          variant: 'destructive'
        });
      }
    }
    
    return newCustomer;
  };
  
  const updateCustomer = async (customer: Customer): Promise<Customer> => {
    const updatedCustomers = customers.map(c => 
      c.id === customer.id ? customer : c
    );
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Si el usuario está autenticado, actualizar en Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('customers')
          .update({
            name: customer.name,
            tax_id: customer.taxId,
            address: customer.address,
            postal_code: customer.postalCode,
            city: customer.city,
            province: customer.province,
            country: customer.country,
            phone: customer.phone,
            email: customer.email
          })
          .eq('id', customer.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error al actualizar cliente en Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el cliente en el servidor',
          variant: 'destructive'
        });
      }
    }
    
    return customer;
  };
  
  const deleteCustomer = async (id: string): Promise<void> => {
    // Check if the customer is used in any invoice
    const isCustomerUsed = invoices.some(invoice => invoice.customerId === id);
    if (isCustomerUsed) {
      throw new Error("No se puede eliminar un cliente que tiene facturas asociadas");
    }
    
    // If not used, delete the customer
    const updatedCustomers = customers.filter(customer => customer.id !== id);
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Si el usuario está autenticado, eliminar de Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error al eliminar cliente de Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el cliente del servidor',
          variant: 'destructive'
        });
      }
    }
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    const newInvoice = {
      ...invoice,
      id: uuidv4()
    };

    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    // Si el usuario está autenticado, guardar en Supabase
    if (user) {
      try {
        // Primero insertar la factura
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            id: newInvoice.id,
            user_id: user.id,
            number: newInvoice.number,
            date: newInvoice.date,
            due_date: newInvoice.dueDate,
            company_id: newInvoice.companyId,
            customer_id: newInvoice.customerId,
            notes: newInvoice.notes,
            status: newInvoice.status,
            global_discount: newInvoice.globalDiscount,
            apply_equivalence_surcharge: newInvoice.applyEquivalenceSurcharge,
            apply_withholding_tax: newInvoice.applyWithholdingTax,
            withholding_tax_rate: newInvoice.withholdingTaxRate
          });

        if (invoiceError) throw invoiceError;

        // Luego insertar los ítems de la factura
        if (newInvoice.items && newInvoice.items.length > 0) {
          const itemsToInsert = newInvoice.items.map(item => ({
            id: item.id || uuidv4(),
            invoice_id: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax,
            discount: item.discount
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      } catch (error) {
        console.error('Error al guardar factura en Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo guardar la factura en el servidor',
          variant: 'destructive'
        });
      }
    }
  };

  const updateInvoice = async (invoice: Invoice) => {
    const updatedInvoices = invoices.map(i =>
      i.id === invoice.id ? invoice : i
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    // Si el usuario está autenticado, actualizar en Supabase
    if (user) {
      try {
        // Primero actualizar la factura
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            number: invoice.number,
            date: invoice.date,
            due_date: invoice.dueDate,
            company_id: invoice.companyId,
            customer_id: invoice.customerId,
            notes: invoice.notes,
            status: invoice.status,
            global_discount: invoice.globalDiscount,
            apply_equivalence_surcharge: invoice.applyEquivalenceSurcharge,
            apply_withholding_tax: invoice.applyWithholdingTax,
            withholding_tax_rate: invoice.withholdingTaxRate
          })
          .eq('id', invoice.id)
          .eq('user_id', user.id);

        if (invoiceError) throw invoiceError;

        // Eliminar los ítems existentes
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoice.id);

        if (deleteError) throw deleteError;

        // Insertar los ítems actualizados
        if (invoice.items && invoice.items.length > 0) {
          const itemsToInsert = invoice.items.map(item => ({
            id: item.id || uuidv4(),
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax,
            discount: item.discount
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      } catch (error) {
        console.error('Error al actualizar factura en Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la factura en el servidor',
          variant: 'destructive'
        });
      }
    }
  };

  const getInvoice = (id: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.id === id);
  };

  const getCompany = (id: string): Company | undefined => {
    return companies.find(company => company.id === id);
  };

  const getCustomer = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    // Si el usuario está autenticado, eliminar de Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Los ítems se eliminarán automáticamente por la restricción de ON DELETE CASCADE
      } catch (error) {
        console.error('Error al eliminar factura de Supabase:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la factura del servidor',
          variant: 'destructive'
        });
      }
    }
  };

  // Funciones para exportación e importación de datos
  const exportData = (): string => {
    const data = {
      companies,
      customers,
      invoices
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      
      // Verificar que el JSON tenga la estructura esperada
      if (!data.companies || !data.customers || !data.invoices) {
        return false;
      }
      
      // Importar los datos
      setCompanies(data.companies);
      localStorage.setItem('companies', JSON.stringify(data.companies));
      
      setCustomers(data.customers);
      localStorage.setItem('customers', JSON.stringify(data.customers));
      
      setInvoices(data.invoices);
      localStorage.setItem('invoices', JSON.stringify(data.invoices));

      // Si el usuario está autenticado, sincronizar con Supabase
      if (user) {
        await syncWithSupabase();
      }
      
      return true;
    } catch (error) {
      console.error("Error al importar datos:", error);
      return false;
    }
  };

  const updateAppearance = (settings: AppearanceSettings) => {
    setAppearance(settings);
    localStorage.setItem('appearance', JSON.stringify(settings));
  };

  const value = {
    companies,
    customers,
    invoices,
    appearance,
    addCompany,
    updateCompany,
    deleteCompany,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addInvoice,
    updateInvoice,
    getInvoice,
    getCompany,
    getCustomer,
    deleteInvoice,
    exportData,
    importData,
    updateAppearance,
    syncWithSupabase,
    loading
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
}

export const useInvoiceContext = (): InvoiceContextType => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider');
  }
  return context;
};
