-- Migration: Create system_logs table for persistent incident and error logging
-- Created: 2026-09-24

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'critical')),
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs (level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON public.system_logs (source);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_logs' AND policyname = 'Enable all for service role on system_logs'
    ) THEN
        CREATE POLICY "Enable all for service role on system_logs"
            ON public.system_logs
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
