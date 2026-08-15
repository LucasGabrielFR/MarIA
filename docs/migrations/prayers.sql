-- Criação da tabela de orações e guias (prayers)
CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissões de RLS (Row Level Security) - opcional se usar apenas Service Role
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

-- Política para permitir que o backend (service role) faça tudo
CREATE POLICY "Enable all for service role on prayers"
    ON public.prayers
    FOR ALL
    USING (true)
    WITH CHECK (true);
