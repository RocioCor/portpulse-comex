import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { applyStage, type Req, type Stage, type Win } from "./store";
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

export function useOperations() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<{ url?: string; status: "idle" | "syncing" | "ok" | "error" }>({ status: "idle" });
  const sync = useServerFn(syncSheet);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const load = useCallback(async () => {
    const { data } = await supabase.from("operations").select("*").order("created_at", { ascending: false });
    setItems((data ?? []).map(fromRow)); setLoading(false);
  }, []);
  const pushSheet = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSheet((s) => ({ ...s, status: "syncing" }));
      try { const r = await sync(); setSheet({ url: r.url, status: "ok" }); } catch { setSheet((s) => ({ ...s, status: "error" })); }
    }, 1500);
  }, [sync]);
  useEffect(() => { load(); supabase.from("app_settings").select("value").eq("key", "sheet_id").maybeSingle().then(({ data }) => data && setSheet({ url: `https://docs.google.com/spreadsheets/d/${data.value}/edit`, status: "idle" })); }, [load]);
  const write = async (p: PromiseLike<{ error: unknown }>) => { const { error } = await p; if (error) alert("No se pudo guardar. Intenta de nuevo."); await load(); pushSheet(); };
  return {
    items, loading, sheet, syncNow: pushSheet,
    add: (r: Req) => write(supabase.from("operations").insert(toRow(r) as never)),
    update: (id: string, stage: Stage) => { const cur = items.find((i) => i.id === id); if (cur) write(supabase.from("operations").update({ ...toRow(applyStage(cur, stage)), updated_at: new Date().toISOString() } as never).eq("id", id)); },
    patch: (id: string, p: Partial<Req>) => write(supabase.from("operations").update({ ...toRow(p), updated_at: new Date().toISOString() } as never).eq("id", id)),
    remove: (id: string) => write(supabase.from("operations").delete().eq("id", id)),
  };
}
