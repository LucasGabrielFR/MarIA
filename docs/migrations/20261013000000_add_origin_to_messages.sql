-- Migration: Adicionar coluna 'origin' na tabela 'messages' para distinguir mensagens do WhatsApp e do Aplicativo Móvel
-- Formato padrão Supabase: YYYYMMDDHHMMSS_add_origin_to_messages.sql

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'whatsapp';

-- Atualiza mensagens históricas existentes para garantir consistência
UPDATE public.messages 
SET origin = 'whatsapp' 
WHERE origin IS NULL;

-- Índice para acelerar filtros por canal (WhatsApp ou Mobile) no painel e relatórios
CREATE INDEX IF NOT EXISTS idx_messages_origin ON public.messages (origin);

-- Comentário explicativo na coluna
COMMENT ON COLUMN public.messages.origin IS 'Canal de origem da mensagem: whatsapp ou mobile';
