-- ==============================================================================
-- Migration: 20261014000000_create_user_spiritual_plans.sql
-- Descrição: Tabela para persistência em nuvem do Plano de Vida Espiritual Personalizado
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_spiritual_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    habits JSONB NOT NULL DEFAULT '[]'::jsonb,
    streak_days INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_spiritual_plans_user UNIQUE (user_id)
);

-- Índice para consultas rápidas por usuário
CREATE INDEX IF NOT EXISTS idx_user_spiritual_plans_user_id 
    ON public.user_spiritual_plans (user_id);

-- Habilitar RLS
ALTER TABLE public.user_spiritual_plans ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Acesso total para service_role (usado pelo backend NestJS)
CREATE POLICY "Enable all for service role on user_spiritual_plans"
    ON public.user_spiritual_plans
    FOR ALL
    USING (true)
    WITH CHECK (true);
