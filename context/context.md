# Repositório - Histórico de Contexto e Decisões

Este arquivo armazena o histórico contínuo de contexto, decisões de arquitetura e evolução do projeto MarIA.

---
## Sessão: 2026-08-26 01:54 (UTC-3)
### 📌 Resumo da Sessão
- Realizado brainstorm e implementação completa da funcionalidade de **Exame de Consciência Guiado e Completo (A Evolução do Boa Noite)**.
- Implementação de máquina de estados para condução do exame noturno pelo WhatsApp, geração de virtude prática para o dia seguinte com Ato de Contrição, e política de sigilo de oração (anonimização do desabafo no banco).
- Disponibilização da ferramenta de Exame de Consciência no painel de mensagens agendadas para campanhas noturnas (ex: 21h).

### 🏗️ Decisões Técnicas e de Arquitetura
- **Máquina de Estados de 3 a 4 Passos:** Gerenciada via colunas `exam_state` e `exam_context` na tabela `users` do Supabase (`idle` -> `exam_gratitude` -> `exam_confession` -> `idle`).
- **Política de Privacidade / Sigilo Espiritual:** Substituição do conteúdo sensível do desabafo na tabela `messages` por `[Exame de consciência realizado em sigilo de oração]` assim que a IA conclui a resposta.
- **Formato dos Botões Interativos:** 2 botões principais enviados via Uazapi: `[✨ Exame Guiado]` (inicia fluxo interativo) e `[📖 Exame Completo]` (envia roteiro clássico estruturado para meditação privada).
- **Injeção de Prompts Dinâmicos:** Criação e versionamento dos prompts `generator_guided_exam`, `full_exam_text` e `guide_confession` em `ai_prompts`, e fluxo base em `automatic_flows`.

### 🛠️ Alterações e Implementações
- **Banco de Dados (Supabase Migration):** [`docs/migrations/20260826_guided_conscience_exam.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20260826_guided_conscience_exam.sql) executada com sucesso.
- **Backend:**
  - [`backend/src/ai/ai.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/ai/ai.service.ts): Lógica da máquina de estados do exame, gatilhos de botões e texto, chamada do LLM e rotina de anonimização de mensagens.
  - [`backend/src/broadcast/broadcast.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/broadcast/broadcast.service.ts): Suporte à ferramenta `conscience_exam` com anexação de botões interativos nos disparos agendados.
- **Frontend:**
  - [`frontend/src/pages/scheduled-messages.tsx`](file:///d:/Programming/AcutisTech/MarIA/frontend/src/pages/scheduled-messages.tsx): Novo seletor da ferramenta Exame de Consciência.
- **Documentação & Versionamento:**
  - [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md) atualizado para a versão `1.17.0`.
  - [`README.md`](file:///d:/Programming/AcutisTech/MarIA/README.md) atualizado com as novas funcionalidades.

### ⏳ Pendências e Próximos Passos
- Monitorar a taxa de adesão dos fiéis ao Exame Guiado vs. Exame Completo no WhatsApp.
- Avaliar inclusão de exames temáticos sazonais (ex: Quaresma, Advento, exame para casais).
---
## Sessão: 2026-08-30 23:01 (UTC-3)
### 📌 Resumo da Sessão
- Migração do roteiro do **Exame de Consciência Guiado** para um modelo "Híbrido" (Opção C escolhida pelo usuário), dando flexibilidade para o admin editar o roteiro diário pelo painel.
- Refatoração das etapas interativas do Exame Guiado para consumir o limite de uso de mensagens de inteligência artificial (saldo do usuário).
- Correção de interface gráfica no admin: abas da página "Orações e Guias" que não filtravam os cards corretamente.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Guias Híbridos (Dinâmicos):** Substituição do texto engessado no código pela busca dinâmica na tabela `prayers`. O estado `exam_gratitude` ao progredir para `exam_confession` agora faz uma busca no banco pelo título "Exame Guiado - [Dia da Semana]".
- **Injeção via Tag Visível:** Inserção da tag `{{foco_diario}}` diretamente no campo de texto de configuração do fluxo Automático (no painel Admin), para que a injeção do guia diário no passo 2 fique explícita e customizável pela interface.
- **Consumo de Limites:** A verificação `checkSubscriptionLimits` foi introduzida nas respostas da máquina de estados do exame, marcando as mensagens enviadas pela assistente com `is_llm = true` para debitar da quota interativa (diferente de quando a MarIA apenas envia orações fixas).

### 🛠️ Alterações e Implementações
- **Banco de Dados (Supabase Migration):** Criação de `docs/migrations/20260831_migrate_exams_to_prayers.sql`. Este script insere os 7 guias de reflexões diárias (segunda a domingo) e 1 guia completo na tabela `prayers`, desativa a chave legada em `ai_prompts` e injeta a tag `{{foco_diario}}` no `automatic_flows`.
- **Backend:** 
  - `backend/src/ai/ai.service.ts`: Atualizado para buscar do banco os guias do Exame Completo e Exame Guiado Diário, fazer o replace de `{{foco_diario}}`, aplicar a checagem de plano de limite do usuário e salvar como mensagem LLM.
- **Frontend:**
  - `frontend/src/pages/prayers.tsx`: Adição do estado local `activeTab` e filtragem correspondente para consertar as abas de navegação.

### ⏳ Pendências e Próximos Passos
- O usuário deve executar a migration `20260831_migrate_exams_to_prayers.sql` no banco de dados para refletir os novos guias diários no painel.
---

## Sessão: 2026-09-19 02:08 (UTC-3)
### 📌 Resumo da Sessão
- Refatoração profunda do fluxo de criação de Lembretes para remover redundâncias de horário e suportar de forma dinâmica N botões de configuração de turno.
- Unificação das etapas de horário (`reminder_time_morning`, `reminder_time_afternoon`, `reminder_time_night`) em um único nó universal `reminder_time`.
- Implementação de fallback no WhatsApp: o UAZAPI agora detecta quando um passo excede 3 opções interativas (limite do WhatsApp) e converte automaticamente os botões em uma lista de texto interativa (ex: 1️⃣ Manhã, 2️⃣ Tarde...).

### 🏗️ Decisões Técnicas e de Arquitetura
- **Unificação de Estado da Máquina (AI Service):** A máquina de estados (`ai.service.ts`) foi otimizada para capturar dinamicamente a string da opção de período enviada no passo anterior e processá-la, eliminando a dependência de hardcodes de horários rígidos.
- **Renderização Visual de Árvore no Admin:** Optado por não refazer do zero a interface em bibliotecas de Diagramas pesadas (como React Flow), mas usar truques de indentação no `flows.tsx` para agrupar as ramificações de oração e lembretes personalizados, preservando o layout limpo nativo e criando hierarquia visual ("Rota: Oração" / "Rota: Personalizado").

### 🛠️ Alterações e Implementações
- **Backend:**
  - `backend/src/uazapi/uazapi.service.ts`: Removido `.slice(0, 3)` para habilitar renderização via Fallback de texto se `buttons.length > 3`.
  - `backend/src/ai/ai.service.ts`: Lógica `reminder_period` atualizada para ler a lista de botões configurada no momento em vez de lista estática, suportando índices ou match de texto.
- **Frontend:**
  - `frontend/src/pages/flows.tsx`: Removidos os nós antigos e refatorada a exibição visual para simular um fluxograma de ramificações laterais.

### ⏳ Pendências e Próximos Passos
- Nenhuma pendência deixada para o escopo desta sessão. O admin e o backend foram reconstruídos e os testes estão liberados.
---

## Sessão: 2026-09-19 20:14 (UTC-3)
### 📌 Resumo da Sessão
- Desenvolvimento do sistema de ferramentas integradas nos nós de fluxos automáticos (Node Tools) com drag and drop para ordenação.
- Implementação completa do agendador de lembretes com recorrência diária contínua utilizando BullMQ/Redis e envio pelo WhatsApp (`uazapi`).
- Adição de botão interativo de cancelamento (Soft Delete) na entrega diária do lembrete.
- Criação de rotina CRON para expurgar lembretes inativos (`cancelled`) há mais de 30 dias.
- Restrição do agendamento de lembretes diários para uso exclusivo de assinantes.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Soft Delete e Expurgo:** Lembretes cancelados mudam seu status para `cancelled` em vez de exclusão física na hora, permitindo auditoria, sendo expurgados após 30 dias de inatividade.
- **Re-agendamento Contínuo:** No `RemindersProcessor`, o re-agendamento usa o `delay` de 24h e um `jobId` determinístico (`{reminderId}_{timestamp}`) para impedir duplicações no Redis.
- **Bloqueio Premium:** Verificação de plano (`isFree` e `user.subscription_tier === 'free'`) implementada nas triggers e intenções da máquina de estados do `ai.service.ts`, convertendo a funcionalidade em um diferencial do plano pago.

### 🛠️ Alterações e Implementações
- **Banco de Dados:** Adição da coluna `updated_at` com `DEFAULT now()` na tabela `reminders` para orientar a limpeza diária.
- **Backend:** 
  - `backend/src/reminders/reminders.processor.ts`: Integração com `uazapi` para envio do lembrete + botão interativo (`cancel_reminder_{id}`) e reagendamento BullMQ.
  - `backend/src/ai/ai.service.ts`: O método `processMessage` agora é interceptado para processar ordens de cancelamento textuais ou via botão. Adicionada restrição de assinatura para solicitação de lembretes.
  - `backend/src/ai/cron.service.ts`: Novo método `@Cron('0 3 * * *') cleanupOldCancelledReminders()`.
- **Documentação:** `CHANGELOG.md` atualizado com o patch de versão `1.20.0`.

### ⏳ Pendências e Próximos Passos
- Permitir customização de "dias da semana" na configuração do lembrete caso os usuários demandem no futuro.
---

## Sessão: 2026-09-27 01:39 (UTC-3)
### 📌 Resumo da Sessão
- Identificação de problema de retenção/bloqueio de fiéis em fluxos interativos (ex: criação de lembretes, exame de consciência, contratação de plano) que eram abandonados pela metade.
- Implementação de um mecanismo de **expiração automática e silenciosa por inatividade** (sem spam de notificações no WhatsApp), liberando o usuário para interagir normalmente quando retornar ao chat.
- Parametrização dinâmica do tempo limite de inatividade através da tabela `system_settings` e tela de Configurações no painel web.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Camada Dupla de Segurança (Sob Demanda + CRON):**
  - **Sob Demanda (`ai.service.ts`):** Verificação imediata no recebimento da mensagem. Se o usuário estiver com fluxo pendente e o tempo decorrido exceder o limite (padrão 15 min), o estado é resetado para `idle`/`active` antes de processar a mensagem, respondendo diretamente à nova intenção do usuário sem erros ou bloqueios.
  - **Rotina em Segundo Plano (`cron.service.ts`):** O job `@Cron('*/2 * * * *') cleanupInactiveFlows()` varre o banco a cada 2 minutos resetando estados abandonados e gerando registros de auditoria em `system_logs`.
- **Cancelamento Silencioso (Zero Spam):** A expiração não dispara mensagens automáticas no WhatsApp para evitar incomodar o usuário horas ou dias depois que ele esqueceu da interação.
- **Rastreamento com Fallback:** Adição da coluna `flow_updated_at` na tabela `users`, atualizada a cada passo do fluxo e limpa para `null` ao concluir/cancelar. Para usuários legados ou conversas antigas, é utilizada a data da última mensagem enviada no chat como fallback de inatividade.
- **Configuração no Painel:** Chave `flow_inactivity_timeout_minutes` adicionada a `system_settings` e campo editável adicionado no frontend (`settings.tsx`).

### 🛠️ Alterações e Implementações
- **Banco de Dados (Migration):**
  - [`docs/migrations/20260926_flow_inactivity_timeout.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20260926_flow_inactivity_timeout.sql): Criação da coluna `flow_updated_at` na tabela `users`, índice condicional `idx_users_flow_inactivity` e inserção padrão do timeout em `system_settings`.
- **Backend:**
  - [`backend/src/ai/ai.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/ai/ai.service.ts): Métodos `getFlowTimeoutMinutes` e `checkIfFlowExpired`, verificação no início do `processMessage`, e rastreamento de `flow_updated_at` nos fluxos de lembretes, exame de consciência e assinatura.
  - [`backend/src/ai/cron.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/ai/cron.service.ts): Novo método `cleanupInactiveFlows()` rodando a cada 2 minutos com log em `system_logs`.
- **Frontend:**
  - [`frontend/src/pages/settings.tsx`](file:///d:/Programming/AcutisTech/MarIA/frontend/src/pages/settings.tsx): Novo card "Fluxos & Sessões Interativas" permitindo alterar o tempo limite em minutos.
- **Documentação & Versionamento:**
  - [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md) atualizado para versão `1.21.0`.
  - [`README.md`](file:///d:/Programming/AcutisTech/MarIA/README.md) atualizado com a nova capacidade de auto-reset por inatividade.

### ⏳ Pendências e Próximos Passos
- Executar a migration `docs/migrations/20260926_flow_inactivity_timeout.sql` no banco Supabase.
- Executar `docker compose up --build -d` assim que o Docker Desktop for iniciado no host.
---
## Sessão: 2026-10-05 02:22 (UTC-3)
### 📌 Resumo da Sessão
- Configuração e resolução de ambiente completa para desenvolvimento mobile Flutter (Flutter 3.47+, Android Studio, Android SDK 35, Command-line Tools, licenças e emulador Android `Medium_Phone_API_37.0`).
- Relocação permanente do cache do Gradle para `D:\.gradle` via variável `GRADLE_USER_HOME` e liberação do disco `C:` que estava com 0 bytes livres.
- Desenvolvimento e entrega da **Milestone 1** do aplicativo móvel MarIA (`com.acutistech.maria_app`) em Clean Architecture + Feature-First com Flutter Riverpod 3.x e GoRouter.
- Implementação da tela inicial (Santuário Diurno com Saudação, Santo do Dia, Plano de Vida Espiritual com hábitos interativos, Liturgia da Palavra e Atalhos Rápidos).
- Rebranding visual de cores guiado pela logo oficial da MarIA: substituição do ocre/queimado pelo **Ouro Real Radiante (`#D4AF37`)** e introdução do **Azul Cobalto Mariano Oficial (`#0047AB`)** e **Azul Sagrado Profundo (`#002D6E`)**.
- Compilação do APK de debug, instalação no emulador e validação visual em execução real via captura de tela.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Estrutura do Projeto:** Criado dentro de `mobile/` preservando a estrutura de monorepo com `backend`, `frontend` e `landing`.
- **Arquitetura & Estado:** Clean Architecture desacoplada com Feature-First, Riverpod 3.x (`NotifierProvider` para alternância de tema entre Santuário Claro e Capela Noturna) e GoRouter com `AppScaffold` baseado em `IndexedStack`.
- **Design System Sacro MarIA:**
  - `AppColors`: Paleta fiel à logo (`#0047AB` Azul Cobalto, `#002D6E` Azul Sagrado, `#001B44` Azul Noturno, `#D4AF37` Ouro Real Radiante, `#FDE68A` Ouro Estrelar e `#F4F7FC` Fundo Celeste).
  - `AppTypography`: Tipografia nobre com títulos sacros em *Cinzel* e corpo de leitura em *Plus Jakarta Sans*.
- **Compatibilidade de Dependências:** Substituição de `lucide_icons` por `lucide_icons_flutter` para suportar `IconData` final no Flutter 3.47+ / Dart 3.13+.

### 🛠️ Alterações e Implementações
- **Mobile (`mobile/`):**
  - Design System & Configurações: `lib/core/theme/app_colors.dart`, `app_typography.dart`, `app_theme.dart`.
  - Navegação & Shell: `lib/core/router/app_router.dart`, `app_scaffold.dart`.
  - Santuário / Home: `lib/features/home/presentation/home_page.dart` e widgets (`daily_liturgical_header.dart`, `saint_hero_card.dart`, `spiritual_habits_row.dart`, `liturgy_summary_card.dart`, `quick_actions_grid.dart`).
  - Módulos Complementares: `features/liturgy/presentation/liturgy_page.dart`, `features/prayers/presentation/prayers_page.dart`, `features/chat_ai/presentation/chat_page.dart`, `features/settings/presentation/settings_page.dart`.
  - Testes: `test/widget_test.dart` com 100% de aprovação.
- **Documentação & Versionamento:**
  - `CHANGELOG.md` atualizado com as versões `1.22.0` (Milestone 1 Mobile) e `1.22.1` (Rebranding Visual Oficial).

### ⏳ Pendências e Próximos Passos
- Conexão do app mobile com as APIs do backend NestJS / Supabase para carregar dinamicamente o Santo do Dia e as Leituras Litúrgicas.
- Implementação do fluxo de autenticação via OTP por WhatsApp no mobile (`features/auth`).
- Conexão do canal de chat devocional com IA (`features/chat_ai`) com streaming em tempo real (SSE/WebSocket).
---

## Sessão: 2026-10-13 11:05 (UTC-3)
### 📌 Resumo da Sessão
- **Unificação do Chat de IA (Mobile & WhatsApp):** Integração do chat mobile diretamente com o pipeline oficial do `AiService`, compartilhando a mesma persona maternal da MarIA, histórico de oração no Supabase e base de conhecimento.
- **Rastreamento de Origem no Banco:** Criação da coluna `origin` na tabela `messages` do Supabase para diferenciar mensagens do WhatsApp (`origin = 'whatsapp'`) e do app nativo (`origin = 'mobile'`).
- **Resolução de Fallback no Flutter Web:** Identificada e corrigida a causa raiz que impedia a comunicação HTTP no navegador (uso indevido de `Platform.isAndroid` do `dart:io` que lançava exceção na Web, forçando mensagens fixas offline com Sl 26).
- **Indicador de Digitação Estilo WhatsApp:** Substituído o texto estático e spinner por um balão elegante com **três pontinhos animados pulsando em onda** (`_WhatsAppTypingIndicator`).
- **Sincronização Bidirecional de Envios do WhatsApp:** Implementação da gestão de mensagens automáticas (Liturgia Diária matinal, Exame de Consciência noturno e Santo do Dia), permitindo ativar ou cancelar tanto pelo app quanto pelo WhatsApp.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Persistência de Origem (`origin`):** Mensagens do app são persistidas com `origin: 'mobile'`, mantendo integridade com as regras de quota e resumo pastoral, enquanto o WhatsApp grava com `origin: 'whatsapp'`.
- **Compatibilidade Web First (`kIsWeb`):** Garantida a detecção multiplataforma no Flutter (`kIsWeb`) para resolução dinâmica de URL (`localhost` na Web vs. `10.0.2.2` no Android Emulator) e omissão de headers restritos como `User-Agent`.
- **Animação Fluida do Typing Indicator:** Criado widget com `SingleTickerProviderStateMixin` e onda senoidal de 1200ms para criar a sensação de chat vivo em tempo real.
- **Ponte de Preferências Unificada:**
  - Backend expõe `GET /mobile/preferences` e `PUT /mobile/preferences` consultando/atualizando diretamente o registro do usuário na tabela `users` do Supabase.
  - Fallback defensivo no backend caso colunas opcionais (`receive_daily_exam`, etc.) ainda estejam pendentes de DDL no Supabase, garantindo estabilidade ininterrupta.
  - Riverpod State com `WhatsAppPreferencesNotifier` e persistência local do número de WhatsApp para consulta transparente.

### 🛠️ Alterações e Implementações
- **Banco de Dados & Migrações:**
  - [`docs/migrations/20261013000000_add_origin_to_messages.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20261013000000_add_origin_to_messages.sql): Adiciona coluna `origin` na tabela `messages`.
  - [`docs/migrations/20261013000001_add_preferences_to_users.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20261013000001_add_preferences_to_users.sql): Adiciona `receive_daily_exam`, `receive_daily_saint` e `whatsapp_bridge_enabled` na tabela `users`.
- **Backend:**
  - [`backend/src/mobile/mobile.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile.service.ts): Integração com `AiService` e métodos `getPreferences` / `updatePreferences`.
  - [`backend/src/mobile/mobile.controller.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile.controller.ts): Endpoints `GET` e `PUT /mobile/preferences`.
  - [`backend/src/mobile/mobile.module.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile.module.ts): Injeção de `SupabaseModule`.
  - [`backend/src/ai/ai.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/ai/ai.service.ts): Persistência de `origin` em `saveMessage`.
  - Rebuild Docker: Imagem reconstruída e contêiner `maria-backend-1` em execução.
- **Mobile (Flutter):**
  - [`mobile/lib/features/chat_ai/data/datasources/chat_remote_data_source.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/chat_ai/data/datasources/chat_remote_data_source.dart): Suporte a `kIsWeb`, timeout estendido e logs de rede.
  - [`mobile/lib/core/network/api_client.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/core/network/api_client.dart): Header `User-Agent` condicional apenas para plataformas nativas.
  - [`mobile/lib/features/chat_ai/presentation/chat_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/chat_ai/presentation/chat_page.dart): Widget `_WhatsAppTypingIndicator` com 3 pontinhos animados.
  - [`mobile/lib/features/reminders/data/datasources/preferences_remote_data_source.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/reminders/data/datasources/preferences_remote_data_source.dart): Cliente remoto para as preferências de mensagens.
  - [`mobile/lib/features/reminders/presentation/controllers/whatsapp_preferences_controller.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/reminders/presentation/controllers/whatsapp_preferences_controller.dart): Gerenciamento de estado das opções com Riverpod.
  - [`mobile/lib/features/reminders/presentation/reminders_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/reminders/presentation/reminders_page.dart): Card visual de mensagens do WhatsApp, dialog de vinculação de número e toggles com SnackBar.
- **Testes & Documentação:**
  - 24 testes executados e 100% aprovados (`All tests passed!`).
  - `flutter analyze` 100% limpo com 0 issues.
  - [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md) atualizado com versões `1.27.0` a `1.28.0`.
  - [`docs/ROADMAP_MOBILE.md`](file:///d:/Programming/AcutisTech/MarIA/docs/ROADMAP_MOBILE.md) atualizado com a conclusão da Fase 4.

### ⏳ Pendências e Próximos Passos
- Executar no Supabase SQL Editor a migration `docs/migrations/20261013000001_add_preferences_to_users.sql` para oficializar as novas colunas na nuvem (o backend já possui fallback funcional).
- Iniciar a **Fase 5 do Roadmap: Autenticação Mínima & Identificação (WhatsApp OTP via Uazapi)** para login sem fricção.
---

## Sessão: 2026-10-14 01:47 (UTC-3)
### 📌 Resumo da Sessão
- **Aprimoramento do Santo Terço Interativo:** Inclusão do Pai-Nosso (conta grande) no início de cada uma das 5 dezenas e do Glória ao Pai com Jaculatória de Fátima na conclusão de cada dezena, restabelecendo a fidelidade litúrgica tradicional.
- **Reformulação do Exame de Consciência Noturno:** Transformação do exame em uma experiência 100% contemplativa e privada, sem inputs de texto ("Minha pequena resolução..." removida), com seletor de 8 virtudes em chips de 1 toque, timer de silêncio guiado de 30s e modo foco noturno escuro, além de distinção pedagógica clara em relação ao exame preparatório para a Confissão Sacramental.
- **Otimização da Tela Inicial (Home):** Navegação direta por toque nos cards do Santo do Dia (abertura de `SaintDetailPage`), da Liturgia da Palavra e do Plano de Vida Espiritual (substituição do scroll horizontal por card coeso com indicador estático de práticas).
- **Ajustes de UX no Modal de Hábitos:** Remoção do botão de fechar ('X') em `AddHabitBottomSheet` em favor de drag handle nativo e dismiss fora da área.
- **Validação Cruzada Web vs. Mobile:** Análise comparativa e garantias de equivalência de comportamento para lançamento nas lojas Android/iOS.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Estrutura de Estados da Dezena no Rosário:** Criação do enum `DecadeStage { ourFather, hailMary, glory }` em [`rosary_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/prayers/presentation/rosary_page.dart), desacoplando a oração do Pai-Nosso das 10 contas de Ave-Maria e garantindo reversibilidade bidirecional perfeita com `_previousBead`.
- **Privacidade Radical no Exame Noturno:** Eliminação completa de gravação/digitação de textos íntimos de faltas ou resoluções no app para que o usuário sinta segurança e intimidade com Deus, usando chips rápidos de virtude cristã como bússola de oração.
- **Prevenção de Cache Stale no Flutter Web:** Remoção da injeção rígida de `serviceWorkerSettings` em `flutter_bootstrap.js` e script de desregistro no `index.html` para desenvolvimento e testes locais com hot-reload confiável.

### 🛠️ Alterações e Implementações
- **Mobile (`mobile/`):**
  - [`lib/features/prayers/presentation/rosary_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/prayers/presentation/rosary_page.dart): Implementação do Pai-Nosso nas dezenas, Glória, Jaculatória de Fátima e cartões com textos litúrgicos completos.
  - [`lib/features/prayers/presentation/conscience_exam_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/prayers/presentation/conscience_exam_page.dart): Reescrita para *Exame de Consciência Noturno*, modo noturno, timer de silêncio (`_SilenceTimerWidget`) e grade de virtudes.
  - [`lib/features/home/presentation/home_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/home_page.dart) e widgets (`saint_hero_card.dart`, `spiritual_habits_row.dart`, `liturgy_summary_card.dart`, `quick_actions_grid.dart`): Navegação direta sem cliques intermediários.
  - [`lib/features/saint_of_day/presentation/saint_detail_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/saint_of_day/presentation/saint_detail_page.dart): Nova tela com biografia e oração do Santo do Dia.
  - [`lib/features/spiritual_plan/presentation/widgets/add_habit_bottom_sheet.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/spiritual_plan/presentation/widgets/add_habit_bottom_sheet.dart): Remoção do 'X' e barra de arraste limpa.
  - [`test/rosary_conscience_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/rosary_conscience_test.dart): Testes de widget atualizados para os novos fluxos do Terço e Exame Noturno.
- **Documentação & Versionamento:**
  - [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md): Registradas as versões `1.29.0`, `1.29.1`, `1.29.2`, `1.29.3` e `1.29.4`.

### ⏳ Pendências e Próximos Passos
- Implementar o módulo dedicado de **Preparação para a Confissão Sacramental** (com os 5 passos do sacramento, mandamentos e fórmula de absolvição).
- Avaliar a persistência local (Hive/Isar ou SQLite) com sincronização offline para a Liturgia e Plano de Vida.
- Avançar para a **Fase 5: Autenticação com OTP via WhatsApp** no app mobile.
---

## Sessão: 2026-10-14 21:15 (UTC-3)
### 📌 Resumo da Sessão
- **Módulo Completo de Preparação para a Confissão Sacramental (`features/confession`):**
  - Desenvolvido do zero o módulo completo de exame de consciência detalhado baseado nos 10 Mandamentos da Lei de Deus com fundamentação moral clássica da Igreja e alertas visuais de matéria grave.
  - Implementado o **Cofre Sacramental** com criptografia local (`FlutterSecureStorage` e fallback para web), bloqueio por biometria ou senha do próprio celular via `local_auth` (estilo WhatsApp) e PIN alternativo de 4 dígitos.
  - Temporizador de auto-bloqueio após 2 minutos de inatividade sem uso.
  - Modo Confessionário ("Espelho de Leitura") com resumo de faltas assinaladas, anotações de circunstâncias, roteiro litúrgico de diálogo com o sacerdote e Ato de Contrição.
  - Expurgo sacramental irreversível ("Recebi a Absolvição!") que destrói completamente todos os dados do dispositivo após a confissão, conduzindo à página sagrada de Ação de Graças.
  - Ajuste pastoral no guia de preparação: etapa 2 simplificada para **"2 | CONTRIÇÃO"**.
  - Banner nobre de acesso integrado na aba de Orações (`prayers_page.dart`) com layout responsivo ajustado para evitar qualquer aviso de overflow em telas estreitas.
- **Etapa Interativa Dedicada da Salve Rainha no Santo Terço (`rosary_page.dart`):**
  - Substituição do pop-up abrupto ao final da 5ª dezena por uma etapa litúrgica própria (`DecadeStage.hailHolyQueen`).
  - Convite dinâmico "Rezar Salve Rainha", ícone dourado de coroa, medalha "50 Ave-Marias Concluídas" e texto litúrgico completo com versículo e resposta.
  - Diálogo celebrativo limpo com a bênção da coroa de rosas e citação espiritual de São João Paulo II.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Zero-Knowledge Sacramental:** O exame de consciência e as anotações nunca trafegam pela rede nem são salvos em nuvem/Supabase. Os dados residem estritamente no armazenamento seguro do dispositivo e são sobrescritos e apagados após a absolvição.
- **Autenticação Biométrica e Senha do Aparelho:** Uso de `local_auth` sem impor `biometricOnly: true`, permitindo ao usuário desbloquear seu exame com Face ID, impressão digital ou o PIN/padrão nativo do smartphone.
- **Auto-Lock por Inatividade:** Implementado no `ConfessionVaultController` com `Timer` de 120s reiniciado a cada interação do usuário (`recordActivity()`), bloqueando o estado para `locked` caso o aparelho seja deixado aberto.
- **Fluxo do Rosário Ampliado:** Inclusão de `hailHolyQueen` no enum `DecadeStage`, preservando a navegação bidirecional (`_previousBead`) do início ao encerramento do Santo Terço.

### 🛠️ Alterações e Implementações
- **Mobile (`mobile/`):**
  - [`lib/features/confession/domain/entities/commandment_exam_entity.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/domain/entities/commandment_exam_entity.dart): Perguntas detalhadas dos 10 Mandamentos com distinção de matéria grave.
  - [`lib/features/confession/domain/entities/confession_vault_state.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/domain/entities/confession_vault_state.dart): Estado imutável do cofre com controle de lock e contagem de pecados.
  - [`lib/features/confession/data/datasources/confession_vault_local_data_source.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/data/datasources/confession_vault_local_data_source.dart): Armazenamento criptografado local com fallback web.
  - [`lib/features/confession/presentation/controllers/confession_vault_controller.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/presentation/controllers/confession_vault_controller.dart): Gerenciamento de auto-bloqueio (120s), biometria e expurgo.
  - [`lib/features/confession/presentation/pages/confession_vault_pin_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/presentation/pages/confession_vault_pin_page.dart): Tela de destravamento com suporte a biometria nativa e PIN.
  - [`lib/features/confession/presentation/pages/confession_prep_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/presentation/pages/confession_prep_page.dart): Itinerário dos 5 passos e exame dos mandamentos.
  - [`lib/features/confession/presentation/pages/confession_absolution_celebration_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/presentation/pages/confession_absolution_celebration_page.dart): Tela celebrativa pós-absolvição e oração de ação de graças.
  - [`lib/features/confession/presentation/widgets/confessional_mirror_view.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/presentation/widgets/confessional_mirror_view.dart): Espelho de leitura para uso dentro do confessionário.
  - [`lib/features/confession/presentation/widgets/commandment_accordion_tile.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/presentation/widgets/commandment_accordion_tile.dart): Acordeão responsivo com perguntas e anotações.
  - [`lib/features/prayers/presentation/prayers_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/prayers/presentation/prayers_page.dart): Banner da Preparação para a Confissão e responsividade com `Wrap` para eliminar overflows.
  - [`lib/features/prayers/presentation/rosary_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/prayers/presentation/rosary_page.dart): Etapa dedicada da Salve Rainha e conclusão devocional.
  - [`test/confession_vault_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/confession_vault_test.dart): Testes unitários do cofre e do auto-lock de 2 minutos.
  - [`test/rosary_conscience_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/rosary_conscience_test.dart): Teste de widget cobrindo todo o percurso do Santo Terço até a Salve Rainha.
- **Documentação & Versionamento:**
  - [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md): Registradas as versões `1.30.0` (Módulo de Preparação para a Confissão) e `1.30.1` (Salve Rainha no Santo Terço).
  - [`README.md`](file:///d:/Programming/AcutisTech/MarIA/README.md): Atualizado com a nova funcionalidade de Confissão e Cofre Sacramental.

### ⏳ Pendências e Próximos Passos
- Avançar para a **Fase 5 do Roadmap Mobile**: Autenticação com OTP via WhatsApp (Uazapi) para sincronização de perfil e histórico pastoral entre canais.
- Avaliar suporte a áudio guiado com voz serena para o Santo Terço e para a Liturgia Diária.
---

## Sessão: 2026-10-15 03:03 (UTC-3)
### 📌 Resumo da Sessão
- **Santuário de Novenas MarIA (Novenário Católico & Supabase como Fonte da Verdade):**
  - Implementação completa do módulo de novenas no Supabase e backend NestJS (`backend/src/novenas/`), eliminando hardcodes no mobile e permitindo gestão dinâmica pelo CMS Web Admin.
  - Construção do Painel CMS Web Admin (`frontend/src/pages/admin/NovenasAdmin.tsx`) com listagem, busca, filtros de status/categoria, modal de criação e edição com os 9 dias e suporte a temas Light e Dark.
  - Sementeira de 5 novenas tradicionais canônicas completas: Nossa Senhora Desatadora dos Nós, Santa Rita de Cássia, Beato Carlo Acutis, São Bento Abade e São João Paulo II.
- **Inteligência Litúrgica e Cálculo Canônico Regressivo:**
  - Regra canônica implementada: a festa do santo coincide com o 9º dia da novena (`festa - 8 dias = Dia 1`).
  - Para São João Paulo II (festa em 22 de outubro), a data ideal de início é 14 de outubro. No dia 15/10, o app calcula dinamicamente o badge *"COMEÇOU ONTEM (DIA 2/9)"* e *"DATA IDEAL PARA COMEÇAR"*.
- **Card Dinâmico na Tela Inicial (`UpcomingNovenasCard`):**
  - Integrado à `HomePage` logo abaixo do Santo do Dia e acima do Plano de Vida Espiritual.
  - Exibe a próxima novena litúrgica recomendada com datas, badge pastoral e atalho para iniciar a oração.
  - Alternância automática para o modo "SUA NOVENA ATIVA" com progresso dos 9 dias, intenção consagrada, horário de lembrete e botão "Rezar Dia X Agora".
  - Layout totalmente responsivo com proteção contra overflow mesmo em telas ultracompactas (320px).
- **Modal Unificado de Iniciação com Lembretes Multi-canal:**
  - Consagração da intenção particular do fiel.
  - Seletor de horário diário com presets rápidos (`07:00` Manhã, `12:00` Ângelus, `18:00` Tarde, `20:00` Noite) e TimePicker customizado.
  - Ativação de alertas no celular (notificação local) e no WhatsApp (com campo para número de telefone).
  - Card informativo de integração automática com o Plano de Vida Espiritual.
- **Integração Bidirecional ao Plano de Vida Espiritual (`SpiritualPlan`):**
  - Injeção dinâmica da novena ativa na rotina de hábitos diários do fiel pelo período de 9 dias no horário definido.
  - Sincronização mútua de conclusão: marcar no Plano de Vida avança o novenário e vice-versa.
  - Expiração automática após o 9º dia de oração.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Fonte Única da Verdade:** Dados estruturados no Supabase (`novenas`, `novena_days`, `user_novenas`, `user_novena_logs`) consumidos via NestJS `/mobile/novenas` e `/panel/novenas`, com fallback offline e pacote embutido em `default_novenas_data.dart` para resiliência offline em igrejas e capelas sem sinal.
- **Precedência de Rotas no NestJS:** Ajuste da ordem dos endpoints em `MobileNovenasController` para garantir que rotas especializadas como `/mobile/novenas/user/:userId/active` tenham precedência sobre o parâmetro curinga `:idOrSlug`.
- **Compatibilidade com UUID Postgres:** Tratamento de identificadores anônimos no mobile com mapeamento determinístico para UUID válido (`a0000000-0000-0000-0000-000000000001`), evitando erros de sintaxe no Postgres.
- **Sinergia Reativa no Riverpod 3:** `SpiritualPlanNotifier` assiste reativamente a `userNovenasProvider`, sincronizando o estado dos hábitos diários e o avanço da novena em tempo real sem chamadas redundantes.

### 🛠️ Alterações e Implementações
- **Mobile (`mobile/`):**
  - [`lib/features/novenas/domain/entities/novena.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/domain/entities/novena.dart): Adicionada lógica de datas litúrgicas (`getFeastDate()`, `idealStartDate`, `daysUntilIdealStart`, `displayFeastDay` e `liturgicalBadge`) e atributos de lembrete em `UserNovena`.
  - [`lib/features/novenas/data/models/novena_model.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/data/models/novena_model.dart): Serialização e suporte a `feast_date` e lembretes em `UserNovenaModel`.
  - [`lib/features/novenas/data/datasources/default_novenas_data.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/data/datasources/default_novenas_data.dart): Povoamento canônico completo dos 9 dias da Novena a São João Paulo II.
  - [`lib/features/novenas/presentation/pages/novena_detail_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/presentation/pages/novena_detail_page.dart): Modal `_openStartNovenaModal` interativo com presets de horário, toggles de lembrete (push/WhatsApp) e aviso do Plano de Vida.
  - [`lib/features/home/presentation/widgets/upcoming_novenas_card.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/widgets/upcoming_novenas_card.dart): Novo widget para a Home com cálculo litúrgico dinâmico e alternância para novena ativa.
  - [`lib/features/home/presentation/home_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/home_page.dart): Inserção do `UpcomingNovenasCard` no layout principal.
  - [`lib/features/spiritual_plan/presentation/controllers/spiritual_plan_controller.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/spiritual_plan/presentation/controllers/spiritual_plan_controller.dart): Injeção dinâmica de hábitos da novena e sincronização bidirecional de conclusão.
  - [`test/novenas_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/novenas_test.dart) & [`test/reminders_spiritual_plan_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/reminders_spiritual_plan_test.dart): Bateria de testes automatizados com 100% de aprovação.
- **Backend (`backend/`):**
  - [`backend/src/novenas/initial-novenas-data.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/novenas/initial-novenas-data.ts): Adicionada a Novena a São João Paulo II para sementeira no Supabase.
  - [`backend/src/novenas/novenas.controller.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/novenas/novenas.controller.ts): Ajustada precedência de rotas para `user/:userId/active`.
  - [`backend/src/novenas/novenas.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/novenas/novenas.service.ts): Tratamento de validação e fallback de UUID para usuários do dispositivo.
  - Container Docker `maria-backend-1` reconstruído com sucesso via `docker compose up --build -d backend`.
- **Frontend CMS (`frontend/`):**
  - [`frontend/src/pages/admin/NovenasAdmin.tsx`](file:///d:/Programming/AcutisTech/MarIA/frontend/src/pages/admin/NovenasAdmin.tsx): Gestão de novenas com paleta de cores harmonizada para os temas Light e Dark.
- **Documentação:**
  - [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md): Registradas as versões `1.31.0` (CMS e Backend), `1.32.0` (Novenário Mobile Offline-First) e `1.33.0` (Cálculo Litúrgico, Home Card, Lembretes e Plano de Vida).
  - [`README.md`](file:///d:/Programming/AcutisTech/MarIA/README.md): Atualizado com os novos recursos.

### ⏳ Pendências e Próximos Passos
- Avançar para a **Fase 5 do Roadmap Mobile**: Autenticação com OTP via WhatsApp (Uazapi) para sincronização de perfil do fiel entre o app e o WhatsApp.
- Pipeline do scheduler BullMQ para disparo das notificações diárias de novenas via WhatsApp no horário configurado pelo fiel.
---

## Sessão: 2026-10-17 03:10 (UTC-3)
### 📌 Resumo da Sessão
- **Autenticação Híbrida & Sincronização Omnichannel (Supabase Auth + Uazapi OTP + Smart Merge):**
  - Implementação completa do módulo de autenticação Clean Architecture no aplicativo Flutter (`features/auth`).
  - Criação do serviço de backend NestJS ([`MobileAuthService`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile-auth.service.ts)) com motor de Smart Merge para consolidar históricos do WhatsApp e do app.
  - Execução da migration Supabase [`20261017000000_mobile_auth_and_sync.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20261017000000_mobile_auth_and_sync.sql).
- **Modelo de Acesso Restrito Inspirado em Hallow & Capela:**
  - Tela inicial de autenticação com opção expressa *"Acessar sem conta • Modo Visitante"*.
  - Bloqueio nobre de recursos exclusivos para fiéis sem login (*Plano de Vida*, *Exame Noturno*, *Lembretes*, *Novenário* e *MarIA Chat*).
  - Omissão pastoral da aba da MarIA na barra inferior de navegação para visitantes (layout harmonioso de 4 abas).
- **Harmonização Visual & Transição Suave via Modal Devocional:**
  - Remoção de botões duplicados nos cards do *Plano de Vida* e *Próxima Novena*, unificando o badge superior como ponto de conversão.
  - Substituição da navegação abrupta para a tela de login pelo [`DevotionalGatekeeperModal`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/widgets/devotional_gatekeeper_modal.dart), oferecendo apresentação de benefícios e caminhos de acesso acolhedores.
- **Identidade Visual MarIA & Redesign Solene da Tela de Login:**
  - Importação de [`landing/public/maria_logo_premium.png`](file:///d:/Programming/AcutisTech/MarIA/landing/public/maria_logo_premium.png) para os assets móveis e recorte de alta precisão do medalhão mariano circular (570×570 px) em `maria_emblem.png`.
  - Atualização dos favicons e ícones PWA do app web.
  - Redesign completo de [`LoginPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/login_page.dart) com gradiente noturno celestial, medalhão central de 110 px com halo duplo dourado, tipografia Cinzel, card glassmorphic e botões sociais Google/Apple.
  - Posicionamento estratégico e equilibrado da logo nos pontos focais do app (Login, Cadastro, Gatekeeper Modal, Cabeçalho do Santuário e Ajustes).
  - Versionamento registrado em [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md) (versão `1.35.0`) e [`mobile/pubspec.yaml`](file:///d:/Programming/AcutisTech/MarIA/mobile/pubspec.yaml) (`1.35.0+1`).

### 🏗️ Decisões Técnicas e de Arquitetura
- **Estratégia de Autenticação Híbrida (Supabase Auth + WhatsApp OTP):** Supabase Auth gerencia identidade e criptografia oficial (com persistência via `FlutterSecureStorage` e fallback Web). A vinculação com WhatsApp utiliza envio de OTP de 6 dígitos via Uazapi com validade de 15 minutos e Smart Merge semântico no banco relacional.
- **Transição Acolhedora vs. Redirecionamento Abrupto:** Qualquer tentativa de acessar recursos bloqueados passa pelo `DevotionalGatekeeperModal` (bottom sheet animado com apresentação de valor), evitando choque visual de formulário cru de login.
- **Pipeline de Identidade Visual:** Isolamento do medalhão gráfico (`maria_emblem.png`) separado da tipografia da landing page, garantindo flexibilidade e nitidez vetorial/rasterizada em círculos, avatares e ícones PWA.
- **Atmosfera Noturna Mariana (`LoginPage`):** Emprego de gradientes HSL escuros (`#001538` → `#000E24`) com iluminação radial dourada e acabamento translúcido glassmorphic (`rgba(0, 22, 58, 0.82)`), respeitando o banimento de roxos/violetas genéricos e alinhado aos princípios sacros do projeto.

### 🛠️ Alterações e Implementações
- **Mobile (`mobile/`):**
  - [`lib/features/auth/`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/): Camadas Domain, Data e Presentation completas (`UserEntity`, `UserModel`, `AuthRemoteDataSource`, `AuthLocalDataSource`, `AuthRepositoryImpl`, `AuthController`, `LoginPage`, `RegisterPage`, `DevotionalGatekeeperModal`, `LinkWhatsAppBottomSheet`).
  - [`lib/core/router/app_scaffold.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/core/router/app_scaffold.dart): Controle de exibição condicional da aba do Chat MarIA com base na autenticação.
  - [`lib/core/router/app_router.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/core/router/app_router.dart): Rotas `/login` e `/register` registradas.
  - [`lib/features/home/presentation/widgets/daily_liturgical_header.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/widgets/daily_liturgical_header.dart): Inclusão do medalhão circular MarIA de 42 px com halo dourado.
  - [`lib/features/home/presentation/widgets/upcoming_novenas_card.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/widgets/upcoming_novenas_card.dart) & [`spiritual_habits_row.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/widgets/spiritual_habits_row.dart): Harmonização de layout bloqueado e chamada ao modal devocional.
  - [`lib/features/settings/presentation/settings_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/settings/presentation/settings_page.dart): Avatar visitante com o emblema MarIA e selo no rodapé acima da versão 1.35.0.
  - [`assets/images/`](file:///d:/Programming/AcutisTech/MarIA/mobile/assets/images/): Adicionados `maria_logo_premium.png` e `maria_emblem.png`.
  - [`web/`](file:///d:/Programming/AcutisTech/MarIA/mobile/web/): Atualizados `favicon.png`, `Icon-192.png`, `Icon-512.png`, etc.
  - [`test/auth_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/auth_test.dart) & [`test/widget_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/widget_test.dart): Testes unitários e de widgets 100% aprovados.
- **Backend (`backend/`):**
  - [`backend/src/mobile/mobile-auth.controller.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile-auth.controller.ts) & [`mobile-auth.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile-auth.service.ts): Endpoints de envio de OTP de WhatsApp, verificação e Smart Merge de contas.
  - [`backend/src/mobile/mobile.module.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile.module.ts): Registrado módulo de autenticação móvel.
- **Documentação:**
  - [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md): Entradas detalhadas das versões `1.34.0`, `1.34.1`, `1.34.2` e `1.35.0`.
  - [`pubspec.yaml`](file:///d:/Programming/AcutisTech/MarIA/mobile/pubspec.yaml): Versão atualizada para `1.35.0+1`.

### ⏳ Pendências e Próximos Passos
- Configurar as credenciais reais do OAuth Google e Apple (Apple Developer & Google Cloud Console) quando for realizar a publicação nas lojas (App Store e Google Play).
- Conectar o agendamento de novenas e lembretes com push notifications nativas (FCM / APNs) além do canal WhatsApp já integrado.
---

## Sessão: 2026-10-18 23:48 (UTC-3)
### 📌 Resumo da Sessão
- **Implementação e Homologação Completa do Login Social com Google:**
  - Extração do SHA-1 de debug da keystore Android (`FF:AB:67:2E:04:2A:C8:39:AE:99:E6:A0:2F:0B:F9:57:C1:07:DF:53`).
  - Configuração do Google Cloud Console com criação dos clientes OAuth 2.0: Android (`969608908293-m91i8r3e7afehr2777e6ptjcmht4fsbv...`) e Web (`969608908293-9as4c76l9sksl4ihb2ggtu8512qcnicm...`).
  - Armazenamento seguro de segredos e credenciais com atualização do `.gitignore` em múltiplos níveis para proteção das chaves.
  - Configuração do Provedor Google no Supabase Auth com Authorized Client IDs (Web + Android), Client Secret e opção "Skip nonce checks" ativa.
  - Desenvolvimento do endpoint de backend NestJS `POST /mobile/auth/google` integrando validação de `idToken` via Supabase Auth e o motor de Smart Merge para consolidação com contas de WhatsApp/email existentes.
  - Implementação no app Flutter via biblioteca oficial `google_sign_in: ^7.2.0`, fluxo completo em Clean Architecture (`AuthRemoteDataSource`, `AuthRepositoryImpl`, `AuthController`) e integração visual com botão Google e tratamento de cancelamento.
- **Resolução de Infraestrutura e Recuperação de Espaço em Disco do Emulador:**
  - Diagnóstico e correção do erro fatal `hasSufficientDiskSpace` no Android Emulator: o disco C: estava com 0 bytes livres devido a processos órfãos e à partição de 10 GB exigida pelo AVD.
  - Migração definitiva da máquina virtual `Medium_Phone.avd` para o disco `D:\Android\avd\` (com mais de 680 GB livres), criação de junção simbólica NTFS e liberação de mais de 18 GB no disco C:.
  - Recuperação da partição de dados do AVD corrompida durante a falta de espaço (erro de leitura com zeros em `/data/misc/apexdata/com.android.permission/access.abx`) via `wipe-data` e inicialização bem-sucedida do sistema.
  - Instalação e inicialização automática do app MarIA (`com.acutistech.maria_app`) em execução direta no emulador, com captura de tela validando a tela de login solene pronta com o botão do Google ativo.

### 🏗️ Decisões Técnicas e de Arquitetura
- **Fluxo Nativo de Token ID (Google Sign-In + Supabase Auth):**
  - O aplicativo móvel Flutter utiliza o SDK nativo do Google via `google_sign_in` para obter o `idToken` criptograficamente assinado com o `serverClientId` (Web Client ID).
  - O `idToken` é enviado com segurança para o backend NestJS (`POST /mobile/auth/google`), que o autentica via `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`.
  - O usuário autenticado passa pelo motor de `smartMergeUsers`, vinculando registros prévios criados por WhatsApp ou e-mail na tabela `public.users`.
- **Relocação de Armazenamento AVD (Zero-Impact no Host):**
  - Configuração do ponteiro em `Medium_Phone_API_37.0.ini` para `path=D:\Android\avd\Medium_Phone.avd` associado a uma junção NTFS (`mklink /J`) preserva a compatibilidade total com o Android Studio, CLI e Gradle, poupando a partição primária `C:`.

### 🛠️ Alterações e Implementações
- **Mobile (`mobile/`):**
  - [`pubspec.yaml`](file:///d:/Programming/AcutisTech/MarIA/mobile/pubspec.yaml): Adicionada dependência `google_sign_in: ^7.2.0` e versão elevada para `1.36.0+1`.
  - [`lib/features/auth/data/datasources/auth_remote_data_source.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/data/datasources/auth_remote_data_source.dart): Implementado `loginWithGoogle` com `GoogleSignIn.instance.initialize(...)` e requisição `POST /mobile/auth/google`.
  - [`lib/features/auth/domain/repositories/auth_repository.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/domain/repositories/auth_repository.dart) & [`lib/features/auth/data/repositories/auth_repository_impl.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/data/repositories/auth_repository_impl.dart): Contrato e implementação de `loginWithGoogle`.
  - [`lib/features/auth/presentation/controllers/auth_controller.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/controllers/auth_controller.dart): Estado reativo e tratamento de cancelamento do usuário.
  - [`lib/features/auth/presentation/pages/login_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/login_page.dart): Botão social do Google com indicador de carregamento.
  - [`test/auth_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/auth_test.dart): Testes unitários atualizados cobrindo sucesso e cancelamento do Google Sign-In (45/45 testes aprovados).
  - [`android/app/google_oauth_android.json`](file:///d:/Programming/AcutisTech/MarIA/mobile/android/app/google_oauth_android.json): Credenciais do cliente Android salvas com segurança.
- **Backend (`backend/`):**
  - [`backend/src/mobile/mobile-auth.controller.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile-auth.controller.ts): Endpoint `POST /mobile/auth/google`.
  - [`backend/src/mobile/mobile-auth.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile-auth.service.ts): Método `loginWithGoogle` com validação de `idToken` no Supabase e Smart Merge.
  - [`backend/.env`](file:///d:/Programming/AcutisTech/MarIA/backend/.env) & [`.env.example`](file:///d:/Programming/AcutisTech/MarIA/backend/.env.example): Chave `GOOGLE_WEB_CLIENT_ID` adicionada.
  - [`backend/client_secret_web.json`](file:///d:/Programming/AcutisTech/MarIA/backend/client_secret_web.json): Arquivo de credenciais Web salvo em local seguro.
  - Container Docker `maria-backend-1` reconstruído com sucesso via `docker compose up --build -d backend`.
- **Scripts & Ambiente:**
  - [`.gitignore`](file:///d:/Programming/AcutisTech/MarIA/.gitignore), [`backend/.gitignore`](file:///d:/Programming/AcutisTech/MarIA/backend/.gitignore) e [`mobile/.gitignore`](file:///d:/Programming/AcutisTech/MarIA/mobile/.gitignore): Atualizados com regras para arquivos `*client_secret*.json`, `google_oauth*.json` e keystores.
  - [`iniciar_emulador.bat`](file:///d:/Programming/AcutisTech/MarIA/iniciar_emulador.bat): Atualizado com `ANDROID_AVD_HOME=D:\Android\avd`.
- **Documentação & Versionamento:**
  - [`CHANGELOG.md`](file:///d:/Programming/AcutisTech/MarIA/CHANGELOG.md): Registrada versão `1.36.0` (Google Social Login & Infraestrutura do Emulador).
  - [`README.md`](file:///d:/Programming/AcutisTech/MarIA/README.md): Documentada a arquitetura do Login Social com Google.

### ⏳ Pendências e Próximos Passos
- Conectar uma conta Google de teste no Android Emulator ou executar no dispositivo físico para realizar a validação ponta a ponta do login e entrada no Santuário.
- Implementação futura do Sign in with Apple para iOS quando houver credenciais da conta Apple Developer.
---


