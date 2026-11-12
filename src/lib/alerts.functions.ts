import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to: string }) => { if (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(d.to)) throw new Error("Correo no válido"); return d; })
  .handler(async ({ data }) => {
    const { sendGmail } = await import("./gmail.server");
    await sendGmail(data.to, "Prueba – Mesa de Liberación Portuaria", "¡Funciona! Aquí te llegarán los avisos de almacenaje (48 h), naviera (24 h) y turno terminal (cada 2 h).");
    return { ok: true };
  });
