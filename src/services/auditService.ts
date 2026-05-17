import { supabase } from '../lib/supabase';

export const registrarAuditoria = async (
  accion: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'SISTEMA',
  entidad: string,
  detalles: string
) => {
  try {
    // Usamos getSession que es más rápido y seguro en el cliente
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return;
    }

    const { error } = await supabase.from('auditorias').insert([
      {
        usuario_id: session.user.id,
        accion: accion,
        entidad: entidad,
        detalles: detalles
      }
    ]);

    // SI SUPABASE LO RECHAZA, TE SALDRÁ ESTA ALERTA
    if (error) {
      alert("Error guardando historial: " + error.message); 
    } else {
    }

  } catch (error) {
  }
};