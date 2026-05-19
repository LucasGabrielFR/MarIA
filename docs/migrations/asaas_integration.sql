-- Adiciona campos para o Asaas na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(255);

-- O campo plan_tier já existe no projeto base (normalmente free, basic, premium), 
-- mas garantimos que está lá. Se o seu projeto usava outro nome, adapte conforme necessário.
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(50) DEFAULT 'free';

-- Cria a tabela de magic_links (se você não tiver rodado do Stripe ainda)
CREATE TABLE IF NOT EXISTS magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_users_asaas_customer_id ON users(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_asaas_subscription_id ON users(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
