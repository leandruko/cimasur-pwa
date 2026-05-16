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
      console.error("Auditoría: No hay usuario logueado.");
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
      console.error("Supabase rechazó la auditoría:", error);
      alert("Error guardando historial: " + error.message); 
    } else {
      console.log(`✅ Acción ${accion} registrada exitosamente.`);
    }

  } catch (error) {
    console.error("Error al registrar auditoría:", error);
  }
};