-- SQL Migration para adicionar a funcionalidade de Liturgia Diária

-- 1. Adicionar coluna receive_daily_liturgy na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS receive_daily_liturgy BOOLEAN DEFAULT false;

-- 2. Atualizar usuários pagos para já possuírem a liturgia diária ativada
UPDATE public.users 
SET receive_daily_liturgy = true 
WHERE subscription_tier = 'premium';

-- 3. Inserir a nova etapa no fluxo de boas-vindas para usuários gratuitos (caso a etapa ask_daily_liturgy ainda não exista)
-- Atenção: O script abaixo atualizará o JSON do welcome_flow, adicionando a etapa se não existir.
UPDATE public.automatic_flows
SET steps = steps || '{"ask_daily_liturgy": {"text": "Gostaria de receber a liturgia todos os dias pela manhã?", "buttons": [{"id": "1", "text": "Sim"}, {"id": "2", "text": "Não"}]}}'::jsonb
WHERE key = 'welcome_flow' AND NOT (steps ? 'ask_daily_liturgy');
