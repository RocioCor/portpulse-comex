CREATE TABLE public.team_members (user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see own membership" ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
INSERT INTO public.team_members (user_id) VALUES ('74aa7a69-2635-4e6a-b582-42e7a88199da');

CREATE OR REPLACE FUNCTION public.is_team_member(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _uid) $$;

DROP POLICY "Team can view sent alerts" ON public.email_alerts_sent;
CREATE POLICY "Team can view sent alerts" ON public.email_alerts_sent FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));

DROP POLICY "Team adds operations" ON public.operations;
DROP POLICY "Team deletes operations" ON public.operations;
DROP POLICY "Team reads operations" ON public.operations;
DROP POLICY "Team updates operations" ON public.operations;
CREATE POLICY "Team adds operations" ON public.operations FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "Team deletes operations" ON public.operations FOR DELETE TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team reads operations" ON public.operations FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team updates operations" ON public.operations FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

DROP POLICY "Team reads settings" ON public.app_settings;
DROP POLICY "Team updates settings" ON public.app_settings;
DROP POLICY "Team writes settings" ON public.app_settings;
CREATE POLICY "Team reads settings" ON public.app_settings FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team updates settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "Team writes settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));