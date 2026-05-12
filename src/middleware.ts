import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // 1. Identificamos las rutas clave
  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  const isAdminRoute = url.pathname.startsWith("/dashboard/admin");

  // Si no es una ruta protegida del dashboard, dejamos pasar libremente
  if (!isDashboardRoute) {
    return next();
  }

  // 2. Extraemos los tokens de las cookies del servidor
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return redirect("/login");
  }

  // 3. Validamos la autenticación real con Supabase
  const { data: { session }, error } = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
  });

  // Si el token expiró o es inválido, destruimos las cookies y mandamos al login
  if (error || !session) {
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });
    return redirect("/login");
  }

  // 4. 🛡️ PROTECCIÓN ESTRICTA DE LA RUTA DE ADMINISTRACIÓN
  if (isAdminRoute) {
    // Consultamos el cargo del usuario autenticado
    const { data: profile } = await supabase
      .from("perfiles")
      .select("cargo")
      .eq("id", session.user.id)
      .single();

    // NORMALIZACIÓN CRÍTICA: Convertimos a minúsculas y quitamos espacios
    // Esto evita que te bloquee si en la base de datos dice "Administrador" o "administrador "
    const cargoLimpio = profile?.cargo?.toLowerCase().trim();

    // Verificación final sin correos hardcodeados
    if (cargoLimpio !== "administrador") {
      console.log(`Acceso denegado a ruta admin para rol: "${profile?.cargo}"`);
      return redirect("/dashboard"); // Lo devolvemos a su panel de trabajador normal
    }
  }

  // Si pasó todas las pruebas, renderizamos la página solicitada
  return next();
});