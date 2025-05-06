
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, Suspense } from "react";
import { AuthNav } from "@/components/AuthNav";

export const AppLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className={`fixed top-0 left-0 bottom-0 w-64 border-r border-gray-200 bg-white z-40 transition-transform transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col`}>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <AuthNav />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 md:px-8 flex h-16 items-center">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 mr-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold text-invoice-dark">FacturaFácil</h1>
        </div>
        
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Suspense fallback={<div>Cargando...</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden transition-opacity duration-300 opacity-0 pointer-events-none" 
           onClick={() => setSidebarOpen(false)}
           style={{ opacity: sidebarOpen && isMobile ? 1 : 0, pointerEvents: sidebarOpen && isMobile ? 'auto' : 'none' }}></div>
    </div>
  );
};
