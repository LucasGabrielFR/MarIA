# MarIA — Plataforma de Marca e Descrição Institucional

> Documento-base para comunicar, apresentar e evoluir a marca MarIA. Descreve o produto existente no repositório em 23 de outubro de 2026; funcionalidades dependentes de configuração externa devem ser apresentadas como disponíveis somente após sua ativação.

## 1. Essência da marca

**MarIA é um companheiro católico de oração e vida espiritual, presente no WhatsApp e em um aplicativo próprio.** Une acolhimento conversacional, conteúdo devocional e ferramentas para ajudar cada pessoa a cultivar uma rotina de fé no cotidiano.

### Ideia central

Um espaço digital de acolhimento e oração que acompanha o fiel onde ele já está — no WhatsApp ou no seu próprio santuário digital.

### Propósito

Aproximar a vida cotidiana da oração e da tradição católica, oferecendo recursos acessíveis para rezar, aprender, refletir e manter uma caminhada espiritual constante.

### Posicionamento

Para pessoas que desejam viver a fé católica com mais constância e encontrar orientação devocional no dia a dia, a MarIA é uma plataforma de acolhimento e prática espiritual que combina conversa por inteligência artificial, conteúdo católico e um aplicativo de oração. Diferentemente de um chatbot genérico ou de uma biblioteca estática, ela integra conversa, liturgia, devoções, lembretes e acompanhamento de hábitos em uma experiência conectada.

### Promessa de marca

**Ajudar você a encontrar, no ritmo da vida real, um momento para rezar, refletir e permanecer perto de Deus.**

Essa promessa expressa a finalidade do produto, não garante resultados espirituais, aconselhamento infalível ou disponibilidade ininterrupta.

## 2. O que é a MarIA

MarIA é uma plataforma católica digital composta por canais complementares:

- **MarIA no WhatsApp:** conversa de acolhimento e apoio devocional em um canal familiar, com recursos conversacionais, conteúdo diário, orações, fluxos guiados e lembretes configuráveis.
- **Aplicativo MarIA:** experiência mobile multiplataforma em Flutter, também disponibilizada como aplicação Web/PWA no ambiente do projeto. Reúne um espaço inicial de oração, liturgia, devoções, plano de vida espiritual, recursos de preparação para a Confissão e conversa com a MarIA.
- **Painel administrativo:** ferramenta interna para administrar conteúdo, usuários, planos, configurações, comunicação operacional e indicadores. Não é uma funcionalidade voltada ao fiel.
- **Landing page e área de assinante:** apresentam o serviço e seus planos, encaminham o checkout e permitem consultar fluxos relacionados à assinatura.

As superfícies compartilham serviços e dados do backend quando o fluxo está configurado para sincronização. A experiência e a disponibilidade de cada recurso podem variar por canal, conta, plataforma, permissões do aparelho e configuração operacional.

## 3. A experiência do fiel

### 3.1 Acolhimento e conversa no WhatsApp

O fiel pode iniciar uma conversa em linguagem natural e encontrar uma interlocutora digital com tom acolhedor, respeitoso e inspirado na espiritualidade mariana. A MarIA pode apoiar conversas cotidianas sobre fé, oferecer orações e conteúdos devocionais, responder perguntas religiosas e conduzir fluxos interativos disponíveis no sistema.

O motor conversacional combina regras e roteamento de intenção, instruções administráveis, modelos de linguagem e integrações de consulta. Para perguntas teológicas, há integração com Magisterium AI e recuperação semântica; quando pertinente e disponível, o sistema pode consultar informações atuais. Respostas geradas por IA podem conter erros e devem ser discernidas, especialmente em temas doutrinais, pastorais, médicos, psicológicos, jurídicos ou de emergência.

No canal WhatsApp também existem fluxos operacionais para preferências, orações, liturgia, lembretes, novenas, suporte a planos e interações estruturadas por botões. A entrega depende da disponibilidade do serviço WhatsApp/UAZAPI e das permissões e condições da conta do usuário.

### 3.2 Aplicativo: um santuário digital pessoal

O aplicativo oferece uma experiência de oração e organização da vida espiritual, incluindo:

- **Início litúrgico:** acolhida, tempo e cor litúrgicos, liturgia do dia, Santo do Dia e destaques editoriais publicados pela Curadoria.
- **Liturgia diária:** consulta do conteúdo litúrgico do dia, com dados servidos pelo backend e recursos de cache local para apoiar a continuidade de uso.
- **Liturgia das Horas:** acesso ao Ofício Divino e às sete horas canônicas — Ofício das Leituras, Laudes, Terça, Sexta, Nona, Vésperas e Completas — com apresentação própria para leitura orante. A disponibilidade de textos depende das fontes e dos dados canônicos integrados.
- **Orações e Santo Terço:** biblioteca de orações e modos guiados/interativos de oração do terço, com recursos de acompanhamento da prática.
- **Novenas:** catálogo de novenas, percurso de nove dias, registro de progresso e opções de lembrete conforme os recursos configurados.
- **Plano de Vida Espiritual:** criação e acompanhamento de hábitos devocionais, sequência de dias e sincronização resiliente, com suporte local/offline em partes do fluxo.
- **Lembretes:** organização de horários e práticas; lembretes locais no aparelho podem coexistir com a opção de receber lembretes pelo WhatsApp. A pessoa pode configurar preferências disponíveis no app.
- **Preparação para a Confissão:** exame de consciência guiado, incluindo reflexão pelos Mandamentos, e um cofre local protegido pelo mecanismo de segurança disponível no aparelho. É uma ferramenta de preparação, não o Sacramento da Reconciliação.
- **Chat com a MarIA:** conversa de apoio devocional dentro do app, usando o mesmo pipeline central de IA do produto.
- **Destaques editoriais:** conteúdos escolhidos pela equipe podem aparecer na Home e levar a áreas específicas do aplicativo.
- **Notificações push remotas:** canal opcional para campanhas devocionais gerais, separado dos lembretes pessoais locais. Requer consentimento, registro e configuração do Firebase/plataforma; no iOS depende adicionalmente de APNs e capacidades Apple.

Alguns recursos exigem conta ou acesso autenticado. O modo sem conta é restrito. A persistência offline existe para fluxos/conteúdos específicos e não significa que todas as áreas funcionem sem conexão.

### 3.3 Continuidade entre canais

Quando o fiel vincula e autentica sua conta, recursos selecionados podem manter continuidade entre app, backend e WhatsApp: preferências, hábitos e lembretes, por exemplo. A integração não deve ser descrita como sincronização universal e instantânea de todo o conteúdo ou de todo histórico; cada fluxo tem seu próprio escopo e depende de conexão e configuração.

## 4. Experiência de gestão e operação

O painel administrativo permite à equipe operar o ecossistema, com áreas para:

- acompanhar usuários, conversas, métricas e saúde operacional;
- configurar persona, prompts, modelos de IA e fluxos automatizados;
- administrar conteúdo diário, orações e novenas;
- acompanhar planos, pagamentos e rotinas relacionadas à assinatura;
- gerenciar usuários, campanhas e comunicações do canal WhatsApp;
- fazer curadoria do aplicativo por meio de destaques da Home e campanhas push imediatas ou agendadas;
- consultar métricas de uso mobile e indicadores técnicos agregados.

As métricas mobile são pensadas para registrar eventos técnicos de uso — como sessões, telas e falhas — sem incluir conteúdo de conversas ou orações nos eventos analíticos descritos pelo projeto. Isso não equivale a uma promessa geral de anonimato: dados de conta e dados tratados por outros fluxos seguem suas próprias finalidades, controles e documentos de privacidade.

## 5. Jornada comercial

A Landing apresenta a proposta e os planos carregados do backend. O fluxo de assinatura usa o Asaas para checkout; após a confirmação, o site acompanha o status e apresenta um código de ativação para continuar o processo pelo WhatsApp. Há também fluxos de acesso à área de assinante por link enviado ao WhatsApp e operações de consulta/gestão da assinatura.

Planos, preços, limites, disponibilidade de pagamento, termos e elegibilidade podem mudar por configuração comercial. Portanto, textos de campanha não devem fixar valores ou condições sem validá-los na configuração vigente.

## 6. Personalidade e voz

### A MarIA deve soar

- acolhedora e serena, sem infantilizar;
- próxima e respeitosa, sem fingir ser humana;
- católica, sem inventar autoridade eclesial;
- simples e clara, explicando termos religiosos quando necessário;
- esperançosa, sem prometer milagres ou resultados;
- prudente diante de sofrimento, vulnerabilidade ou questões fora do escopo devocional.

### Princípios de linguagem

1. Acolher antes de instruir.
2. Usar linguagem natural e calorosa, sem dramatização emocional nem dependência afetiva.
3. Distinguir ensinamento oficial, tradição, interpretação e conteúdo gerado por IA.
4. Quando houver fontes disponíveis, apresentá-las com clareza e não fabricar citações.
5. Não se apresentar como Nossa Senhora, Jesus, sacerdote, terapeuta ou pessoa real. A referência mariana inspira o tom de acolhimento da marca; não significa personificação literal nem comunicação sobrenatural.
6. Incentivar o contato com sacerdote, comunidade e profissionais qualificados quando a situação pedir.

## 7. Fundamentos e limites de confiança

MarIA é uma ferramenta digital de apoio à oração, à formação e à organização de práticas devocionais. Não é uma autoridade oficial da Igreja, não representa uma diocese ou ordem religiosa por si só e não substitui:

- os sacramentos ou a participação na vida da Igreja;
- a Confissão sacramental, direção espiritual ou orientação de um sacerdote;
- atendimento médico, psicológico, jurídico ou serviços de emergência;
- discernimento pessoal e comunitário.

Embora o produto use fontes católicas, conteúdo litúrgico integrado e mecanismos para orientar respostas, sistemas de IA podem produzir respostas incompletas, desatualizadas ou incorretas. Em questões importantes, confira as fontes e procure orientação humana competente.

## 8. Privacidade e cuidado

Conversas espirituais podem ser sensíveis. A comunicação pública deve ser estritamente compatível com a Política de Privacidade vigente e com os controles efetivamente implementados. Não dizer “sigilo absoluto”, “criptografia ponta a ponta” ou “ninguém pode ler” sem comprovação técnica e jurídica específica. O cofre de preparação para Confissão é local ao aplicativo; isso não significa que todas as conversas da plataforma tenham o mesmo armazenamento ou proteção.

O produto deve solicitar apenas permissões necessárias, explicar opt-ins de notificações e respeitar a opção de desativá-las. Push de campanhas, lembretes locais e mensagens pelo WhatsApp são mecanismos distintos.

## 9. Identidade visual e direção de design

Esta seção registra a identidade visual observada no aplicativo e propõe a direção que a Landing deve seguir. Os valores de cor e tipografia abaixo são referências encontradas no design system do app; a aplicação na Landing deve ser harmonizada durante o redesign, não copiada mecanicamente.

### Conceito visual

**Santuário Digital: mariano, sereno, luminoso e contemporâneo.** A interface deve evocar recolhimento, confiança e esperança sem parecer antiga, pesada ou excessivamente ornamental. A tradição aparece em detalhes — azul profundo, ouro, tipografia clássica e símbolos discretos — enquanto navegação, leitura e interação permanecem simples e atuais.

Palavras-guia: **serenidade, acolhimento, reverência, clareza, luz, presença e simplicidade**.

### Marca e assinatura

- Usar a grafia **MarIA**, preservando o “IA” em maiúsculas como parte distintiva do nome.
- Tratar o símbolo/logotipo premium existente como assinatura principal; não redesenhar, distorcer, inclinar, recortar ou aplicar efeitos que prejudiquem seu reconhecimento.
- Manter área de respiro em torno da marca e garantir uma versão legível em fundos claros e escuros. Se ainda não existir variante oficial para ambos, defini-la antes de produzir aplicações permanentes.
- A marca deve aparecer acompanhada por uma promessa humana — oração e vida espiritual — e não ser reduzida à ideia de “robô” ou “chatbot”.
- Não usar imagens geradas como se fossem o logotipo oficial nem representar Nossa Senhora como se fosse a própria IA.
- Este documento define direção de marca, não confirma registro legal do nome ou exclusividade da marca.

### Paleta cromática

O aplicativo já adota azul mariano e ouro sacro como cores centrais, com superfícies claras e um modo escuro azul-noite. A Landing atual também usa azul e ouro, mas seus fundos e tipografia ainda não refletem integralmente o sistema do app. Para o novo design, consolidar os seguintes papéis:

| Papel | Referência | Uso esperado |
| --- | --- | --- |
| Azul mariano | `#0047AB` | Ações primárias, links ativos e assinatura de marca. |
| Azul profundo | `#002D6E` | Gradientes, blocos de profundidade e estados de foco em fundos claros. |
| Azul-noite | `#001B44` | Títulos, navegação e superfícies escuras com caráter contemplativo. |
| Azul celestial | `#2563EB` | Destaques funcionais pontuais; não competir com o azul principal. |
| Azul-gelo | `#EFF6FF` | Fundos de apoio, cards e áreas informativas suaves. |
| Ouro sacro | `#D4AF37` | Acentos, pequenos detalhes, ícones e chamadas cerimoniais. Usar com parcimônia. |
| Ouro claro / profundo | `#FDE68A` / `#A67C1E` | Variações de gradiente, decoração ou contorno; verificar contraste antes de aplicar em texto. |
| Fundo claro | `#F4F7FC` ou branco | Base luminosa e espaçosa para leitura. |
| Texto principal | `#001B44` | Texto sobre fundos claros; em fundos escuros usar branco suave. |
| Texto secundário | `#334E68` | Texto auxiliar legível e hierarquia menos enfática. |

As cores litúrgicas — verde `#15803D`, roxo `#6B21A8`, vermelho `#B91C1C`, branco `#FAF9F6` e rosa `#DB2777` — pertencem a conteúdos e estados litúrgicos específicos. Não devem substituir as cores de marca nem ser usadas como decoração genérica. O significado litúrgico deve continuar identificável e não depender apenas da cor.

**Contraste e acessibilidade:** ouro é acento, não cor padrão de parágrafos ou texto pequeno. Validar contraste de texto, botões, estados e ícones nos temas claro e escuro; nunca comunicar estado somente por cor. Azul e ouro juntos devem manter legibilidade, inclusive em telas móveis.

### Tipografia

- **Cinzel:** títulos litúrgicos, nomes de seções especiais e momentos de solenidade. Usar em doses pequenas; parágrafos longos em caixa alta ou serifas ornamentais prejudicam leitura.
- **Plus Jakarta Sans:** fonte de interface para títulos funcionais, corpo, formulários, botões e textos corridos do aplicativo.
- **Landing:** pode manter uma sans-serif de leitura confortável e personalidade contemporânea, mas deve compartilhar proporções, pesos e hierarquia com o app. Usar Cinzel como acento editorial em vez de aplicá-la em toda a página.
- Priorizar tamanho responsivo, entrelinha confortável, largura de leitura moderada e suporte a ampliação de texto do navegador/aparelho.

### Fotografia, ilustração e iconografia

- Priorizar imagens reais e autorizadas do produto — telas atuais do aplicativo e conversas demonstrativas revisadas — em vez de mockups que mostrem funcionalidades inexistentes.
- Fotografia deve transmitir quietude, luz natural, vida cotidiana e devoção autêntica. Evitar imagens genéricas de banco, sentimentalismo exagerado, excesso de brilho ou representações que sugiram aparição/sobrenaturalidade.
- Elementos marianos, estrelas, rosário, vitral ou auréola podem aparecer como grafismos discretos, sem transformar cada seção em decoração religiosa literal.
- Usar ícones simples, consistentes e reconhecíveis; reservar ornamentos para separadores, pequenos detalhes e momentos de transição.
- Garantir licenças e direitos de uso de fotografias, fontes, ilustrações, ícones e música antes da publicação.

### Composição e componentes

- Manter composição arejada, com bastante espaço negativo, hierarquia clara e blocos de conteúdo de leitura rápida.
- Usar superfícies claras com bordas suaves e sombras leves; vidro translúcido e gradientes podem aparecer em pequenas áreas, sem reduzir contraste nem criar aparência de painel corporativo.
- Cards de recursos devem explicar benefício primeiro e recurso depois; evitar paredes de texto e listas extensas de funcionalidades no primeiro contato.
- CTAs devem ser poucos, claros e consistentes: uma ação principal por seção, com alternativa secundária menos proeminente.
- No mobile, priorizar uma coluna, áreas de toque confortáveis, texto legível e demonstrações do app que se ajustem à tela sem cortes essenciais.
- A experiência comercial (planos, checkout e conta) deve preservar a mesma identidade, mas com prioridade visual para legibilidade, confiança e compreensão das condições.

### Movimento e interação

- Animações devem sugerir calma e continuidade: revelações suaves ao rolar, transições curtas entre telas e movimento sutil de elementos decorativos.
- Evitar parallax intenso, movimento contínuo que distraia, carrosséis que avançam rápido e efeitos que atrasem a leitura ou o acesso ao checkout.
- Respeitar `prefers-reduced-motion`, disponibilizar estados de foco/hover/touch claros e manter navegação completa por teclado.
- Toda animação deve ser progressiva: conteúdo essencial continua visível quando JavaScript, observadores de rolagem ou animações não estiverem disponíveis.

### Critérios para avaliar o redesign

1. A página parece ser a extensão web do mesmo produto do app, sem perder a personalidade própria de uma Landing de conversão.
2. Azul mariano e ouro são reconhecíveis, mas o ouro não compete com conteúdo nem compromete contraste.
3. O visual comunica acolhimento e oração antes de tecnologia; IA é explicada como meio, não como centro da promessa.
4. Capturas e demonstrações correspondem às telas e aos fluxos realmente existentes.
5. Tipografia, movimentos, imagens e componentes funcionam em mobile, desktop, teclado e preferências de movimento reduzido.
6. Planos, preços, permissões e disponibilidade são apresentados com precisão e mantidos sincronizados com a configuração vigente.

## 10. Mensagens de marca

### Descrição curta

**MarIA é um companheiro católico de oração no WhatsApp e no aplicativo. Encontre acolhimento, liturgia, orações e recursos para cultivar sua vida espiritual todos os dias.**

### Descrição institucional

**A MarIA é uma plataforma católica de acolhimento e vida espiritual criada para acompanhar o fiel no cotidiano. Pelo WhatsApp e por um aplicativo próprio, reúne conversa de apoio devocional com inteligência artificial, liturgia diária e Liturgia das Horas, orações, Santo Terço, novenas, plano de vida espiritual e lembretes configuráveis. Seu propósito é ajudar cada pessoa a criar espaço para a oração e aprofundar a vivência da fé, com uma experiência simples, conectada e inspirada na tradição católica. A MarIA é uma ferramenta de apoio: não substitui os sacramentos, a comunidade, o acompanhamento sacerdotal nem profissionais qualificados.**

### Assinaturas possíveis

- **Um espaço de oração no ritmo da sua vida.**
- **Acolhimento, oração e fé para o seu dia a dia.**
- **Sua caminhada de fé, no WhatsApp e no seu santuário digital.**

Usar uma assinatura como hipótese de comunicação até validação final da identidade visual e da Landing.

## 11. Texto-base de apresentação

Há dias em que tudo o que precisamos é de uma pausa, uma palavra que nos ajude a refletir e um momento para voltar o coração a Deus. A MarIA reúne esse espaço de acolhimento em dois lugares do seu cotidiano: no WhatsApp e em um aplicativo feito para a vida de oração.

Converse sobre suas dúvidas e intenções, encontre orações e conteúdos da tradição católica, acompanhe a liturgia, reze o terço, percorra uma novena e organize hábitos espirituais com lembretes. No aplicativo, o Santuário Digital reúne esses recursos em uma experiência pessoal; no WhatsApp, a conversa torna o acesso simples e próximo.

A MarIA foi criada para apoiar sua caminhada — com serenidade, respeito à fé católica e consciência de seus limites. Ela não substitui a presença da comunidade, os sacramentos ou a orientação de um sacerdote. É uma companhia digital para ajudar você a fazer da oração uma parte mais presente da vida.

## 12. Critérios para a futura Landing

- Comunicar o ecossistema real: WhatsApp **e** aplicativo, com papéis complementares.
- Destacar benefícios humanos antes de nomes de módulos ou tecnologias.
- Mostrar recursos reais do app: liturgia, Santo do Dia, Liturgia das Horas, terço, novenas, Plano de Vida Espiritual, lembretes, preparação para Confissão e chat.
- Não anunciar push como garantido em todas as plataformas até concluir a ativação e os testes de Firebase, migration, permissões e APNs/Web aplicáveis.
- Não sugerir que o app esteja publicado nas lojas enquanto isso não for confirmado.
- Manter os planos e preços dinâmicos, sem valores hard-coded na narrativa institucional.
- Preservar limites sobre IA, sacramentos, privacidade e aconselhamento humano.
- Usar movimento com parcimônia, acessibilidade, desempenho mobile e suporte a `prefers-reduced-motion`.

## 13. Nota de autoria e uso

Este documento organiza a descrição institucional e as diretrizes de comunicação do produto MarIA, desenvolvido pela Acutis Tech. Ele serve como base de branding e redação para a Landing, materiais institucionais e conteúdo de produto; não é, por si só, registro de marca, parecer jurídico, licença de software ou garantia de exclusividade de slogans. Antes de publicar, validar nomes, alegações comerciais, política de privacidade, disponibilidade de recursos e eventuais direitos de terceiros.

## 14. Atualização de posicionamento — canais e direção da Landing (2026-10-23)

- O centro da marca é a **MarIA como assistente digital católica**, inspirada nas virtudes de acolhimento de Nossa Senhora. Nunca afirmar ou insinuar que a MarIA é Nossa Senhora, uma aparição, revelação ou autoridade eclesial.
- O **aplicativo é o centro de gestão** da rotina: a pessoa organiza práticas, horários e preferências de entrega por lá.
- O **WhatsApp é um canal complementar de exibição/entrega** das mensagens previamente agendadas no aplicativo. A comunicação da Landing não deve sugerir que o fiel gerencia a rotina pelo WhatsApp.
- A nova Landing usa uma narrativa editorial inspirada em referências de composição selecionadas no Motion Sites AI, sem copiar layout, textos, marca ou assets. Azul mariano, azul profundo e ouro sacro permanecem acentos discretos; a estética deve ser serena e católica, sem visual cósmico/New Age.
- Capturas reais fornecidas pelo responsável mostram o chat mobile, Plano de Vida, Liturgia, Terço e lembrete WhatsApp. Na apresentação pública, não exibir alegação ampla de sigilo/segurança nem controles no WhatsApp incompatíveis com o posicionamento; a captura correspondente recebe uma faixa visual neutra cobrindo somente o trecho problemático.
- Demonstrar poucos recursos por vez, em telas legíveis no celular, com texto alternativo descritivo, navegação por teclado, foco visível, contraste e respeito a `prefers-reduced-motion`.
- Recursos da Landing devem continuar distinguindo uma ilustração de uma captura real e não fazer alegações de doutrina infalível, privacidade absoluta ou disponibilidade de recursos sem validação.
