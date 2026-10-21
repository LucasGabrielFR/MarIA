-- Migration: 20261020000000_enhance_reminders_and_novenas.sql
-- Description: Suporte a ferramentas espirituais desacopladas, horários livres e disparos de novenas no WhatsApp.

-- 1. Ampliação da tabela public.reminders para sincronização com o App
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS tool_type TEXT DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS reminder_time TEXT DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS custom_text TEXT,
ADD COLUMN IF NOT EXISTS send_whatsapp BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE;

-- Índices para performance de busca e reconciliação
CREATE INDEX IF NOT EXISTS idx_reminders_user_external ON public.reminders(user_id, external_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status_sched ON public.reminders(status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_reminders_tool_type ON public.reminders(tool_type);

-- 2. Ampliação da tabela public.user_novenas para controle de envio diário no WhatsApp
ALTER TABLE public.user_novenas 
ADD COLUMN IF NOT EXISTS last_whatsapp_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_user_novenas_whatsapp_sched 
ON public.user_novenas(status, notify_whatsapp, reminder_time);
