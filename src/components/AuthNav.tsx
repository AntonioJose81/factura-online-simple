
import { useAuth } from "@/contexts/AuthContext";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function AuthNav() {
  const { user, signOut } = useAuth();
  const { syncWithSupabase } = useInvoiceContext();
  
  const handleSync = async () => {
    try {
      await syncWithSupabase();
      toast({
        title: "Sincronización iniciada",
        description: "Tus datos se están sincronizando con la nube..."
      });
    } catch (error) {
      console.error("Error al sincronizar:", error);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  if (!user) {
    return (
      <div className="p-4 border-t border-gray-200 mt-auto">
        <Link to="/auth">
          <Button variant="default" className="w-full">
            Iniciar Sesión
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-4 border-t border-gray-200 mt-auto space-y-3">
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar" 
              className="h-10 w-10 rounded-full" 
            />
          ) : (
            <span className="text-xl font-medium text-gray-600">
              {user.email?.[0].toUpperCase() || "U"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.user_metadata?.full_name || user.email}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full mb-2"
        onClick={handleSync}
      >
        Sincronizar Datos
      </Button>
      
      <Button 
        variant="ghost" 
        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={handleSignOut}
      >
        Cerrar Sesión
      </Button>
    </div>
  );
}
