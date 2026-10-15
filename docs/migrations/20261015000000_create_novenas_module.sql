-- Migration: 20261015000000_create_novenas_module.sql
-- Módulo de Novenas, Dias e Acompanhamento de Fiéis

-- 1. Tabela Principal de Novenas
CREATE TABLE IF NOT EXISTS public.novenas (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    category TEXT NOT NULL, -- 'marianas', 'santos', 'causas_urgentes', 'jesus', 'espirito_santo', 'liturgicas'
    tags TEXT[] DEFAULT '{}',
    feast_date TEXT, -- 'MM-DD'
    ideal_start_date TEXT,
    image_url TEXT,
    banner_color TEXT DEFAULT '#002D6E',
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela dos Dias da Novena (1 a 9)
CREATE TABLE IF NOT EXISTS public.novena_days (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    novena_id UUID REFERENCES public.novenas(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 9),
    title TEXT NOT NULL,
    opening_prayer TEXT,
    scripture_reading TEXT,
    meditation TEXT NOT NULL,
    daily_prayer TEXT NOT NULL,
    intentions_prompt TEXT,
    concluding_prayer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(novena_id, day_number)
);

-- 3. Tabela de Novenas do Usuário (Progresso e Sincronização)
CREATE TABLE IF NOT EXISTS public.user_novenas (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    novena_id UUID REFERENCES public.novenas(id) ON DELETE CASCADE,
    current_day INTEGER DEFAULT 1 CHECK (current_day BETWEEN 1 AND 9),
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    personal_intention TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_prayed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    reminder_time TEXT DEFAULT '07:00',
    notify_whatsapp BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Logs Diários de Oração
CREATE TABLE IF NOT EXISTS public.user_novena_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_novena_id UUID REFERENCES public.user_novenas(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    channel TEXT DEFAULT 'mobile', -- 'mobile', 'whatsapp'
    prayed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.novenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novena_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_novenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_novena_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for service role on novenas') THEN
        CREATE POLICY "Enable all for service role on novenas" ON public.novenas FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for service role on novena_days') THEN
        CREATE POLICY "Enable all for service role on novena_days" ON public.novena_days FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for service role on user_novenas') THEN
        CREATE POLICY "Enable all for service role on user_novenas" ON public.user_novenas FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for service role on user_novena_logs') THEN
        CREATE POLICY "Enable all for service role on user_novena_logs" ON public.user_novena_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on published novenas') THEN
        CREATE POLICY "Allow public read on published novenas" ON public.novenas FOR SELECT USING (is_published = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on published novena days') THEN
        CREATE POLICY "Allow public read on published novena days" ON public.novena_days FOR SELECT USING (true);
    END IF;
END
$$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_novenas_category ON public.novenas(category);
CREATE INDEX IF NOT EXISTS idx_novenas_published ON public.novenas(is_published);
CREATE INDEX IF NOT EXISTS idx_novena_days_parent ON public.novena_days(novena_id, day_number);
CREATE INDEX IF NOT EXISTS idx_user_novenas_lookup ON public.user_novenas(user_id, status);
