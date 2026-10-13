-- Migration: 20261013000001_add_preferences_to_users.sql
-- Descrição: Adiciona colunas de preferências espirituais e controle de mensagens diárias via WhatsApp na tabela users.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS receive_daily_exam BOOLEAN DEFAULT true;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS receive_daily_saint BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS whatsapp_bridge_enabled BOOLEAN DEFAULT true;

-- Criação de índices para otimizar busca de destinatários nos disparos diários
CREATE INDEX IF NOT EXISTS idx_users_receive_daily_liturgy ON users (receive_daily_liturgy) WHERE receive_daily_liturgy = true;
CREATE INDEX IF NOT EXISTS idx_users_receive_daily_exam ON users (receive_daily_exam) WHERE receive_daily_exam = true;
