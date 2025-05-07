
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Si todavía está comprobando la autenticación, mostrar un indicador de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Si no hay usuario autenticado, redirigir a la página de autenticación
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Si hay un usuario autenticado, renderizar la ruta protegida
  return <Outlet />;
}
