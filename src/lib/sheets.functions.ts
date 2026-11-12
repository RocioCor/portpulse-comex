import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const TAB = "Operaciones";
const HEAD = ["DIN", "Puerto / Aduana", "Etapa", "Ingreso depósito fiscal", "Vence almacenaje terminal (30 días)", "Vence naviera / contenedor", "Turno terminal", "Aviso automático", "Creada", "Actualizada"];
const STAGE: Record<string, string> = { pending: "Revisión aduanera pendiente", released: "Librado por aduana", sim_active: "Turno terminal en curso", ready: "Listo para retiro en puerto", completed: "Completado" };
const WIN: Record<string, string> = { not_open: "Pedir urgente", open: "Pedido", closed: "Turno cumplido" };

async function gw(path: string, init: RequestInit = {}) {
  const lk = process.env["LOVABLE_API_KEY"], ck = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lk || !ck) throw new Error("Google Sheets no está conectado.");
  const res = await fetch(GATEWAY + path, { ...init, headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": ck, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  if (!res.ok) { const b = await res.text(); console.error(`Sheets ${res.status}: ${b}`); throw new Error(`Google Sheets respondió ${res.status}`); }
  return res.json();
}

// Mirrors every operation into the team's Google Sheet; the database stays the source of truth.
export const syncSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: setting } = await sb.from("app_settings").select("value").eq("key", "sheet_id").maybeSingle();
    let id = setting?.value;
    if (!id) {
      const created = await gw("/spreadsheets", { method: "POST", body: JSON.stringify({ properties: { title: "Mesa de Liberación Portuaria – Historial" }, sheets: [{ properties: { title: TAB } }] }) });
      id = created.spreadsheetId as string;
      const { error } = await sb.from("app_settings").upsert({ key: "sheet_id", value: id });
      if (error) throw new Error(error.message);
    }
    const { data: ops, error } = await sb.from("operations").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (ops ?? []).map((o) => [o.decl, o.port, STAGE[o.stage] ?? o.stage, o.entry ?? "", o.storage, o.demurrage ?? "", WIN[o.win] ?? o.win, o.auto ? "Sí" : "No", o.created_at, o.updated_at]);
    await gw(`/spreadsheets/${id}/values/${TAB}!A:J:clear`, { method: "POST", body: "{}" });
    await gw(`/spreadsheets/${id}/values/${TAB}!A1:J${rows.length + 1}?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: [HEAD, ...rows] }) });
    return { url: `https://docs.google.com/spreadsheets/d/${id}/edit`, rows: rows.length };
  });
