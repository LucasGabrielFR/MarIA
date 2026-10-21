-- ==============================================================================
-- Migration: 20261021000000_create_password_resets.sql
-- Descrição: Criação da tabela dedicada de tokens OTP para recuperação de senha
--            no aplicativo móvel MarIA.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca rápida de código ativo por e-mail
CREATE INDEX IF NOT EXISTS idx_password_resets_email_code 
ON public.password_resets (email, code) 
WHERE used_at IS NULL;

-- Habilita Row Level Security (RLS)
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Política de acesso restrita ao service_role (backend da aplicação)
CREATE POLICY service_role_all ON public.password_resets
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
