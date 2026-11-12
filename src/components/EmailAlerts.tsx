import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendTestEmail } from "@/lib/alerts.functions";
import { Button } from "@/components/ui/button";

const valid = (e: string) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(e);

export function EmailAlerts() {
  const [list, setList] = useState<string[]>([]), [email, setEmail] = useState(""), [on, setOn] = useState(false), [msg, setMsg] = useState("");
  const test = useServerFn(sendTestEmail);
  useEffect(() => { supabase.from("app_settings").select("key,value").in("key", ["alert_email", "alerts_enabled"]).then(({ data }) => { for (const s of data ?? []) { if (s.key === "alert_email") setList(s.value.split(",").map((x) => x.trim()).filter(Boolean)); if (s.key === "alerts_enabled") setOn(s.value === "true"); } }); }, []);
  const save = async (l: string[], o: boolean, ok = "✓ Guardado") => {
    const { error } = await supabase.from("app_settings").upsert([{ key: "alert_email", value: l.join(", ") }, { key: "alerts_enabled", value: String(o) }]);
    setMsg(error ? "⚠️ No se pudo guardar" : ok);
  };
  const add = () => {
    const e = email.trim().toLowerCase();
    if (!valid(e)) return setMsg("⚠️ Correo no válido");
    if (list.includes(e)) return setMsg("Ese correo ya está en la lista");
    const l = [...list, e]; setList(l); setEmail(""); save(l, on, `✓ ${e} agregado`);
  };
  const remove = (e: string) => { if (!confirm(`¿Quitar ${e} de los avisos?`)) return; const l = list.filter((x) => x !== e); setList(l); save(l, on, `✓ ${e} quitado`); };
  const sendTest = async (e: string) => { setMsg(`⏳ Enviando a ${e}…`); try { await test({ data: { to: e } }); setMsg(`✓ Prueba enviada a ${e}`); } catch { setMsg("⚠️ No se pudo enviar."); } };
  return (
    <section className="space-y-3 rounded-lg border-2 border-border p-4">
      <h2 className="text-xl font-bold">📧 Avisos por Gmail</h2>
      <p className="text-sm text-muted-foreground">Se revisa cada 15 min. Avisa almacenaje a 48 h, naviera a 24 h y turno terminal cada 2 h tras el libramiento. Los avisos llegan a todos los correos de la lista.</p>
      <div className="flex gap-2">
        <input type="email" className="h-12 flex-1 rounded-md border-2 border-input bg-background px-3 text-base" placeholder="correo@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button className="h-12" onClick={add}>Agregar</Button>
      </div>
      {list.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay correos guardados.</p> : (
        <ul className="space-y-2">
          {list.map((e) => (
            <li key={e} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
              <span className="flex-1 break-all font-semibold">{e}</span>
              <Button variant="outline" size="sm" onClick={() => sendTest(e)}>Enviar prueba</Button>
              <Button variant="destructive" size="sm" onClick={() => remove(e)}>Quitar</Button>
            </li>
          ))}
        </ul>
      )}
      <label className="flex items-center gap-2 text-base font-semibold"><input type="checkbox" className="h-5 w-5" checked={on} onChange={(e) => { setOn(e.target.checked); save(list, e.target.checked); }} />Enviar avisos automáticos</label>
      {msg && <p className="text-sm font-semibold" role="status">{msg}</p>}
    </section>
  );
}
