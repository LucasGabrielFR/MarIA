# MarIA - Inteligência Artificial Maternal Católica

## 📌 Sobre o Projeto
MarIA é uma IA Generativa integrada ao WhatsApp que personifica a figura de Nossa Senhora, a Mãe Espiritual. O objetivo é oferecer acolhimento, acompanhamento devocional e humanização da doutrina católica em um ambiente de fácil acesso para os fiéis.

## 🚀 Funcionalidades
- **Linguagem Maternal:** Interação empática e acolhedora.
- **Lógica Híbrida:** Fluxo conversacional gerido no backend (GPT-4o-mini) auxiliado por planejamento visual, e automações (CRONs) via n8n.
- **Integração WhatsApp:** Comunicação bidirecional via provedor oficial UAZAPI (Webhooks e Outbound REST).
- **Memória de Longo Prazo:** Resumo periódico do contexto conversacional do usuário e histórico completo para uma experiência de atendimento super personalizada.
- **Dashboard Admin:** Painel Vite + React para parametrização dinâmica de prompts, gerenciamento de usuários e monitoramento.
- **Parametrização Dinâmica:** Controle total sobre a persona e regras da IA via interface administrativa.

## 🛠 Arquitetura
- **Motor Cognitivo & Backend:** NestJS (TypeScript) com arquitetura de **Two-Step Prompting**.
  - **Roteador de Intenções:** Classificação inteligente de mensagens.
  - **Injeção de Contexto Teológico:** Integração nativa com **Magisterium AI**.
- **Supabase:** Postgres com RLS avançado. Utilizado para a gestão de Prompts Dinâmicos e Tabela de Históricos de Conversas (`messages`) e Sumarização Geral (`user_contexts`).
- **Frontend (Admin):** Vite + React + Tailwind CSS v4 + shadcn/ui.

## 🏃 Como Rodar o Projeto

Para agilizar o desenvolvimento, configuramos um orquestrador na raiz que inicia o Frontend e o Backend simultaneamente.

### Pré-requisitos
- Node.js instalado
- Dependências instaladas em ambas as pastas (`frontend` e `backend`)

### Execução em Desenvolvimento
Na raiz do projeto, você pode usar um dos seguintes comandos:

- **Via Terminal (npm):** `npm run dev`
- **Via Windows (Powershell):** `./dev.ps1`
- **Via Windows (CMD/Batch):** `dev.bat`

Isso iniciará o Vite (Frontend) na porta padrão e o NestJS (Backend) com hot-reload.

### Execução em Servidor (VPS)
Para realizar o deploy em um servidor VPS (Linux), fornecemos scripts automatizados baseados no `pm2` para gerenciar os processos em produção.

1. Conecte-se via SSH ao seu servidor e clone/puxe o projeto.
2. Na raiz do projeto, certifique-se de ter dado permissão de execução ao script:
   ```bash
   chmod +x deploy.sh
   ```
3. Execute o script de deploy:
   ```bash
   ./deploy.sh
   ```
Este comando irá baixar as últimas atualizações, instalar todas as dependências (`frontend` e `backend`), gerar a build e reiniciar o projeto usando o **PM2** (via `ecosystem.config.js`). O backend rodará na porta padrão do Nest e o frontend via preview do Vite.

## 📄 Documentação
- [Guia Magisterium AI](docs/MAGISTERIUM_AI.md)
- [Proposta de Negócio](PROPOSTA_MARIA.md)
- [Plano de Ação e Arquitetura](action-plan.md)

---
*Projeto em desenvolvimento ativo. Migração arquitetural em andamento para a arquitetura híbrida (Backend/Flows).*
