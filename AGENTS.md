<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep terminal storage and empty-container return as independent deadline fields; never derive a shipping-line deadline from storage or a presumed free-day allowance.
- Centralize deadline evaluation in the browser-safe store helpers; preserve legacy date-only values as end-of-day deadlines so existing requests remain readable.
- Render the browser-local request dashboard after hydration to avoid mismatches from dynamic demo timestamps and local timezone formatting.

- Operations live in the Cloud `operations` table (shared by all signed-in team members); Google Sheets is a one-way mirror rewritten by `syncSheet` after each change, never read back — keeps one source of truth and stays within Sheets quotas.
- Email deadline alerts are sent from the linked Gmail by a 15-minute scheduled route; each alert has a stable key recorded in `email_alerts_sent` so it is emailed once (turn reminders once per 2 h cycle).
- Keep operation terminology in the bilingual dictionary and retain persisted identifiers and stage keys when labels change, so existing records remain readable.
