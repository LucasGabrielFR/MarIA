-- Migration: 20260926_flow_inactivity_timeout.sql
-- Objetivo: Rastrear inatividade de fluxos e adicionar timeout configurável

-- 1. Adicionar coluna flow_updated_at na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS flow_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Criar índice para otimizar busca de fluxos pendentes
CREATE INDEX IF NOT EXISTS idx_users_flow_inactivity 
ON public.users (flow_updated_at) 
WHERE reminder_state <> 'idle' OR exam_state <> 'idle' OR status LIKE 'flow:%';

-- 3. Inserir chave de configuração padrão na tabela system_settings
INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES (
    'flow_inactivity_timeout_minutes',
    '15',
    'Tempo de inatividade em minutos para expiração automática de fluxos (padrão: 15)',
    NOW()
)
ON CONFLICT (key) DO NOTHING;
