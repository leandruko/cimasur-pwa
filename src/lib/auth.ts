import { supabase } from './supabase';

export const login = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  
  if (error) throw error;
  return data;
};

export const logout = async () => {
  await supabase.auth.signOut();
  // CORRECCIÓN: Forzar la eliminación de las cookies de SSR
  document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; secure; SameSite=Lax";
  document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; secure; SameSite=Lax";
  window.location.href = '/login';
};