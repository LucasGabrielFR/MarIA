# MarIA - Inteligência Artificial Maternal Católica

## 📌 Sobre o Projeto
MarIA é uma IA Generativa integrada ao WhatsApp que personifica a figura de Nossa Senhora, a Mãe Espiritual. O objetivo é oferecer acolhimento, acompanhamento devocional e humanização da doutrina católica em um ambiente de fácil acesso para os fiéis.

## 🚀 Funcionalidades
- **Linguagem Maternal:** Interação empática e acolhedora.
- **Arquitetura de Cache Híbrido:** Sistema inteligente de dois níveis (Diário e Semântico) para otimização radical de custos de API e redução drástica de latência.
- **Geração Noturna Automatizada:** Processamento via CRON que prepara Liturgia, Santo do Dia e Reflexões diárias às 00:01.
- **Cache Semântico Teológico:** Reaproveitamento de respostas complexas do Magisterium AI via busca vetorial (Postgres Vector) com threshold de similaridade de 0.92.
- **Modelo Bridge (Gemini 2.5 Flash Lite):** Uso estratégico de modelos de baixo custo para personalização de conteúdo cacheado sem perda de qualidade na persona, configurável via ambiente.
- **Integração WhatsApp Premium:** Comunicação bidirecional via UAZAPI com suporte a **confirmação de leitura automática** e **indicador de "digitando"** em tempo real.
- **Dashboard Admin:** Painel Vite + React para parametrização de prompts, gerenciamento de usuários e **curadoria manual de conteúdos diários**.

## 🛠 Arquitetura
- **Motor Cognitivo & Backend:** NestJS (TypeScript) com arquitetura de **Triagem Híbrida**.
  - **Roteador de Intenções:** Classificação inteligente de mensagens e roteamento para caches ou LLMs.
  - **Injeção de Contexto Teológico:** Integração nativa com **Magisterium AI** e Cache Semântico local.
- **Supabase:** Postgres com extensões `vector` para busca por similaridade. Utilizado para a gestão de Prompts Dinâmicos, Cache Diário e Cache Semântico Global.
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
