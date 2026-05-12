import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
        } else {
          // Consultamos el perfil para ver si es 'Administrador'
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('cargo')
            .eq('id', user.id)
            .single();

          // Comparamos en minúsculas y damos pase libre a tu email de admin
          const esAdmin = perfil?.cargo?.toLowerCase().trim() === 'administrador';

          setIsAdmin(perfil?.cargo?.toLowerCase().trim() === 'administrador');
        }
      } catch (e) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  return { isAdmin, loading };
};