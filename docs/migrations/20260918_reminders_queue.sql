-- 1. Add new columns to public.prayers
ALTER TABLE public.prayers 
ADD COLUMN IF NOT EXISTS is_selectable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dynamic_ref TEXT DEFAULT null;

-- Set is_selectable to false for Exames de Consciência
UPDATE public.prayers 
SET is_selectable = false 
WHERE title ILIKE '%Exame Guiado%' OR title ILIKE '%Exame de Consciência%';

-- Insert dynamic contents
INSERT INTO public.prayers (title, content, category, is_selectable, dynamic_ref)
VALUES 
('Santo do Dia', 'Conteúdo dinâmico', 'dynamic', true, 'santo_do_dia'),
('Terço Diário', 'Conteúdo dinâmico', 'dynamic', true, 'terco_diario');

-- 2. Add state columns to public.users for reminder flow
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS reminder_state TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS reminder_context JSONB DEFAULT '{}'::jsonb;

-- 3. Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_prayer BOOLEAN DEFAULT false,
    prayer_id UUID REFERENCES public.prayers(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_period TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for service role on reminders"
    ON public.reminders
    FOR ALL
    USING (true)
    WITH CHECK (true);
