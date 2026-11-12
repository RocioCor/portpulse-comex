import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { dueAlerts } from "@/lib/alerts";
import type { Req } from "@/lib/store";

export const Route = createFileRoute("/api/public/jobs/email-alerts")({
  server: { handlers: { POST: async ({ request }) => {
    const fail = await authenticateCronRequest(request);
    if (fail) return fail;
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data: set } = await sb.from("app_settings").select("key,value").in("key", ["alert_email", "alerts_enabled"]);
    const cfg = Object.fromEntries((set ?? []).map((s) => [s.key, s.value]));
    if (!cfg["alert_email"] || cfg["alerts_enabled"] !== "true") return Response.json({ skipped: true });
    const { data: ops } = await sb.from("operations").select("*");
    const n = (v: number | null) => (v === null ? undefined : Number(v));
    const items = (ops ?? []).map((r) => ({ id: r.id, decl: r.decl, port: r.port, entry: r.entry ?? undefined, storage: r.storage, demurrage: r.demurrage ?? undefined, win: r.win, auto: r.auto, stage: r.stage, releasedAt: n(r.released_at), bookedAt: n(r.booked_at), createdAt: 0 }) as Req);
    const alerts = dueAlerts(items);
    if (!alerts.length) return Response.json({ sent: 0 });
    const { data: done } = await sb.from("email_alerts_sent").select("key").in("key", alerts.map((a) => a.key));
    const seen = new Set((done ?? []).map((d) => d.key));
    const fresh = alerts.filter((a) => !seen.has(a.key));
    if (!fresh.length) return Response.json({ sent: 0 });
    const { sendGmail } = await import("@/lib/gmail.server");
    const body = fresh.map((a) => `• ${a.decl} (${a.port})\n  ${a.title}\n  ${a.detail}`).join("\n\n");
    await sendGmail(cfg["alert_email"], `⚠️ ${fresh.length} aviso(s) de vencimiento – Mesa de Liberación Portuaria`, body);
    await sb.from("email_alerts_sent").insert(fresh.map((a) => ({ key: a.key })));
    return Response.json({ sent: fresh.length });
  } } },
});
