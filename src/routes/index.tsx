import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { inRange, deadlineStatus, applyStage, turnReminder, freeDaysLeft, storageFromEntry, demurrageFromEntry, demurrageValid, DEMURRAGE_MAX_DAYS, type Stage, type Win, type Req } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import portHeader from "@/assets/port-header.jpg";
import portOperations from "@/assets/port-operations.png.asset.json";
import { SailingShip, BackToTop } from "@/components/ShipAndTop";
import { useOperations } from "@/lib/operations";
import { Login } from "@/components/Login";
import { EmailAlerts } from "@/components/EmailAlerts";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "PortPulse — Customs & terminal slot tracker" },
    { name: "description", content: "Track customs releases, 2-hour terminal slots, terminal storage and empty-container return deadlines with 48-hour alerts. English / Español." },
    { property: "og:title", content: "PortPulse" },
    { property: "og:description", content: "Independent terminal storage and shipping-line deadlines with 48-hour alerts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <I18nProvider><ClientOnly><Gate /></ClientOnly></I18nProvider>,
});

const STAGES: Stage[] = ["pending", "released", "sim_active", "ready", "completed"];
const stageCls: Record<Stage, string> = {
  pending: "bg-warning/20 text-foreground border-warning", released: "bg-primary text-primary-foreground border-primary", sim_active: "bg-warning text-foreground border-warning",
  ready: "bg-success text-navy-foreground border-success", completed: "bg-muted text-muted-foreground border-border",
};
const stampCls: Record<Stage, string> = { pending: "border-warning text-warning", released: "border-primary text-primary", sim_active: "border-warning text-warning", ready: "border-success text-success", completed: "border-muted-foreground text-muted-foreground" };
const input = "w-full h-14 rounded-lg border-2 border-input bg-card px-4 text-lg focus:border-primary outline-none";

function useNow() { const [n, setN] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setN(Date.now()), 30000); return () => clearInterval(i); }, []); return n; }

function Gate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <div className="min-h-screen bg-navy" />;
  return session ? <App email={session.user.email ?? ""} /> : <Login />;
}

function App({ email }: { email: string }) {
  const { t, lang, setLang } = useI18n();
  const { items, add, update, patch, remove, sheet, syncNow, loading } = useOperations();
  const [port, setPort] = useState("all");
  const [sf, setSf] = useState(""); const [st, setSt] = useState("");
  const [df, setDf] = useState(""); const [dt, setDt] = useState("");
  const ports = [...new Set(items.map((i) => i.port))].sort();
  const now = useNow();
  const [filter, setFilter] = useState<Stage | "all">("all");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState<"ops" | "cfg">("ops");
  const [formOpen, setFormOpen] = useState(false);
  const open = items.filter((i) => i.stage !== "completed");
  const [kpi, setKpi] = useState<"" | "open" | "turn" | "storage" | "dem">("");
  const kpiOk = (i: Req) => kpi === "" ? true : i.stage !== "completed" && (kpi === "open" || (kpi === "turn" ? !!turnReminder(i, now) : kpi === "storage" ? ["warning", "expired"].includes(deadlineStatus(i.storage, now)) : kpi === "dem" ? ["warning", "expired"].includes(deadlineStatus(i.demurrage, now, 24)) : true));
  const pickKpi = (k: typeof kpi) => { setKpi(kpi === k ? "" : k); setTab("ops"); setTimeout(() => document.getElementById("ops-list")?.scrollIntoView({ behavior: "smooth" }), 50); };
  const kpiLabel = { "": "", open: lang === "es" ? "Cargas activas" : "Active loads", turn: t.released, storage: t.storageAlert, dem: t.demurrageAlert24 }[kpi];
  const list = items.filter((i) => kpiOk(i) && (filter === "all" || i.stage === filter) && (i.decl + i.port).toLowerCase().includes(q.toLowerCase()) && (port === "all" || i.port === port) && inRange(i.storage, sf, st) && inRange(i.demurrage, df, dt));

  return (
    <div className="min-h-screen">
      <header className="relative bg-navy text-navy-foreground overflow-hidden">
        <img src={portHeader} alt="" aria-hidden width={1920} height={640} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/60 to-navy" />
        <div className="relative">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">⚓ {t.app}</h1><p className="opacity-75">{t.tagline}</p></div>
          <div className="flex rounded-lg border border-navy-foreground/30 overflow-hidden" role="group" aria-label="Language">
            {(["es", "en"] as const).map((l) => (
              <Button key={l} onClick={() => setLang(l)} className={`rounded-none px-4 py-2 font-semibold ${lang === l ? "bg-navy-foreground text-navy" : "bg-transparent text-navy-foreground"}`}>{l === "es" ? "Español" : "English"}</Button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm"><span className="opacity-75">{email}</span><Button variant="outline" className="bg-transparent text-navy-foreground border-navy-foreground/40" onClick={() => supabase.auth.signOut()}>Salir</Button></div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat active={kpi === "open"} onClick={() => pickKpi("open")} label={lang === "es" ? "Cargas activas" : "Active loads"} value={open.length} />
          <Stat active={kpi === "turn"} onClick={() => pickKpi("turn")} label={t.released} value={open.filter((i) => turnReminder(i, now)).length} tone="bg-primary/25 border-primary/50" />
           <Stat active={kpi === "storage"} onClick={() => pickKpi("storage")} label={"🟠 " + t.storageAlert} value={open.filter((i) => ["warning", "expired"].includes(deadlineStatus(i.storage, now))).length} tone="bg-warning/25 border-warning/50" />
           <Stat active={kpi === "dem"} onClick={() => pickKpi("dem")} label={"🔴 " + t.demurrageAlert24} value={open.filter((i) => ["warning", "expired"].includes(deadlineStatus(i.demurrage, now, 24))).length} tone="bg-danger/25 border-danger/50" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full bg-navy-foreground/10 p-1 backdrop-blur" role="tablist">
            {([["ops", "📋 Operaciones"], ["cfg", "⚙️ Configuración y Alertas"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-navy-foreground text-navy" : "text-navy-foreground"}`}>{l}</button>
            ))}
          </div>
          <Button onClick={() => setFormOpen(true)} className="h-12 rounded-full px-6 text-base font-bold bg-success text-navy-foreground shadow-lg">+ Nueva operación</Button>
        </div>
        </div>
        <div className="h-16" />
        <SailingShip />
      </header>
      <BackToTop />
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>+ Nueva operación</DialogTitle></DialogHeader>
          <NewForm onAdd={(r) => { add(r); setFormOpen(false); setTab("ops"); setToast(`${r.decl} ${t.savedMsg}`); setTimeout(() => setToast(""), 4000); }} />
        </DialogContent>
      </Dialog>

      {tab === "cfg" ? <main className="mx-auto max-w-6xl px-4 py-8 grid md:grid-cols-2 gap-6 items-start"><WhatsApp items={open} now={now} /><EmailAlerts />
          <section className="space-y-2 rounded-lg border-2 border-border p-4">
            <h2 className="text-xl font-bold">📊 Google Sheets</h2>
            <p className="text-sm text-muted-foreground">Cada cambio se copia automáticamente a tu hoja de historial.</p>
            <p className="text-sm font-semibold">{sheet.status === "syncing" ? "⏳ Actualizando hoja…" : sheet.status === "ok" ? "✓ Hoja actualizada" : sheet.status === "error" ? "⚠️ No se pudo actualizar la hoja" : sheet.url ? "Hoja conectada" : "Aún no se crea la hoja"}</p>
            {sheet.url && <a className="block text-primary underline font-semibold" href={sheet.url} target="_blank" rel="noreferrer">Abrir hoja de cálculo ↗</a>}
            <Button variant="outline" className="h-12 w-full" onClick={syncNow}>{sheet.url ? "Actualizar ahora" : "Crear hoja y copiar operaciones"}</Button>
          </section></main> : <main className="relative isolate min-h-screen overflow-hidden">
        <img src={portOperations.url} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-background/75" />
        <section id="ops-list" className="mx-auto max-w-6xl px-4 py-8 scroll-mt-4">
          <h2 className="text-xl font-bold mb-3">{t.reqs}</h2>
          {kpi && <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm font-semibold">{lang === "es" ? "Mostrando" : "Showing"}: {kpiLabel} ({list.length})<Button variant="outline" size="sm" className="ml-auto" onClick={() => setKpi("")}>✕ {lang === "es" ? "Mostrar todas" : "Show all"}</Button></div>}
          <input className={input + " mb-3"} placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", ...STAGES] as const).map((s) => (
              <Button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-lg border-2 text-sm font-medium whitespace-normal ${filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
                {s === "all" ? t.all : t.st[s]}
              </Button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-4 rounded-lg bg-card/80 backdrop-blur-md p-3">
            <label className="block text-sm font-medium sm:col-span-2">{t.port}
              <select className={input + " mt-1 h-12 text-base"} value={port} onChange={(e) => setPort(e.target.value)}>
                <option value="all">{t.all}</option>{ports.map((p) => <option key={p} value={p}>{p}</option>)}
              </select></label>
            <fieldset className="text-sm"><legend className="font-medium">{t.storage}</legend>
              <div className="flex gap-2 mt-1"><input aria-label="desde" type="date" className={input + " h-12 text-base"} value={sf} onChange={(e) => setSf(e.target.value)} /><input aria-label="hasta" type="date" className={input + " h-12 text-base"} value={st} onChange={(e) => setSt(e.target.value)} /></div></fieldset>
            <fieldset className="text-sm"><legend className="font-medium">{t.demurrage}</legend>
              <div className="flex gap-2 mt-1"><input aria-label="desde" type="date" className={input + " h-12 text-base"} value={df} onChange={(e) => setDf(e.target.value)} /><input aria-label="hasta" type="date" className={input + " h-12 text-base"} value={dt} onChange={(e) => setDt(e.target.value)} /></div></fieldset>
            {(port !== "all" || sf || st || df || dt) && <Button variant="outline" className="sm:col-span-2" onClick={() => { setPort("all"); setSf(""); setSt(""); setDf(""); setDt(""); }}>✕ Limpiar filtros</Button>}
          </div>
          <div className="space-y-3">
            {loading && <p className="text-muted-foreground py-8 text-center">…</p>}
            {!loading && list.length === 0 && <p className="text-muted-foreground py-8 text-center">{t.none}</p>}
            {list.map((r) => <Card key={r.id} r={r} now={now} onStage={(s) => update(r.id, s)} onPatch={(p) => patch(r.id, p)} onDelete={() => { if (confirm(`${t.delConfirm} ${r.decl}?`)) remove(r.id); }} />)}
          </div>
        </section>
      </main>}
      {toast && <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-success text-navy-foreground px-6 py-4 rounded-lg shadow-lg font-semibold">✓ {t.saved}: {toast}</div>}
    </div>
  );
}

function Stat({ label, value, tone = "bg-navy-foreground/10 border-navy-foreground/20", onClick, active }: { label: string; value: number; tone?: string; onClick?: () => void; active?: boolean }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`text-left rounded-2xl border p-4 backdrop-blur-md shadow-lg text-navy-foreground transition hover:scale-[1.02] ${active ? "ring-2 ring-navy-foreground" : ""} ${tone}`}><div className="text-3xl font-bold font-mono">{value}</div><div className="text-sm">{label}</div></button>;
}

function Deadline({ iso, kind, now, start }: { iso: string | undefined; kind: "storage" | "demurrage"; now: number; start?: string | undefined }) {
  const { t, lang } = useI18n();
  const status = deadlineStatus(iso, now, kind === "demurrage" ? 24 : 48);
  const fd = freeDaysLeft(iso, now);
  const cls = status === "expired" ? "bg-danger/15 text-danger border-danger/40" : status === "warning" ? "bg-warning/20 text-foreground border-warning/50" : "bg-muted/60 text-foreground border-border";
  const label = status === "missing" ? t.deadlineMissing : status === "expired" ? t.deadlineExpired : status === "warning" ? (kind === "demurrage" ? t.soon24 : t.deadlineSoon) : t.deadlineOk;
  const date = iso ? new Date(iso.length === 10 ? iso + "T23:59:59" : iso).toLocaleString(lang === "es" ? "es-CL" : "en-GB", { day: "2-digit", month: "short", year: "numeric", ...(iso.length > 10 ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "—";
  return <div className="min-w-0 border-l-2 border-border pl-3 space-y-1">
    <div className="font-semibold text-sm">{kind === "storage" ? t.storage : t.demurrage}</div>
    <div className="text-sm">{date}</div>
    {fd !== null && <div className="text-sm font-bold">{fd} {kind === "storage" ? t.storageLeft : t.containerLeft}</div>}
    {(() => { const a = start ? Date.parse(start.length === 10 ? start + "T00:00" : start) : NaN, b = iso ? Date.parse(iso.length === 10 ? iso + "T23:59:59" : iso) : NaN; if (isNaN(a) || isNaN(b) || b <= a) return null; const pct = Math.min(100, Math.max(0, ((now - a) / (b - a)) * 100)); const tot = Math.round((b - a) / 86400000); const used = Math.min(tot, Math.max(0, Math.floor((now - a) / 86400000)));
      return <div><div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${status === "expired" ? "bg-danger" : status === "warning" ? "bg-warning" : kind === "storage" ? "bg-primary" : "bg-success"}`} style={{ width: `${pct}%` }} /></div><div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{used}/{tot} {lang === "es" ? "días usados" : "days used"}</div></div>; })()}
    <span className={`inline-block px-2 py-1 rounded-full border text-xs font-bold backdrop-blur-sm ${cls}`}>{label}</span>
  </div>;
}

function Card({ r, now, onStage, onPatch, onDelete }: { r: Req; now: number; onStage: (s: Stage) => void; onPatch: (p: Partial<Req>) => void; onDelete: () => void }) {
  const tr = turnReminder(r, now);
  const { t, lang } = useI18n();
  const mins = r.simOpenedAt ? 120 - Math.floor((now - r.simOpenedAt) / 60000) : 0;
  return (
    <article className="rounded-2xl border border-border/60 bg-card/85 backdrop-blur-md shadow-sm p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div className="min-w-0 max-w-full"><div className="inline-flex max-w-full items-stretch overflow-hidden rounded-md border-2 border-navy font-mono text-lg font-bold shadow-sm"><span className="shrink-0 bg-navy px-2 text-xs font-semibold text-navy-foreground flex items-center">{t.decl}</span><span className="min-w-0 break-all px-3 py-0.5 bg-card">{r.decl.replace(/^DIN-?/i, "")}</span></div><div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">⚓ {r.port}</div></div>
        <span className={`self-start -rotate-2 px-3 py-1 rounded-sm border-[3px] border-double bg-transparent text-xs font-black uppercase tracking-widest ${stampCls[r.stage]}`}>{t.st[r.stage]}</span>
      </div>
      {r.stage === "completed" ? <div className="mt-3 rounded-lg bg-muted p-3 text-sm font-semibold">✓ {t.archived}</div> : <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div>{r.entry && <div className="text-xs text-muted-foreground pl-3 mb-1">{t.entryLbl}: {new Date(r.entry.length === 10 ? r.entry + "T00:00" : r.entry).toLocaleDateString(lang === "es" ? "es-CL" : "en-GB")}</div>}<Deadline iso={r.storage} kind="storage" now={now} start={r.entry} /></div>
        <Deadline iso={r.demurrage} kind="demurrage" now={now} start={r.entry} />
      </div>}
      {r.stage === "pending" && <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-sm"><span className="font-semibold">⏳ {t.waitCustoms}</span></div>}
      {r.stage === "ready" && <div className="mt-3 rounded-lg bg-success/20 p-3 text-sm font-semibold">🚚 {t.readyHint}</div>}
      {r.stage === "released" && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
        {tr ? <>
          <div className="flex-1 min-w-[12rem]"><div className="font-semibold">⏱ {t.turnDue}</div><div className="text-xs text-muted-foreground">{t.turnNext} {Math.floor(tr.nextInMin / 60)}h {tr.nextInMin % 60}m · {t.turnN}{tr.count}</div></div>
          <Button className="h-11" onClick={() => onPatch({ bookedAt: Date.now(), win: "open" })}>{lang === "es" ? "Ya pedí el turno" : "Slot booked"}</Button>
        </> : <>
          <div className="flex-1 min-w-[12rem] font-semibold text-success">🟢 {t.bookedAt} {r.bookedAt && new Date(r.bookedAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}</div>
          <Button variant="ghost" className="h-11 text-muted-foreground" onClick={() => onPatch({ bookedAt: undefined, releasedAt: Date.now(), win: "not_open" })}>↻ {t.rebook}</Button>
        </>}
      </div>}
      {r.stage === "sim_active" && <div className={`mt-3 inline-block px-2 py-1 rounded text-sm font-bold ${mins > 0 ? "bg-warning/25" : "bg-danger/20 text-danger animate-flash"}`}>⏱ {mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m ${t.left}` : t.windowClosed}</div>}
      <label className="mt-3 block text-sm font-medium">{t.status}
        <select className={input + " mt-1 h-12 text-base"} value={r.stage} onChange={(e) => onStage(e.target.value as Stage)}>
          {STAGES.map((s) => <option key={s} value={s}>{t.st[s]}</option>)}
        </select>
      </label>
      <Button variant="outline" className="mt-3 h-12 w-full border-danger text-danger" onClick={onDelete}>🗑 {t.del}</Button>
    </article>
  );
}

function NewForm({ onAdd }: { onAdd: (r: Req) => void }) {
  const { t } = useI18n();
  const [f, setF] = useState({ decl: "", port: "", entry: "", demurrage: "", days: 5, win: "not_open" as Win, auto: true });
  const [err, setErr] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.decl.trim() || !f.port.trim() || !f.entry || !f.demurrage) return;
    if (!demurrageValid(f.entry, f.demurrage)) { setErr(t.demErr); return; }
    setErr("");
    let r: Req = { id: crypto.randomUUID(), decl: f.decl.trim().slice(0, 40), port: f.port.trim().slice(0, 80), entry: f.entry, storage: storageFromEntry(f.entry), demurrage: f.demurrage, win: f.win, auto: f.auto, stage: "pending", createdAt: Date.now() };
    if (f.win === "open") r = applyStage(r, "sim_active");
    onAdd(r); setF({ decl: "", port: "", entry: "", demurrage: "", days: 5, win: "not_open", auto: true });
  };
  return (
    <form onSubmit={submit} className="space-y-4 self-start min-w-0">
      <h2 className="text-xl font-bold">{t.newReq}</h2>
      <label className="block font-medium">{t.decl}<input required maxLength={40} className={input + " mt-1 font-mono"} placeholder="2026-000000" value={f.decl} onChange={(e) => setF({ ...f, decl: e.target.value })} /></label>
      <label className="block font-medium">{t.port}<input required maxLength={80} className={input + " mt-1"} placeholder="San Antonio" value={f.port} onChange={(e) => setF({ ...f, port: e.target.value })} /></label>
      <div>
        <label className="block font-medium">{t.entry}<input required type="datetime-local" aria-describedby="storage-hint" className={input + " mt-1 min-w-0 max-w-full text-base"} value={f.entry} onChange={(e) => setF({ ...f, entry: e.target.value, demurrage: e.target.value ? demurrageFromEntry(e.target.value, f.days) : "" })} /></label>
        <p id="storage-hint" className="mt-2 text-sm text-muted-foreground">{t.entryHint}</p>
        {f.entry && <p className="mt-1 text-sm font-semibold">{t.calcDeadline}: {new Date(storageFromEntry(f.entry)).toLocaleString()}</p>}
      </div>
      <div>
        <label className="block font-medium">{t.contType}
          <select className={input + " mt-1"} value={f.days} onChange={(e) => { const days = Number(e.target.value); setF({ ...f, days, demurrage: f.entry ? demurrageFromEntry(f.entry, days) : f.demurrage }); }}>
            <option value={5}>{t.cont5}</option><option value={10}>{t.cont10}</option>
          </select></label>
      </div>
      <div>
        <label className="block font-medium">{t.demurrage}<input required type="datetime-local" min={f.entry || undefined} max={f.entry ? demurrageFromEntry(f.entry, DEMURRAGE_MAX_DAYS) : undefined} aria-describedby="demurrage-hint" className={input + " mt-1 min-w-0 max-w-full text-base"} value={f.demurrage} onChange={(e) => setF({ ...f, demurrage: e.target.value })} /></label>
        <p id="demurrage-hint" className="mt-2 text-sm text-muted-foreground">{t.demurrageHint}</p>
        {err && <p role="alert" className="mt-1 text-sm font-bold text-danger">{err}</p>}
      </div>
      <p className="border-l-2 border-warning pl-3 text-sm text-muted-foreground">{t.alertHint}</p>
      <label className="block font-medium">{t.sim}
        <select className={input + " mt-1"} value={f.win} onChange={(e) => setF({ ...f, win: e.target.value as Win })}>
          {(["not_open", "open"] as Win[]).map((w) => <option key={w} value={w}>{t.w[w]}</option>)}
        </select>
      </label>
      <label className="flex gap-3 items-start cursor-pointer">
        <input type="checkbox" className="mt-1 size-6 accent-primary" checked={f.auto} onChange={(e) => setF({ ...f, auto: e.target.checked })} />
        <span><span className="font-medium block">{t.auto}</span><span className="text-sm text-muted-foreground">{t.autoHint}</span></span>
      </label>
      <Button type="submit" className="w-full h-14 text-lg">{t.submit}</Button>
    </form>
  );
}

function WhatsApp({ items, now }: { items: Req[]; now: number }) {
  const { t, lang } = useI18n();
  const [num, setNum] = useState("");
  useEffect(() => { setNum(localStorage.getItem("wa") ?? "+56 9 1234 5678"); }, []);
  const es = lang === "es";
  const msgs: string[] = [];
  for (const r of items) {
    const tr = turnReminder(r, now);
    if (tr) msgs.push(es ? `🔔 ${r.decl}: aviso n.º ${tr.count}, pedir turno en terminal (${r.port}).` : `🔔 ${r.decl}: reminder #${tr.count}, request terminal slot (${r.port}).`);
    const s = deadlineStatus(r.storage, now);
    if (s === "warning" || s === "expired") msgs.push(es ? `⚠️ ${r.decl}: ${s === "expired" ? "venció" : "vence en menos de 48 h"} el plazo de 30 días en depósito fiscal.` : `⚠️ ${r.decl}: 30-day bonded storage ${s === "expired" ? "expired" : "expires within 48h"}.`);
    const d = deadlineStatus(r.demurrage, now, 24);
    if (d === "warning" || d === "expired") msgs.push(es ? `🚢 ${r.decl}: ${d === "expired" ? "venció" : "vence en menos de 24 h"} la devolución del contenedor vacío.` : `🚢 ${r.decl}: empty container return ${d === "expired" ? "expired" : "due within 24h"}.`);
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">💬 {t.wa}</h2>
      <label className="block font-medium">{t.waNum}<input type="tel" maxLength={20} className={input + " mt-1"} value={num} onChange={(e) => { setNum(e.target.value); localStorage.setItem("wa", e.target.value); }} /></label>
      <p className="text-sm text-muted-foreground">{t.waHint}</p>
      <div className="rounded-lg bg-success/10 p-3 space-y-2">
        {msgs.length === 0 && <p className="text-sm text-muted-foreground">{t.waNone}</p>}
        {msgs.map((m, i) => <div key={i} className="rounded-lg bg-card border border-border p-3 text-sm"><div>{m}</div><div className="text-xs text-muted-foreground mt-1">✓✓ {t.waSent} {num}</div></div>)}
      </div>
    </section>
  );
}
