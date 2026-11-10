import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { useRequests, daysLeft, deadlineStatus, applyStage, type Stage, type Win, type Req } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Port Release Desk — Customs & SIM pickup tracker" },
    { name: "description", content: "Track customs releases, SIM pickup windows, terminal storage and empty-container return deadlines with 48-hour alerts. English / Español." },
    { property: "og:title", content: "Port Release Desk" },
    { property: "og:description", content: "Independent terminal storage and shipping-line deadlines with 48-hour alerts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <I18nProvider><App /></I18nProvider>,
});

const STAGES: Stage[] = ["pending", "sim_active", "ready", "completed"];
const stageCls: Record<Stage, string> = {
  pending: "bg-warning/20 text-foreground border-warning", sim_active: "bg-warning text-foreground border-warning",
  ready: "bg-success text-navy-foreground border-success", completed: "bg-muted text-muted-foreground border-border",
};
const input = "w-full h-14 rounded-lg border-2 border-input bg-card px-4 text-lg focus:border-primary outline-none";

function useNow() { const [n, setN] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setN(Date.now()), 30000); return () => clearInterval(i); }, []); return n; }

function App() {
  const { t, lang, setLang } = useI18n();
  const { items, add, update } = useRequests();
  const now = useNow();
  const [filter, setFilter] = useState<Stage | "all">("all");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const open = items.filter((i) => i.stage !== "completed");
  const list = items.filter((i) => (filter === "all" || i.stage === filter) && (i.decl + i.port).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">⚓ {t.app}</h1><p className="opacity-75">{t.tagline}</p></div>
          <div className="flex rounded-lg border border-navy-foreground/30 overflow-hidden" role="group" aria-label="Language">
            {(["es", "en"] as const).map((l) => (
              <Button key={l} onClick={() => setLang(l)} className={`rounded-none px-4 py-2 font-semibold ${lang === l ? "bg-navy-foreground text-navy" : "bg-transparent text-navy-foreground"}`}>{l === "es" ? "Español" : "English"}</Button>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={t.open} value={open.length} />
          <Stat label={t.simActive} value={open.filter((i) => i.stage === "sim_active").length} tone="bg-warning text-navy" />
           <Stat label={t.storageAlert} value={open.filter((i) => ["warning", "expired"].includes(deadlineStatus(i.storage, now))).length} tone="bg-warning text-navy" />
           <Stat label={t.demurrageAlert} value={open.filter((i) => ["warning", "expired"].includes(deadlineStatus(i.demurrage, now))).length} tone="bg-danger text-navy-foreground" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-[380px_1fr] gap-8">
        <NewForm onAdd={(r) => { add(r); setToast(`${r.decl} ${t.savedMsg}`); setTimeout(() => setToast(""), 4000); }} />
        <section>
          <h2 className="text-xl font-bold mb-3">{t.reqs}</h2>
          <input className={input + " mb-3"} placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", ...STAGES] as const).map((s) => (
              <Button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-lg border-2 text-sm font-medium whitespace-normal ${filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
                {s === "all" ? t.all : t.st[s]}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            {list.length === 0 && <p className="text-muted-foreground py-8 text-center">{t.none}</p>}
            {list.map((r) => <Card key={r.id} r={r} now={now} onStage={(s) => update(r.id, s)} />)}
          </div>
        </section>
      </main>
      {toast && <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-success text-navy-foreground px-6 py-4 rounded-lg shadow-lg font-semibold">✓ {t.saved}: {toast}</div>}
    </div>
  );
}

function Stat({ label, value, tone = "bg-navy-foreground/10" }: { label: string; value: number; tone?: string }) {
  return <div className={`rounded-lg p-4 ${tone}`}><div className="text-3xl font-bold font-mono">{value}</div><div className="text-sm">{label}</div></div>;
}

function Deadline({ iso, kind, now }: { iso?: string; kind: "storage" | "demurrage"; now: number }) {
  const { t, lang } = useI18n();
  const status = deadlineStatus(iso, now);
  const cls = status === "expired" ? "bg-danger text-navy-foreground" : status === "warning" ? "bg-warning text-foreground" : "bg-muted text-foreground";
  const label = status === "missing" ? t.deadlineMissing : status === "expired" ? t.deadlineExpired : status === "warning" ? t.deadlineSoon : t.deadlineOk;
  const date = iso ? new Date(iso.length === 10 ? iso + "T23:59:59" : iso).toLocaleString(lang === "es" ? "es-CL" : "en-GB", { day: "2-digit", month: "short", year: "numeric", ...(iso.length > 10 ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "—";
  return <div className="min-w-0 border-l-2 border-border pl-3 space-y-1">
    <div className="font-semibold text-sm">{kind === "storage" ? t.storage : t.demurrage}</div>
    <div className="text-sm text-muted-foreground">{kind === "storage" ? t.collect : t.returnEmpty}</div>
    <div className="text-sm">{date}</div>
    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${cls}`}>{label}</span>
  </div>;
}

function Card({ r, now, onStage }: { r: Req; now: number; onStage: (s: Stage) => void }) {
  const { t, lang } = useI18n();
  const mins = r.simOpenedAt ? 120 - Math.floor((now - r.simOpenedAt) / 60000) : 0;
  return (
    <article className="rounded-lg border-2 border-border bg-card p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div><div className="font-mono font-medium text-lg">{r.decl}</div><div className="text-muted-foreground">{r.port}</div></div>
        <span className={`self-start px-3 py-1 rounded-full border-2 text-sm font-semibold ${stageCls[r.stage]}`}>{t.st[r.stage]}</span>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <Deadline iso={r.storage} kind="storage" now={now} />
        <Deadline iso={r.demurrage} kind="demurrage" now={now} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center text-sm">
        <span className="px-2 py-1 rounded bg-muted">{t.sim}: {t.w[r.win]}</span>
        {r.stage === "sim_active" && <span className={`px-2 py-1 rounded font-bold ${mins > 0 ? "bg-warning" : "bg-danger text-navy-foreground animate-flash"}`}>⏱ {mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m ${t.left}` : t.windowClosed}</span>}
        <span className="px-2 py-1 rounded bg-muted">{r.auto ? t.autoOn : t.autoOff}</span>
        {r.notifiedAt && <span className="px-2 py-1 rounded bg-success/20">🔔 {t.notified} {new Date(r.notifiedAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
      <label className="mt-3 block text-sm font-medium">{t.status}
        <select className={input + " mt-1 h-12 text-base"} value={r.stage} onChange={(e) => onStage(e.target.value as Stage)}>
          {STAGES.map((s) => <option key={s} value={s}>{t.st[s]}</option>)}
        </select>
      </label>
    </article>
  );
}

function NewForm({ onAdd }: { onAdd: (r: Req) => void }) {
  const { t } = useI18n();
  const [f, setF] = useState({ decl: "", port: "", storage: "", demurrage: "", win: "not_open" as Win, auto: true });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.decl.trim() || !f.port.trim() || !f.storage || !f.demurrage) return;
    let r: Req = { id: crypto.randomUUID(), decl: f.decl.trim().slice(0, 40), port: f.port.trim().slice(0, 80), storage: f.storage, demurrage: f.demurrage, win: f.win, auto: f.auto, stage: "pending", createdAt: Date.now() };
    if (f.win === "open") r = applyStage(r, "sim_active");
    onAdd(r); setF({ decl: "", port: "", storage: "", demurrage: "", win: "not_open", auto: true });
  };
  return (
    <form onSubmit={submit} className="space-y-4 self-start min-w-0">
      <h2 className="text-xl font-bold">{t.newReq}</h2>
      <label className="block font-medium">{t.decl}<input required maxLength={40} className={input + " mt-1 font-mono"} placeholder="DIN-2026-000000" value={f.decl} onChange={(e) => setF({ ...f, decl: e.target.value })} /></label>
      <label className="block font-medium">{t.port}<input required maxLength={80} className={input + " mt-1"} placeholder="San Antonio" value={f.port} onChange={(e) => setF({ ...f, port: e.target.value })} /></label>
      <div>
        <label className="block font-medium">{t.storage}<input required type="datetime-local" aria-describedby="storage-hint" className={input + " mt-1 min-w-0 max-w-full text-base"} value={f.storage} onChange={(e) => setF({ ...f, storage: e.target.value })} /></label>
        <p id="storage-hint" className="mt-2 text-sm text-muted-foreground">{t.storageHint}</p>
      </div>
      <div>
        <label className="block font-medium">{t.demurrage}<input required type="datetime-local" aria-describedby="demurrage-hint" className={input + " mt-1 min-w-0 max-w-full text-base"} value={f.demurrage} onChange={(e) => setF({ ...f, demurrage: e.target.value })} /></label>
        <p id="demurrage-hint" className="mt-2 text-sm text-muted-foreground">{t.demurrageHint}</p>
      </div>
      <p className="border-l-2 border-warning pl-3 text-sm text-muted-foreground">{t.alertHint}</p>
      <label className="block font-medium">{t.sim}
        <select className={input + " mt-1"} value={f.win} onChange={(e) => setF({ ...f, win: e.target.value as Win })}>
          {(["not_open", "open", "closed"] as Win[]).map((w) => <option key={w} value={w}>{t.w[w]}</option>)}
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
