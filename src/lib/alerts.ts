import { deadlineStatus, turnReminder, type Req } from "./store";

export type Alert = { key: string; decl: string; port: string; title: string; detail: string };

// Each alert has a stable key so it is emailed once per deadline (or once per 2 h turn cycle).
export function dueAlerts(items: Req[], at = Date.now()): Alert[] {
  const out: Alert[] = [];
  for (const r of items) {
    if (r.stage === "completed") continue;
    const s = deadlineStatus(r.storage, at, 48);
    if (r.entry && r.stage !== "ready" && (s === "warning" || s === "expired")) out.push({ key: `storage:${r.id}:${r.storage}`, decl: r.decl, port: r.port, title: "Almacenaje en terminal vence en 48 h o menos", detail: `Retira la carga antes de ${r.storage.replace("T", " ")} para evitar tarifas del depósito fiscal.` });
    const d = deadlineStatus(r.demurrage, at, 24);
    if (d === "warning" || d === "expired") out.push({ key: `dem:${r.id}:${r.demurrage}`, decl: r.decl, port: r.port, title: "Días libres de contenedor vencen en 24 h o menos", detail: `Devuelve el contenedor vacío antes de ${r.demurrage!.replace("T", " ")} para evitar multas diarias de la naviera.` });
    const t = r.auto ? turnReminder(r, at) : null;
    if (t) out.push({ key: `turn:${r.id}:${r.releasedAt}:${t.count}`, decl: r.decl, port: r.port, title: `Pedir urgente turno terminal (aviso ${t.count})`, detail: "La carga está librada por aduana. Reserva el turno de 2 h en el portal de la terminal." });
  }
  return out;
}
