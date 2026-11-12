CREATE TABLE public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decl text NOT NULL,
  port text NOT NULL,
  entry text,
  storage text NOT NULL,
  demurrage text,
  win text NOT NULL DEFAULT 'not_open',
  auto boolean NOT NULL DEFAULT true,
  stage text NOT NULL DEFAULT 'pending',
  sim_opened_at bigint,
  notified_at bigint,
  released_at bigint,
  booked_at bigint,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations TO authenticated;
GRANT ALL ON public.operations TO service_role;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads operations" ON public.operations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team adds operations" ON public.operations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team updates operations" ON public.operations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team deletes operations" ON public.operations FOR DELETE TO authenticated USING (true);

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team writes settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team updates settings" ON public.app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.operations (decl, port, entry, storage, demurrage, win, auto, stage, sim_opened_at, notified_at) VALUES
 ('DIN-2026-004581','San Antonio', to_char(now() - interval '4 days','YYYY-MM-DD"T"HH24:MI'), to_char(now() + interval '26 days','YYYY-MM-DD"T"HH24:MI'), to_char(now() + interval '1 day','YYYY-MM-DD"T"HH24:MI'),'open',true,'sim_active',(extract(epoch from now())*1000)::bigint - 4500000,(extract(epoch from now())*1000)::bigint - 4500000),
 ('DIN-2026-004602','Valparaíso', to_char(now() - interval '2 days','YYYY-MM-DD"T"HH24:MI'), to_char(now() + interval '28 days','YYYY-MM-DD"T"HH24:MI'), to_char(now() + interval '3 days','YYYY-MM-DD"T"HH24:MI'),'not_open',true,'pending',NULL,NULL),
 ('DIN-2026-004377','Punta Arenas', to_char(now() - interval '5 days','YYYY-MM-DD"T"HH24:MI'), to_char(now() + interval '25 days','YYYY-MM-DD"T"HH24:MI'), to_char(now() + interval '5 hours','YYYY-MM-DD"T"HH24:MI'),'closed',false,'ready',NULL,NULL),
 ('DIN-2026-004120','Iquique', to_char(now() - interval '6 days','YYYY-MM-DD"T"HH24:MI'), to_char(now() + interval '24 days','YYYY-MM-DD"T"HH24:MI'), to_char(now() + interval '4 days','YYYY-MM-DD"T"HH24:MI'),'closed',true,'completed',NULL,NULL);