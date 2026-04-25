import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  // Solo protegemos rutas que empiecen con /dashboard o /admin
  const isProtected = context.url.pathname.startsWith('/dashboard') || 
                      context.url.pathname.startsWith('/admin');

  if (isProtected) {
    // Verificamos la sesión en el servidor
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return context.redirect('/login');
    }
  }

  return next();
});