import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

export const seedBasicData = async () => {
  if (!navigator.onLine) return;

  // Traer categorías para los selectores del formulario
  const { data: categorias, error } = await supabase
    .from('categorias')
    .select('*');

  if (categorias && !error) {
    await db.categorias.bulkPut(categorias);
    console.log('Categorías sincronizadas localmente');
  }
};