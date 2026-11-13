import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { recipientLabel, validEmail, type EmailRecipient } from "@/lib/email-recipients";

// Demo only: nothing is really sent and no Google account is linked. Saved in this browser per signed-in account.
type Demo = { connected?: string | undefined; list: EmailRecipient[]; on: boolean; log: string[] };

export function DemoGmailAlerts() {
  const [uid, setUid] = useState(""), [me, setMe] = useState("");
  const [d, setD] = useState<Demo>({ list: [], on: false, log: [] });
  const [open, setOpen] = useState(false), [name, setName] = useState(""), [email, setEmail] = useState(""), [msg, setMsg] = useState("");
  useEffect(() => { supabase.auth.getUser().then(({ data }) => {
    if (!data.user) return; setUid(data.user.id); setMe(data.user.email ?? "");
    try { const s = localStorage.getItem(`pp-demo-gmail-${data.user.id}`); if (s) setD(JSON.parse(s)); } catch { /* fresh demo */ }
  }); }, []);
  const save = (n: Demo, ok?: string) => { setD(n); if (uid) localStorage.setItem(`pp-demo-gmail-${uid}`, JSON.stringify(n)); if (ok) setMsg(ok); };
  const stamp = () => new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const add = () => {
    const e = email.trim().toLowerCase();
    if (!name.trim()) return setMsg("⚠️ Ingresa un nombre");
    if (!validEmail(e)) return setMsg("⚠️ Correo no válido");
    if (d.list.some((r) => r.email === e)) return setMsg("Ese correo ya está en la lista");
    save({ ...d, list: [...d.list, { email: e, name: name.trim().slice(0, 80) }] }, `✓ ${name.trim()} agregado`); setName(""); setEmail("");
  };
  const input = "mt-1 h-12 w-full min-w-0 rounded-md border-2 border-input bg-background px-3 text-base";
  return (
    <section className="space-y-3 rounded-lg border-2 border-border bg-card/95 backdrop-blur-md p-4">
      <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">📧 Avisos por Gmail</h2><span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold">Simulación (demo)</span></div>
      {!d.connected ? <>
        <p className="text-sm text-muted-foreground">Vincula tu Gmail para que PortPulse te autoenvíe las alertas de tus operaciones desde tu propia cuenta: almacenaje a 48 h, naviera a 24 h y turno terminal cada 2 h.</p>
        <Button variant="outline" className="h-12 w-full gap-2 font-semibold" onClick={() => setOpen(true)}><span className="text-lg font-black text-primary">G</span> Conectar mi cuenta de Gmail</Button>
      </> : <>
        <p className="rounded-md border border-success/50 bg-success/10 p-2 text-sm font-semibold">✓ Conectado a Gmail ({d.connected}) — las alertas se autoenviarán desde esta cuenta.</p>
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <label className="text-sm font-medium">Nombre<input maxLength={80} className={input} placeholder="Despachante" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="text-sm font-medium">Correo<input type="email" className={input} placeholder="correo@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <Button type="submit" className="h-12">Agregar</Button>
        </form>
        {d.list.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay correos guardados.</p> : <ul className="space-y-2">{d.list.map((r) => (
          <li key={r.email} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
            <span className="min-w-0 basis-full break-words font-semibold sm:basis-auto sm:flex-1">Enviar a {recipientLabel(r)}</span>
            <Button variant="ghost" size="icon" aria-label={`Cambiar nombre de ${recipientLabel(r)}`} onClick={() => { const v = prompt("Nombre del destinatario", r.name); if (v?.trim()) save({ ...d, list: d.list.map((x) => x.email === r.email ? { ...x, name: v.trim().slice(0, 80) } : x) }, "✓ Guardado"); }}><Pencil className="size-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => save({ ...d, log: [`${stamp()} · Prueba simulada enviada a ${recipientLabel(r)}`, ...d.log].slice(0, 5) }, `✓ Prueba simulada enviada a ${recipientLabel(r)}`)}>Enviar prueba</Button>
            <Button variant="destructive" size="sm" onClick={() => { if (confirm(`¿Quitar ${recipientLabel(r)} de los avisos?`)) save({ ...d, list: d.list.filter((x) => x.email !== r.email) }, `✓ ${recipientLabel(r)} quitado`); }}>Quitar</Button>
          </li>))}</ul>}
        <label className="flex items-center gap-2 text-base font-semibold"><input type="checkbox" className="h-5 w-5" checked={d.on} onChange={(e) => save({ ...d, on: e.target.checked })} />Enviar avisos automáticos</label>
        {d.log.length > 0 && <ul className="space-y-1 text-xs text-muted-foreground">{d.log.map((l, i) => <li key={i}>📨 {l}</li>)}</ul>}
        <Button variant="ghost" size="sm" onClick={() => { if (confirm("¿Desconectar tu Gmail?")) save({ ...d, connected: undefined, on: false }, "Gmail desconectado"); }}>Desconectar Gmail</Button>
      </>}
      <p className="text-xs text-muted-foreground">Modo demostración: no se envían correos reales.</p>
      {msg && <p className="text-sm font-semibold" role="status">{msg}</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-center"><span className="block text-3xl font-black text-primary">G</span>Acceder con Google</DialogTitle></DialogHeader>
          <p className="text-center text-sm">PortPulse quiere enviar correos de alerta en tu nombre.</p>
          <div className="rounded-md border border-border p-3 text-sm"><p className="font-semibold">{me || "Tu cuenta de Google"}</p><p className="text-muted-foreground">Permiso: enviar avisos de vencimiento desde tu Gmail</p></div>
          <p className="text-xs text-muted-foreground">Simulación: no se conecta ninguna cuenta real.</p>
          <div className="flex gap-2"><Button variant="outline" className="h-11 flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="h-11 flex-1" onClick={() => { save({ ...d, connected: me || "tu cuenta", on: true }, "✓ Gmail conectado"); setOpen(false); }}>Permitir</Button></div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
