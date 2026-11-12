export type Stage = "pending" | "released" | "sim_active" | "ready" | "completed";
export type Win = "not_open" | "open" | "closed";
export type Req = { id: string; decl: string; port: string; entry?: string; storage: string; demurrage?: string; win: Win; auto: boolean; stage: Stage; simOpenedAt?: number; notifiedAt?: number; releasedAt?: number; bookedAt?: number | undefined; createdAt: number };
// Moving to the SIM stage with auto-trigger on records a (simulated) pickup notice.
export function applyStage(r: Req, stage: Stage, at = Date.now()): Req {
  const n = { ...r, stage };
  if (stage === "sim_active") { n.win = "open"; n.simOpenedAt = at; if (r.auto) n.notifiedAt = at; }
  if (stage === "released") { n.releasedAt = at; n.bookedAt = undefined; n.win = "not_open"; }
  if (stage === "ready" || stage === "completed") n.win = "closed";
  return n;
}
// Legacy date-only deadlines remain valid through the end of their local calendar day.
export function deadlineTime(iso: string): number {
  return new Date(iso.length === 10 ? iso + "T23:59:59.999" : iso).getTime();
}
export function deadlineStatus(iso: string | undefined, at = Date.now(), warnHours = 48): "missing" | "expired" | "warning" | "ok" {
  if (!iso || !Number.isFinite(deadlineTime(iso))) return "missing";
  const remaining = deadlineTime(iso) - at;
  return remaining <= 0 ? "expired" : remaining <= warnHours * 3600000 ? "warning" : "ok";
}
export const daysLeft = (iso: string) => { const a = new Date(iso.slice(0, 10) + "T00:00:00"); const b = new Date(); b.setHours(0, 0, 0, 0); return Math.round((a.getTime() - b.getTime()) / 86400000); };
// After release, remind every 2 hours to request a terminal slot until one is booked.
export function turnReminder(r: Req, at = Date.now()): { count: number; nextInMin: number } | null {
  if (r.stage !== "released" || r.releasedAt === undefined || r.bookedAt) return null;
  const P = 2 * 3600000, el = Math.max(0, at - r.releasedAt);
  return { count: Math.floor(el / P) + 1, nextInMin: Math.ceil((P - (el % P)) / 60000) };
}
export const freeDaysLeft = (iso: string | undefined, at = Date.now()) => iso ? Math.max(0, Math.ceil((deadlineTime(iso) - at) / 86400000)) : null;
export const STORAGE_FREE_DAYS = 30;
// Terminal storage deadline is the bonded-warehouse entry time plus 30 calendar days.
export function storageFromEntry(entry: string): string {
  const d = new Date(entry.length === 10 ? entry + "T00:00" : entry); d.setDate(d.getDate() + STORAGE_FREE_DAYS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Shipping-line free days run from bonded-warehouse entry: 5 (standard) or 10 (special equipment), never 30.
export const DEMURRAGE_MAX_DAYS = 10;
export function demurrageFromEntry(entry: string, days: number): string {
  const d = new Date(entry.length === 10 ? entry + "T00:00" : entry); d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function demurrageValid(entry: string, dem: string): boolean {
  const e = deadlineTime(entry), d = deadlineTime(dem);
  return d > e && d <= deadlineTime(demurrageFromEntry(entry, DEMURRAGE_MAX_DAYS)) && d < deadlineTime(storageFromEntry(entry));
}

// History filter: an operation matches when its deadline's calendar day falls within the chosen range.
export const inRange = (iso: string | undefined, from: string, to: string) => {
  if (!from && !to) return true;
  if (!iso) return false;
  const d = iso.slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
};
