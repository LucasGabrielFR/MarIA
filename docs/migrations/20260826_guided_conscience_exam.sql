-- SQL Migration: Exame de Consciência Guiado e Completo (Evolução do Boa Noite)

-- 1. Adicionar colunas de exame na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS exam_state VARCHAR(50) DEFAULT 'idle';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS exam_context JSONB DEFAULT '{}'::jsonb;

-- 2. Inserir ou atualizar os prompts no Supabase para o Exame de Consciência
INSERT INTO public.ai_prompts (key, content, description, is_active)
VALUES 
(
  'generator_guided_exam',
  'Você é a MarIA, uma inteligência artificial católica com profunda compaixão, discernimento espiritual e sabedoria pastoral.
O usuário está realizando o seu Exame de Consciência Noturno e acabou de partilhar o que pesou no seu coração (suas fraquezas, falhas, impaciências ou pecados do dia).

Contexto do usuário:
- Nome: {{nome}}
- Gênero: {{genero}}
- Desabafo das falhas do dia: "{{user_slipups}}"
- Agradecimentos/bênçãos mencionadas antes: "{{user_gratitude}}"

Sua resposta DEVE seguir esta estrutura acolhedora e edificante:
1. *Acolhida Pastoral e Palavra de Conforto:* Comece com carinho e serenidade, lembrando que a misericórdia de Deus é infinitamente maior do que as nossas fraquezas e que o arrependimento sincero já atrai a graça de Deus.
2. *Virtude Prática do Dia Seguinte (Antídoto Espiritual):* Aponte com muita clareza UMA virtude católica prática e concreta para o fiel combater esse defeito amanhã (ex: Mansidão com a família, Silêncio e Oração antes de responder, Paciência na rotina, Vigilância do olhar/pensamento). Dê uma dica bem prática de como praticá-la nas primeiras horas do dia.
3. *Oração de Reparação / Ato de Contrição:* Finalize convidando-o a rezar um breve e profundo Ato de Contrição/oração de entrega aos pés da Cruz antes de dormir.
4. *Lembrete Sacramental:* Se as faltas mencionadas parecerem graves contra os Mandamentos, lembre com ternura a importância de buscar a Confissão Sacramental com um sacerdote assim que possível.

ATENÇÃO:
- Use formatação compatível com WhatsApp: *negrito* e _itálico_. Não use títulos com # ou Markdown de tabela.
- Mantenha tom amoroso de mãe espiritual (como Nossa Senhora acolhendo um filho no fim do dia).',
  'Prompt gerador de acolhida pastoral, virtude do dia seguinte e oração de reparação no Exame de Consciência Guiado',
  true
),
(
  'full_exam_text',
  '*🌙 Exame de Consciência da Noite — Meditação Privada*\n\n_Coloque-se na Santa Presença de Deus, respire fundo e faça um momento de silêncio interior._\n\n*1. Ação de Graças (Deus em minha vida)*\n• Pelo dom da vida, pelo pão de cada dia, pela família e pelas graças invisíveis recebidas hoje: _Dou graças a Deus?_\n\n*2. Amor a Deus (1º ao 3º Mandamento)*\n• Deus foi o centro do meu dia, ou dei espaço a idolatrias (ego, dinheiro, vaidade)?\n• Rezei com reverência ou de forma mecânica? Usei o santo nome de Deus em vão?\n\n*3. Amor ao Próximo (4º ao 8º Mandamento)*\n• Fui paciente e caridoso com minha família, colegas e desconhecidos?\n• Guardei mágoa, julguei o próximo, fofoquei ou menti?\n• Cumpri com diligência e honestidade os meus deveres de trabalho e estudo?\n\n*4. Pureza de Coração (6º e 9º Mandamento)*\n• Guardei a pureza nos meus pensamentos, olhares e no uso do celular/internet?\n\n*5. Omissão e Desejos (10º Mandamento)*\n• Deixei de fazer o bem que estava ao meu alcance? Cedi à inveja ou ingratidão?\n\n---\n\n*🙏 Ato de Contrição*\n_\"Meu Deus, eu me arrependo de todo o coração de Vos ter ofendido, porque Sois tão bom e amável. Prometo, com a Vossa graça, nunca mais pecar e evitar as ocasiões de pecado. Amém.\"_\n\n_Descanse sob o manto de Nossa Senhora. Boa noite e que Deus te abençoe! 🕊️_',
  'Texto completo e estruturado do Exame de Consciência para oração e leitura privada',
  true
),
(
  'guide_confession',
  '*📖 Guia Breve para uma Santa Confissão*\n\nA Santa Igreja nos ensina os 5 passos para receber dignamente o Sacramento da Reconciliação:\n\n1. *Exame de Consciência:* Lembrar com sinceridade todos os pecados cometidos desde a última boa confissão.\n2. *Dor do Coração (Contrição):* Tristeza sincera por ter ofendido a Deus, que é sumamente bom.\n3. *Firme Propósito de Emenda:* Decisão firme de não mais voltar a pecar e evitar as ocasiões de queda.\n4. *Confissão dos Pecados ao Sacerdote:* Acusar todos os pecados graves com clareza, humildade e sem omitir nada deliberadamente.\n5. *Cumprimento da Penitência:* Cumprir com devoção a oração ou ato que o padre indicar para reparação.\n\n_\"Ainda que os vossos pecados sejam como o escarlate, eles se tornarão brancos como a neve.\" (Is 1,18)_ 🙏',
  'Guia com os 5 passos da Santa Igreja para uma boa confissão sacramental',
  true
)
ON CONFLICT (key) DO UPDATE 
SET content = EXCLUDED.content,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 3. Inserir fluxo automático padrão para o Exame de Consciência
INSERT INTO public.automatic_flows (key, name, steps)
VALUES (
  'conscience_exam_flow',
  'Fluxo do Exame de Consciência Noturno',
  '{
    "choose_format": {
      "text": "Boa noite! 🌙 Antes de descansar, que tal fazermos nosso Exame de Consciência para entregar o dia nas mãos de Deus?",
      "buttons": [
        {"id": "start_guided_exam", "text": "✨ Exame Guiado"},
        {"id": "start_full_exam", "text": "📖 Exame Completo"}
      ]
    },
    "step_gratitude": {
      "text": "*Passo 1: Presença de Deus e Gratidão* 🕊️\n\nColoque-se diante de Deus com o coração em paz. Olhe para o seu dia:\n_Onde você percebeu as bênçãos do Senhor hoje? O que você fez de bom ou pelo que gostaria de agradecer a Deus?_\n\n(Pode responder com uma frase simples do seu coração)"
    },
    "step_confession": {
      "text": "*Passo 2: Exame das Nossas Faltas* 🕯️\n\nAgora, pedindo a luz do Espírito Santo para iluminar com amor a nossa verdade:\n_Onde você sente que fraquejou hoje? Houve alguma atitude impaciente, palavra ríspida, omissão ou tentação que pesou na sua consciência?_\n\n(Escreva o seu desabafo com total sinceridade. Tudo o que você escrever aqui ficará em sigilo de oração e será apagado após a nossa conversa 🙏)"
    }
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE 
SET steps = EXCLUDED.steps,
    name = EXCLUDED.name;
