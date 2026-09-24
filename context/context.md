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
