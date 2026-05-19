// src/pages/api/create-user.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Validar que la petición contenga datos
    const body = await request.json();
    const { email, password, nombre } = body;

    if (!email || !password || !nombre) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios" }), { status: 400 });
    }

    // 2. Inicializar el cliente Supabase con la SERVICE ROLE KEY
    // IMPORTANTE: Esta clave tiene privilegios administrativos para saltarse el RLS
    // y crear usuarios sin iniciar sesión en el cliente.
    const supabaseAdmin = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY, // Debe estar en tu archivo .env
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false // Evita interferir con sesiones existentes
        }
      }
    );

    // 3. Crear el usuario de forma segura en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirmar el correo para acceso inmediato
      user_metadata: {
        nombre_completo: nombre,
        cargo: 'Trabajador' // Asignado firmemente en el servidor (Inmutable por el cliente)
      }
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
    }

    // Nota: Si tu base de datos utiliza un Trigger (función SQL) para insertar la fila en
    // la tabla 'perfiles' tras la creación en Auth, el proceso termina aquí exitosamente.
    
    return new Response(JSON.stringify({ success: true, user: authData.user }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Error interno del servidor" }), { status: 500 });
  }
};