CREATE TABLE public.email_alerts_sent (key text PRIMARY KEY, sent_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.email_alerts_sent TO authenticated;
GRANT ALL ON public.email_alerts_sent TO service_role;
ALTER TABLE public.email_alerts_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view sent alerts" ON public.email_alerts_sent FOR SELECT TO authenticated USING (true);