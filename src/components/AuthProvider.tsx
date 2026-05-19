import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // 1. Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) window.location.href = '/login';
    });

    // 2. Escuchar cambios (por ejemplo, si expira la sesión)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) window.location.href = '/login';
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-mono">Verificando Credenciales...</div>;

  return session ? <>{children}</> : null;
};