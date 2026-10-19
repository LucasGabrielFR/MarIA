-- Migration: Create automatic_flows table and add welcome prompts
-- Created At: 2026-05-20
-- Updated At: 2026-05-21 (fix: usar quebras de linha reais via jsonb_build_object)

-- Create automatic_flows table
CREATE TABLE IF NOT EXISTS public.automatic_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    steps JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.automatic_flows ENABLE ROW LEVEL SECURITY;

-- Admins can manage automatic_flows policy
CREATE POLICY "Admins can manage automatic_flows" 
ON public.automatic_flows 
FOR ALL 
TO authenticated 
USING (check_is_admin()) 
WITH CHECK (check_is_admin());

-- Anyone can read active automatic_flows policy
CREATE POLICY "Anyone can read active automatic_flows" 
ON public.automatic_flows 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- ============================================================
-- Seed: subscription_flow com quebras de linha reais
-- Nota: jsonb_build_object garante que as strings são
--       armazenadas com newlines reais (chr(10)), evitando
--       o problema de \n literal no JSONB.
-- ============================================================
INSERT INTO public.automatic_flows (key, name, steps)
VALUES (
    'subscription_flow',
    'Fluxo de Assinatura de Planos',
    jsonb_build_object(
        'select_plan', jsonb_build_object(
            'text', 'Olá! Que bom que você quer assinar a MarIA. ✨

Conheça nossos planos:

*📘 Plano Básico*
Para quem busca direcionamento e uma companhia diária constante.
• Tudo do gratuito (Liturgia, Santo do Dia e Terço)
• *300 mensagens/mês* conversando com a IA
• Aconselhamento emocional profundo
• Tira-dúvidas com base teológica e do Catecismo
• A partir de *R$ 14,90/mês* (ou *R$ 12,90/mês* no anual)

*✨ Plano Premium*
Para quem deseja imersão teológica e oração intensa.
• Tudo do plano Básico
• *600 mensagens/mês* conversando com a IA
• Respostas mais elaboradas e longas
• Acompanhamento diário rigoroso
• A partir de *R$ 29,90/mês* (ou *R$ 26,90/mês* no anual)

_Escolha o plano nos botões abaixo. Na próxima etapa você define se prefere pagamento mensal ou anual._',
            'buttons', '[
                {"id": "1", "text": "Básico"},
                {"id": "2", "text": "Premium"},
                {"id": "3", "text": "Cancelar"}
            ]'::jsonb
        ),
        'select_cycle', jsonb_build_object(
            'text', '{upgrade_warning}Plano *{tier_label}* selecionado.

Escolha a *forma de pagamento*:

{plan_options}

_Use os botões abaixo._',
            'buttons', '[
                {"id": "1", "text": "Mensal"},
                {"id": "2", "text": "Anual"},
                {"id": "3", "text": "Voltar"}
            ]'::jsonb
        ),
        'payment_confirmed', jsonb_build_object(
            'text', '🎉 *Seja muito bem-vindo ao Plano {tier_label} da MarIA!* 🎉

Sua assinatura foi confirmada com sucesso no Asaas! 🌟

Agora você tem acesso a mais recursos e limites aumentados. Que a sua jornada espiritual seja ricamente abençoada. Estou muito feliz em te acompanhar de perto! 🙏✨

💡 *Dica:* Se precisar ver seu limite de mensagens ou tirar dúvidas sobre sua conta, basta enviar a palavra *Painel* ou *Ajuda* a qualquer momento.

Que o amor maternal de Maria Santíssima te guarde hoje e sempre! 🕊️💙',
            'buttons', '[]'::jsonb
        )
    )
)
ON CONFLICT (key) DO UPDATE SET
    steps = EXCLUDED.steps,
    updated_at = now();

-- ============================================================
-- Seed welcome prompts in public.ai_prompts
-- ============================================================
INSERT INTO public.ai_prompts (key, name, content, description, is_active)
VALUES 
(
    'welcome_basic',
    'Mensagem de Boas-Vindas Plano Básico',
    '🎉 *Sua assinatura do Plano Básico foi ativada com sucesso!* 

Seja muito bem-vindo à família MarIA! Agora você tem direito a 300 mensagens gerativas mensais com as nossas IAs teológicas e pastorais avançadas. Além disso, você continua com acesso totalmente ilimitado às Liturgias e ao Santo do Dia, que não consomem a sua cota. 

Que as bênçãos de Deus e o amor maternal de Maria Santíssima guiem a sua caminhada de fé e oração hoje e sempre! 🙏✨',
    'Mensagem enviada automaticamente pelo bot do WhatsApp assim que o pagamento do Plano Básico for confirmado no Asaas.',
    true
),
(
    'welcome_premium',
    'Mensagem de Boas-Vindas Plano Premium',
    '🌟 *Sua assinatura do Plano Premium foi ativada com sucesso!* 

Seja muito bem-vindo ao mais alto nível de vivência espiritual na MarIA! Agora você tem direito a 600 mensagens gerativas mensais para interagir livremente e aprofundar seus estudos, orações e aconselhamentos. Liturgias, roteiro do Rosário e Santo do Dia são totalmente ilimitados e sem consumo de cotas. 

Que a Virgem Maria te envolva sob o seu manto sagrado, e que o Espírito Santo inunde o seu coração de paz, sabedoria e amor divino! Estamos muito felizes em caminhar junto com você! 🙏💙✨',
    'Mensagem enviada automaticamente pelo bot do WhatsApp assim que o pagamento do Plano Premium for confirmado no Asaas.',
    true
)
ON CONFLICT (key) DO NOTHING;
