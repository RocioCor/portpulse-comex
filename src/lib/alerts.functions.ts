import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to: string }) => { if (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(d.to)) throw new Error("Correo no válido"); return d; })
  .handler(async ({ data, context }) => {
    const { data: member } = await context.supabase.rpc("is_team_member", { _uid: context.userId });
    if (!member) throw new Error("No autorizado");
    const { data: row } = await context.supabase.from("app_settings").select("value").eq("key", "alert_email").maybeSingle();
    const allowed = (row?.value ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!allowed.includes(data.to.trim().toLowerCase())) throw new Error("Solo puedes probar contactos guardados");
    const { sendGmail } = await import("./gmail.server");
    await sendGmail(data.to, "Prueba – PortPulse", "¡Funciona! Aquí te llegarán los avisos de almacenaje (48 h), naviera (24 h) y turno terminal (cada 2 h).");
    return { ok: true };
  });
