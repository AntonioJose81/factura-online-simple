
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Company, Customer, Invoice } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { exportToJson, exportToXml } from '@/utils/exporters';

type InvoiceContextType = {
  companies: Company[];
  customers: Customer[];
  invoices: Invoice[];
  addCompany: (company: Omit<Company, 'id'>) => Company;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (customer: Customer) => Customer;
  deleteCustomer: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoice: (invoice: Invoice) => void;
  getInvoice: (id: string) => Invoice | undefined;
  getCompany: (id: string) => Company | undefined;
  getCustomer: (id: string) => Customer | undefined;
  deleteInvoice: (id: string) => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

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
    };

    loadInitialData();
  }, []);

  const addCompany = (company: Omit<Company, 'id'>): Company => {
    const newCompany = {
      ...company,
      id: uuidv4()
    };

    const updatedCompanies = [...companies, newCompany];
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));

    return newCompany;
  };

  const updateCompany = (company: Company) => {
    const updatedCompanies = companies.map(c =>
      c.id === company.id ? company : c
    );
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));
  };

  const deleteCompany = (id: string) => {
    // Check if the company is used in any invoice
    const isCompanyUsed = invoices.some(invoice => invoice.companyId === id);
    if (isCompanyUsed) {
      throw new Error("No se puede eliminar una empresa que tiene facturas asociadas");
    }

    // If not used, delete the company
    const updatedCompanies = companies.filter(company => company.id !== id);
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));
  };

  const addCustomer = (customer: Omit<Customer, 'id'>): Customer => {
    const newCustomer = {
      ...customer,
      id: uuidv4()
    };
    
    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    return newCustomer;
  };
  
  const updateCustomer = (customer: Customer): Customer => {
    const updatedCustomers = customers.map(c => 
      c.id === customer.id ? customer : c
    );
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    return customer;
  };
  
  const deleteCustomer = (id: string): void => {
    // Check if the customer is used in any invoice
    const isCustomerUsed = invoices.some(invoice => invoice.customerId === id);
    if (isCustomerUsed) {
      throw new Error("No se puede eliminar un cliente que tiene facturas asociadas");
    }
    
    // If not used, delete the customer
    const updatedCustomers = customers.filter(customer => customer.id !== id);
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
  };

  const addInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const newInvoice = {
      ...invoice,
      id: uuidv4()
    };

    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
  };

  const updateInvoice = (invoice: Invoice) => {
    const updatedInvoices = invoices.map(i =>
      i.id === invoice.id ? invoice : i
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
  };

  const getInvoice = (id: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.id === id);
  };

  // Añadir los nuevos métodos necesarios
  const getCompany = (id: string): Company | undefined => {
    return companies.find(company => company.id === id);
  };

  const getCustomer = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const deleteInvoice = (id: string): void => {
    const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
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

  const importData = (jsonData: string): boolean => {
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
      
      return true;
    } catch (error) {
      console.error("Error al importar datos:", error);
      return false;
    }
  };

  const value = {
    companies,
    customers,
    invoices,
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
    importData
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
