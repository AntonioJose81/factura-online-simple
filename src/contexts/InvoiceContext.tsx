
import { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Company, Customer, Invoice, InvoiceItem } from "@/types";
import { toast } from "@/hooks/use-toast";

interface InvoiceContextType {
  companies: Company[];
  invoices: Invoice[];
  customers: Customer[];
  getCompany: (id: string) => Company | undefined;
  getCustomer: (id: string) => Customer | undefined;
  getInvoice: (id: string) => Invoice | undefined;
  addCompany: (company: Omit<Company, "id">) => Company;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;
  addCustomer: (customer: Omit<Customer, "id">) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, "id">) => Invoice;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCompanies = localStorage.getItem("companies");
    const savedInvoices = localStorage.getItem("invoices");
    const savedCustomers = localStorage.getItem("customers");

    if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("companies", JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem("invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers));
  }, [customers]);

  const getCompany = (id: string) => companies.find(c => c.id === id);
  const getCustomer = (id: string) => customers.find(c => c.id === id);
  const getInvoice = (id: string) => invoices.find(i => i.id === id);

  const addCompany = (company: Omit<Company, "id">) => {
    const newCompany = { ...company, id: uuidv4() };
    setCompanies([...companies, newCompany]);
    return newCompany;
  };

  const updateCompany = (company: Company) => {
    setCompanies(companies.map(c => c.id === company.id ? company : c));
  };

  const deleteCompany = (id: string) => {
    // Check if any invoices are using this company
    const usedInInvoice = invoices.some(i => i.companyId === id);
    if (usedInInvoice) {
      toast({
        title: "No se puede eliminar la empresa",
        description: "Esta empresa está siendo utilizada en facturas existentes",
        variant: "destructive"
      });
      return;
    }
    setCompanies(companies.filter(c => c.id !== id));
  };

  const addCustomer = (customer: Omit<Customer, "id">) => {
    const newCustomer = { ...customer, id: uuidv4() };
    setCustomers([...customers, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (customer: Customer) => {
    setCustomers(customers.map(c => c.id === customer.id ? customer : c));
  };

  const deleteCustomer = (id: string) => {
    // Check if any invoices are using this customer
    const usedInInvoice = invoices.some(i => i.customerId === id);
    if (usedInInvoice) {
      toast({
        title: "No se puede eliminar el cliente",
        description: "Este cliente está siendo utilizado en facturas existentes",
        variant: "destructive"
      });
      return;
    }
    setCustomers(customers.filter(c => c.id !== id));
  };

  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    const newInvoice = { ...invoice, id: uuidv4() };
    setInvoices([...invoices, newInvoice]);
    return newInvoice;
  };

  const updateInvoice = (invoice: Invoice) => {
    setInvoices(invoices.map(i => i.id === invoice.id ? invoice : i));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter(i => i.id !== id));
  };

  const exportData = () => {
    return JSON.stringify({ companies, invoices, customers });
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.companies && Array.isArray(data.companies)) {
        setCompanies(data.companies);
      }
      
      if (data.invoices && Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      }
      
      if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
      
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  };

  return (
    <InvoiceContext.Provider
      value={{
        companies,
        invoices,
        customers,
        getCompany,
        getCustomer,
        getInvoice,
        addCompany,
        updateCompany,
        deleteCompany,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        exportData,
        importData
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoiceContext() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error("useInvoiceContext must be used within an InvoiceProvider");
  }
  return context;
}
