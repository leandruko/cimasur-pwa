import React, { useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Loader2, ShieldAlert } from 'lucide-react';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && isAdmin === false) {
      // Si no es admin, lo redirigimos tras 3 segundos o inmediatamente
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-slate-500 font-bold animate-pulse">VERIFICANDO CREDENCIALES...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="bg-red-500/10 p-6 rounded-full mb-6">
          <ShieldAlert className="text-red-500" size={50} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic">Acceso Denegado</h2>
        <p className="text-slate-500 mt-2 max-w-xs">
          No tienes permisos de administrador para ver esta sección. Serás redirigido al inicio...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};