UPDATE public.operations SET created_by = '74aa7a69-2635-4e6a-b582-42e7a88199da' WHERE created_by IS NULL;
DROP POLICY "Team adds operations" ON public.operations;
DROP POLICY "Team deletes operations" ON public.operations;
DROP POLICY "Team reads operations" ON public.operations;
DROP POLICY "Team updates operations" ON public.operations;
CREATE POLICY "Own operations insert" ON public.operations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Own operations delete" ON public.operations FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Own operations read" ON public.operations FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Own operations update" ON public.operations FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE TABLE public.user_sheets (user_id uuid PRIMARY KEY DEFAULT auth.uid(), sheet_id text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sheets TO authenticated;
GRANT ALL ON public.user_sheets TO service_role;
ALTER TABLE public.user_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sheet" ON public.user_sheets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());