
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceList from "./pages/InvoiceList";
import CompanySettings from "./pages/CompanySettings";
import NotFound from "./pages/NotFound";
import { InvoiceProvider } from "./contexts/InvoiceContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InvoiceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="facturas" element={<InvoiceList />} />
              <Route path="facturas/nueva" element={<InvoiceForm />} />
              <Route path="facturas/:id" element={<InvoiceForm />} />
              <Route path="empresas" element={<CompanySettings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </InvoiceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
