// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // 1. Definir rutas que requieren protección
  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  const isAdminRoute = url.pathname.startsWith("/dashboard/administrador");

  // 2. Si no es una ruta del dashboard, seguimos normal
  if (!isDashboardRoute) {
    return next();
  }

  // 3. Verificar sesión con Supabase
  // Buscamos el token en las cookies (Astro las maneja automáticamente)
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return redirect("/login");
  }

  // 4. Validar la sesión activa
  const { data: { session }, error } = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
  });

  if (error || !session) {
    // Si el token expiró o es inválido, limpiamos y mandamos al login
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });
    return redirect("/login");
  }

  // 5. Protección adicional para rutas de ADMIN
  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from("perfiles")
      .select("cargo")
      .eq("id", session.user.id)
      .single();

    if (profile?.cargo !== "administrador") {
      return redirect("/dashboard"); // Usuario normal intentando entrar a admin
    }
  }

  // Si todo está bien, permitimos el paso a la página
  return next();
});