-- Migration: Migrate exams to prayers table and create daily guides
-- Up
BEGIN;

-- 1. Create the Full Exam Guide
INSERT INTO public.prayers (title, content, category)
VALUES (
    'Exame de Consciência (Completo)',
    '*🌙 Exame de Consciência da Noite — Meditação Privada*

_Coloque-se na Santa Presença de Deus, respire fundo e faça um momento de silêncio interior._

*1. Ação de Graças (Deus em minha vida)*
• Pelo dom da vida, pelo pão de cada dia, pela família e pelas graças invisíveis recebidas hoje: _Dou graças a Deus?_

*2. Amor a Deus (1º ao 3º Mandamento)*
• Deus foi o centro do meu dia, ou dei espaço a idolatrias (ego, dinheiro, vaidade)?
• Rezei com reverência ou de forma mecânica? Usei o santo nome de Deus em vão?

*3. Amor ao Próximo (4º ao 8º Mandamento)*
• Fui paciente e caridoso com minha família, colegas e desconhecidos?
• Guardei mágoa, julguei o próximo, fofoquei ou menti?
• Cumpri com diligência e honestidade os meus deveres de trabalho e estudo?

*4. Pureza de Coração (6º e 9º Mandamento)*
• Guardei a pureza nos meus pensamentos, olhares e no uso do celular/internet?

*5. Omissão e Desejos (10º Mandamento)*
• Deixei de fazer o bem que estava ao meu alcance? Cedi à inveja ou ingratidão?

---

*🙏 Ato de Contrição*
_"Meu Deus, eu me arrependo de todo o coração de Vos ter ofendido, porque Sois tão bom e amável. Prometo, com a Vossa graça, nunca mais pecar e evitar as ocasiões de pecado. Amém."_

_Descanse sob o manto de Nossa Senhora. Boa noite e que Deus te abençoe! 🕊️_',
    'guia'
);

-- 2. Create the Daily Hybrid Guides
INSERT INTO public.prayers (title, content, category) VALUES 
('Exame Guiado - Domingo', 'Foco de Hoje: Ação de Graças, Ressurreição, Alegria e Esperança.', 'guia'),
('Exame Guiado - Segunda', 'Foco de Hoje: Amor a Deus, Espiritualidade, e tempo de oração (1º ao 3º Mandamento).', 'guia'),
('Exame Guiado - Terça', 'Foco de Hoje: Trabalho, estudo, preguiça, honestidade e responsabilidades (7º e 10º Mandamento).', 'guia'),
('Exame Guiado - Quarta', 'Foco de Hoje: Família, honra aos pais, relacionamento com parentes e convivência no lar (4º Mandamento).', 'guia'),
('Exame Guiado - Quinta', 'Foco de Hoje: Amor ao próximo, Eucaristia, missa, caridade, fofocas e mentiras (8º Mandamento).', 'guia'),
('Exame Guiado - Sexta', 'Foco de Hoje: Penitência, sacrifício, mortificação, pureza de pensamentos e corpo, e jejum (6º e 9º Mandamento).', 'guia'),
('Exame Guiado - Sábado', 'Foco de Hoje: Devoção Mariana, paciência, perdão a quem me ofendeu, e virtude da mansidão (5º Mandamento).', 'guia');

-- 3. Deactivate full_exam_text in ai_prompts
UPDATE public.ai_prompts
SET is_active = false
WHERE key = 'full_exam_text';

-- 4. Update the conscience_exam_flow step_confession to include the {{foco_diario}} tag
UPDATE public.automatic_flows
SET steps = jsonb_set(
    steps,
    '{step_confession,text}',
    '"*Passo 2: Exame das Nossas Faltas* 🕯️\n\nAgora, pedindo a luz do Espírito Santo para iluminar com amor a nossa verdade:\n_Onde você sente que fraquejou hoje? Houve alguma atitude impaciente, palavra ríspida, omissão ou tentação que pesou na sua consciência?_\n\n{{foco_diario}}\n\n(Escreva o seu desabafo com total sinceridade. Tudo o que você escrever aqui ficará em sigilo de oração e será apagado após a nossa conversa 🙏)"'
)
WHERE key = 'conscience_exam_flow';

COMMIT;
