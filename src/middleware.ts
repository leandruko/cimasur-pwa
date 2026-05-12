import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  // CORRECCIÓN: Proteger la ruta real que se utiliza en la aplicación
  const isAdminRoute = url.pathname.startsWith("/dashboard/admin");

  if (!isDashboardRoute) {
    return next();
  }

  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return redirect("/login");
  }

  const { data: { session }, error } = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
  });

  if (error || !session) {
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });
    return redirect("/login");
  }

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from("perfiles")
      .select("cargo")
      .eq("id", session.user.id)
      .single();

    // CORRECCIÓN: Validación robusta insensible a mayúsculas/minúsculas y espacios
    const cargoLimpio = profile?.cargo?.toLowerCase().trim();
    if (cargoLimpio !== "administrador") {
      return redirect("/dashboard"); 
    }
  }

  return next();
});