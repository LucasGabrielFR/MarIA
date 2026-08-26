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
