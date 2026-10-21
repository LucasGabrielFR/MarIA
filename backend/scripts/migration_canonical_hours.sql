-- Migration: Canonical Hours (Liturgia das Horas / Ofício Divino)
-- Tables in English following MarIA database standards

CREATE TABLE IF NOT EXISTS public.canonical_hours_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    psalter_week SMALLINT NOT NULL CHECK (psalter_week BETWEEN 1 AND 4),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    hour_type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    hymn JSONB NOT NULL DEFAULT '{}'::jsonb,
    psalmody JSONB NOT NULL DEFAULT '[]'::jsonb,
    brief_reading JSONB DEFAULT '{}'::jsonb,
    responsory JSONB DEFAULT '{}'::jsonb,
    evangelical_canticle JSONB DEFAULT '{}'::jsonb,
    intercessions JSONB DEFAULT '{}'::jsonb,
    closing_prayer TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_catalog_week_day_hour UNIQUE (psalter_week, day_of_week, hour_type)
);

CREATE TABLE IF NOT EXISTS public.daily_canonical_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    hour_type VARCHAR(30) NOT NULL,
    liturgical_color VARCHAR(30) NOT NULL DEFAULT 'green',
    liturgical_rank VARCHAR(40) NOT NULL DEFAULT 'ferial',
    celebration_title VARCHAR(255) NOT NULL,
    source_url TEXT,
    has_memorial BOOLEAN NOT NULL DEFAULT FALSE,
    memorial_title VARCHAR(255),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    memorial_content JSONB DEFAULT NULL,
    ferial_content JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_daily_canonical_hours_date_hour UNIQUE (date, hour_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_canonical_hours_date ON public.daily_canonical_hours(date);
CREATE INDEX IF NOT EXISTS idx_daily_canonical_hours_hour_type ON public.daily_canonical_hours(hour_type);

-- RLS Policies
ALTER TABLE public.canonical_hours_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_canonical_hours ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'canonical_hours_catalog' AND policyname = 'Allow public read access on canonical_hours_catalog'
    ) THEN
        CREATE POLICY "Allow public read access on canonical_hours_catalog"
            ON public.canonical_hours_catalog FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'daily_canonical_hours' AND policyname = 'Allow public read access on daily_canonical_hours'
    ) THEN
        CREATE POLICY "Allow public read access on daily_canonical_hours"
            ON public.daily_canonical_hours FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;
END $$;
