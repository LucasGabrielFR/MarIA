-- ============================================================
-- Script: Corrige formatação do texto do fluxo de assinatura
-- Problema: O banco contém \n literais (barra+n) em vez de
--           quebras de linha reais. Este script corrige isso
--           e também atualiza os botões com todos os 4 planos.
-- Execute no Supabase SQL Editor.
-- Created At: 2026-05-21
-- ============================================================

-- Passo 1: Define os textos corretos com quebras de linha reais (chr(10))
-- e atualiza todos os campos de texto e botões do fluxo de assinatura

UPDATE public.automatic_flows
SET
    steps = jsonb_build_object(
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
    ),
    updated_at = now()
WHERE key = 'subscription_flow';

-- ============================================================
-- Passo 2: Verificação do resultado
-- ============================================================
SELECT
    key,
    steps->'select_plan'->>'text'   AS texto_select_plan,
    steps->'select_cycle'->>'text'  AS texto_select_cycle,
    steps->'payment_confirmed'->>'text' AS texto_payment_confirmed,
    updated_at
FROM public.automatic_flows
WHERE key = 'subscription_flow';
