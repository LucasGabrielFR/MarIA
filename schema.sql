-- Tabela de usuários (fiéis)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    expectations TEXT,
    status TEXT DEFAULT 'triage_name', -- triage_name, triage_expectations, active
    credits INTEGER DEFAULT 100, -- Créditos iniciais para novos usuários
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de conversas (para contexto da IA)
CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Logs de uso e analytics
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10, 5) DEFAULT 0,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Banco de Orações
CREATE TABLE prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Liturgia Diária e Santo do Dia
CREATE TABLE daily_liturgy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    reading TEXT,
    gospel TEXT,
    saint_of_day TEXT,
    saint_bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_daily_liturgy_date ON daily_liturgy(date);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
