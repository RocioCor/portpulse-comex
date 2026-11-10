import { useEffect, useState } from "react";
export type Stage = "pending" | "sim_active" | "ready" | "completed";
export type Win = "not_open" | "open" | "closed";
export type Req = { id: string; decl: string; port: string; storage: string; win: Win; auto: boolean; stage: Stage; simOpenedAt?: number; notifiedAt?: number; createdAt: number };
const day = (o: number) => { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); };
const now = Date.now();
const seed: Req[] = [
  { id: "1", decl: "DIN-2026-004581", port: "San Antonio", storage: day(0), win: "open", auto: true, stage: "sim_active", simOpenedAt: now - 75 * 60000, notifiedAt: now - 75 * 60000, createdAt: now },
  { id: "2", decl: "DIN-2026-004602", port: "Valparaíso", storage: day(1), win: "not_open", auto: true, stage: "pending", createdAt: now },
  { id: "3", decl: "DIN-2026-004377", port: "Punta Arenas", storage: day(5), win: "closed", auto: false, stage: "ready", createdAt: now },
  { id: "4", decl: "DIN-2026-004120", port: "Iquique", storage: day(9), win: "closed", auto: true, stage: "completed", createdAt: now },
];
// Moving to the SIM stage with auto-trigger on records a (simulated) pickup notice.
export function applyStage(r: Req, stage: Stage, at = Date.now()): Req {
  const n = { ...r, stage };
  if (stage === "sim_active") { n.win = "open"; n.simOpenedAt = at; if (r.auto) n.notifiedAt = at; }
  if (stage === "ready" || stage === "completed") n.win = "closed";
  return n;
}
export function useRequests() {
  const [items, setItems] = useState<Req[]>(seed);
  useEffect(() => { const s = localStorage.getItem("reqs"); if (s) setItems(JSON.parse(s)); }, []);
  const save = (n: Req[]) => { setItems(n); localStorage.setItem("reqs", JSON.stringify(n)); };
  return { items, add: (r: Req) => save([r, ...items]), update: (id: string, stage: Stage) => save(items.map((i) => (i.id === id ? applyStage(i, stage) : i))) };
}
export const daysLeft = (iso: string) => { const a = new Date(iso + "T00:00:00"); const b = new Date(); b.setHours(0, 0, 0, 0); return Math.round((a.getTime() - b.getTime()) / 86400000); };
