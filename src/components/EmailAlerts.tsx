import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendTestEmail } from "@/lib/alerts.functions";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { readRecipients, recipientSettings, recipientLabel, validEmail, type EmailRecipient } from "@/lib/email-recipients";

export function EmailAlerts() {
  const [list, setList] = useState<EmailRecipient[]>([]), [email, setEmail] = useState(""), [name, setName] = useState(""), [on, setOn] = useState(false), [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const test = useServerFn(sendTestEmail);
  useEffect(() => { supabase.from("app_settings").select("key,value").in("key", ["alert_email", "alert_email_names", "alerts_enabled"]).then(({ data, error }) => {
    if (error) { setMsg("⚠️ No se pudo cargar la lista"); return; }
    const settings = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
    setList(readRecipients(settings["alert_email"] ?? "", settings["alert_email_names"])); setOn(settings["alerts_enabled"] === "true"); setLoading(false);
  }); }, []);
  const save = async (l: EmailRecipient[], o: boolean, ok = "✓ Guardado") => {
    setSaving(true);
    try {
      const { error } = await supabase.from("app_settings").upsert([...recipientSettings(l, o)]);
      if (error) { setMsg("⚠️ No se pudo guardar"); return false; }
      setList(l); setOn(o); setMsg(ok); return true;
    } catch { setMsg("⚠️ No se pudo guardar"); return false; }
    finally { setSaving(false); }
  };
  const add = async () => {
    if (loading || saving) return;
    const e = email.trim().toLowerCase();
    if (!name.trim()) return setMsg("⚠️ Ingresa un nombre");
    if (!validEmail(e)) return setMsg("⚠️ Correo no válido");
    if (list.some((r) => r.email === e)) return setMsg("Ese correo ya está en la lista");
    const recipient = { email: e, name: name.trim() };
    if (await save([...list, recipient], on, `✓ ${recipient.name} agregado`)) { setEmail(""); setName(""); }
  };
  const remove = (r: EmailRecipient) => { const label = recipientLabel(r); if (!confirm(`¿Quitar ${label} de los avisos?`)) return; save(list.filter((x) => x.email !== r.email), on, `✓ ${label} quitado`); };
  const rename = (r: EmailRecipient) => { const value = prompt("Nombre del destinatario", r.name); if (value === null) return; if (!value.trim()) return setMsg("⚠️ Ingresa un nombre"); save(list.map((x) => x.email === r.email ? { ...x, name: value.trim().slice(0, 80) } : x), on); };
  const sendTest = async (r: EmailRecipient) => { const label = recipientLabel(r); setMsg(`⏳ Enviando a ${label}…`); try { await test({ data: { to: r.email } }); setMsg(`✓ Prueba enviada a ${label}`); } catch { setMsg("⚠️ No se pudo enviar."); } };
  return (
    <section className="space-y-3 rounded-lg border-2 border-border bg-card/95 backdrop-blur-md p-4">
      <h2 className="text-xl font-bold">📧 Avisos por Gmail</h2>
      <p className="text-sm text-muted-foreground">Se revisa cada 15 min. Avisa almacenaje a 48 h, naviera a 24 h y turno terminal cada 2 h tras el libramiento. Los avisos llegan a todos los correos de la lista.</p>
      <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <label className="text-sm font-medium">Nombre<input required maxLength={80} className="mt-1 h-12 w-full min-w-0 rounded-md border-2 border-input bg-background px-3 text-base" placeholder="Despachante" value={name} onChange={(e) => setName(e.target.value)} disabled={loading || saving} /></label>
        <label className="text-sm font-medium">Correo<input required type="email" className="mt-1 h-12 w-full min-w-0 rounded-md border-2 border-input bg-background px-3 text-base" placeholder="correo@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading || saving} /></label>
        <Button type="submit" className="h-12" disabled={loading || saving}>Agregar</Button>
      </form>
      {list.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay correos guardados.</p> : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.email} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
              <span className="min-w-0 basis-full break-words font-semibold sm:basis-auto sm:flex-1">Enviar a {recipientLabel(r)}</span>
              <Button variant="ghost" size="icon" aria-label={`Cambiar nombre de ${recipientLabel(r)}`} title="Cambiar nombre" disabled={saving} onClick={() => rename(r)}><Pencil className="size-4" /></Button>
              <Button variant="outline" size="sm" disabled={saving} onClick={() => sendTest(r)}>Enviar prueba</Button>
              <Button variant="destructive" size="sm" disabled={saving} onClick={() => remove(r)}>Quitar</Button>
            </li>
          ))}
        </ul>
      )}
      <label className="flex items-center gap-2 text-base font-semibold"><input type="checkbox" className="h-5 w-5" checked={on} disabled={loading || saving} onChange={(e) => save(list, e.target.checked)} />Enviar avisos automáticos</label>
      {msg && <p className="text-sm font-semibold" role="status">{msg}</p>}
    </section>
  );
}
