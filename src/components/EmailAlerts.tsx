import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendTestEmail } from "@/lib/alerts.functions";
import { Button } from "@/components/ui/button";

export function EmailAlerts() {
  const [email, setEmail] = useState(""), [on, setOn] = useState(false), [msg, setMsg] = useState("");
  const test = useServerFn(sendTestEmail);
  useEffect(() => { supabase.from("app_settings").select("key,value").in("key", ["alert_email", "alerts_enabled"]).then(({ data }) => { for (const s of data ?? []) { if (s.key === "alert_email") setEmail(s.value); if (s.key === "alerts_enabled") setOn(s.value === "true"); } }); }, []);
  const save = async (e: string, o: boolean) => {
    const { error } = await supabase.from("app_settings").upsert([{ key: "alert_email", value: e.trim() }, { key: "alerts_enabled", value: String(o) }]);
    setMsg(error ? "⚠️ No se pudo guardar" : "✓ Guardado");
  };
  return (
    <section className="space-y-3 rounded-lg border-2 border-border p-4">
      <h2 className="text-xl font-bold">📧 Avisos por Gmail</h2>
      <p className="text-sm text-muted-foreground">Se revisa cada 15 min. Avisa almacenaje a 48 h, naviera a 24 h y turno terminal cada 2 h tras el libramiento.</p>
      <input type="email" className="h-12 w-full rounded-md border-2 border-input bg-background px-3 text-base" placeholder="tu-correo@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="flex items-center gap-2 text-base font-semibold"><input type="checkbox" className="h-5 w-5" checked={on} onChange={(e) => { setOn(e.target.checked); save(email, e.target.checked); }} />Enviar avisos automáticos</label>
      <div className="grid grid-cols-2 gap-2">
        <Button className="h-12" onClick={() => save(email, on)}>Guardar</Button>
        <Button variant="outline" className="h-12" onClick={async () => { setMsg("⏳ Enviando…"); try { await test({ data: { to: email.trim() } }); setMsg("✓ Correo de prueba enviado"); } catch { setMsg("⚠️ No se pudo enviar. Revisa el correo."); } }}>Enviar prueba</Button>
      </div>
      {msg && <p className="text-sm font-semibold" role="status">{msg}</p>}
    </section>
  );
}
