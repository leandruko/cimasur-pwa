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
  window.location.href = '/login';
};