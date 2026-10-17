-- Migration: Suporte à Autenticação Mobile, Contas por E-mail e Vínculo Omnichannel
-- Data: 2026-10-17

-- 1. Permite que usuários do app criem conta por e-mail antes de vincular o telefone
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- 2. Adiciona campos de e-mail e vínculo com o Supabase Auth (auth.users)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Índices para performance de busca rápida
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

COMMENT ON COLUMN public.users.email IS 'E-mail do usuário cadastrado via aplicativo móvel ou portal';
COMMENT ON COLUMN public.users.auth_user_id IS 'ID do usuário no Supabase Auth (auth.users) para conciliação de sessão';
