import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { applyStage, storageFromEntry, demurrageFromEntry, type Req, type Stage, type Win } from "./store";
import { syncSheet } from "./sheets.functions";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["operations"]["Row"];
const n = (v: number | null) => (v === null ? undefined : Number(v));
const fromRow = (r: Row): Req => (({ id: r.id, decl: r.decl, port: r.port, entry: r.entry ?? undefined, storage: r.storage, demurrage: r.demurrage ?? undefined, win: r.win as Win, auto: r.auto, stage: r.stage as Stage, simOpenedAt: n(r.sim_opened_at), notifiedAt: n(r.notified_at), releasedAt: n(r.released_at), bookedAt: n(r.booked_at), createdAt: new Date(r.created_at).getTime() }) as Req);
const toRow = (r: Partial<Req>) => {
  const o: Record<string, unknown> = {};
  const map: [keyof Req, string][] = [["decl", "decl"], ["port", "port"], ["entry", "entry"], ["storage", "storage"], ["demurrage", "demurrage"], ["win", "win"], ["auto", "auto"], ["stage", "stage"], ["simOpenedAt", "sim_opened_at"], ["notifiedAt", "notified_at"], ["releasedAt", "released_at"], ["bookedAt", "booked_at"]];
  for (const [k, c] of map) if (k in r) o[c] = r[k] ?? null;
  return o;
};

// New accounts get a few fictional example operations once, so first-time users see how stages and deadlines work.
const local = (ms: number) => { const d = new Date(ms); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
export function exampleOps(now = Date.now()) {
  const D = 86400000;
  const mk = (decl: string, port: string, daysAgo: number, demDays: number, stage: Stage, extra: Record<string, unknown> = {}) => { const entry = local(now - daysAgo * D); return { decl, port, entry, storage: storageFromEntry(entry), demurrage: demurrageFromEntry(entry, demDays), stage, auto: true, win: "not_open", ...extra }; };
  return [
    mk("EJEMPLO-26001IC04000001A", "Buenos Aires", 2, 10, "pending"),
    mk("EJEMPLO-26001IC04000002B", "Buenos Aires", 4, 5, "released", { released_at: now - 30 * 60000 }),
    mk("EJEMPLO-26033IC04000003C", "Rosario", 29, 10, "ready", { win: "closed", booked_at: now - 3600000 }),
    mk("EJEMPLO-26073IC04000004D", "Zárate", 12, 10, "completed", { win: "closed" }),
  ];
}

export function useOperations() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(false);
  const [sheet, setSheet] = useState<{ url?: string; status: "idle" | "syncing" | "ok" | "error" }>({ status: "idle" });
  const sync = useServerFn(syncSheet);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const load = useCallback(async (): Promise<void> => {
    const { data } = await supabase.from("operations").select("*").order("created_at", { ascending: false });
    if (data && data.length === 0) {
      const { data: u } = await supabase.auth.getUser(); const k = u.user && `pp-examples-${u.user.id}`;
      if (k && !localStorage.getItem(k)) { localStorage.setItem(k, "1"); const { error } = await supabase.from("operations").insert(exampleOps() as never); if (!error) return load(); }
    }
    setItems((data ?? []).map(fromRow)); setLoading(false);
  }, []);
  const pushSheet = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSheet((s) => ({ ...s, status: "syncing" }));
      try { const r = await sync(); setSheet({ url: r.url, status: "ok" }); } catch { setSheet((s) => ({ ...s, status: "error" })); }
    }, 1500);
  }, [sync]);
  useEffect(() => { load(); supabase.from("user_sheets").select("sheet_id").maybeSingle().then(({ data }) => data && setSheet({ url: `https://docs.google.com/spreadsheets/d/${data.sheet_id}/edit`, status: "idle" }));
    supabase.auth.getUser().then(({ data }) => data.user && supabase.rpc("is_team_member", { _uid: data.user.id }).then(({ data: m }) => setMember(!!m))); }, [load]);
  const write = async (p: PromiseLike<{ error: unknown }>) => { const { error } = await p; if (error) alert("No se pudo guardar. Intenta de nuevo."); await load(); pushSheet(); };
  return {
    items, loading, member, sheet, syncNow: pushSheet,
    add: (r: Req) => write(supabase.from("operations").insert(toRow(r) as never)),
    update: (id: string, stage: Stage) => { const cur = items.find((i) => i.id === id); if (cur) write(supabase.from("operations").update({ ...toRow(applyStage(cur, stage)), updated_at: new Date().toISOString() } as never).eq("id", id)); },
    patch: (id: string, p: Partial<Req>) => write(supabase.from("operations").update({ ...toRow(p), updated_at: new Date().toISOString() } as never).eq("id", id)),
    remove: (id: string) => write(supabase.from("operations").delete().eq("id", id)),
  };
}
