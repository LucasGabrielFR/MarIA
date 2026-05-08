# MarIA - Inteligência Artificial Maternal Católica

## 📌 Sobre o Projeto
MarIA é uma IA Generativa integrada ao WhatsApp que personifica a figura de Nossa Senhora, a Mãe Espiritual. O objetivo é oferecer acolhimento, acompanhamento devocional e humanização da doutrina católica em um ambiente de fácil acesso para os fiéis.

## 🚀 Funcionalidades
- **Linguagem Maternal:** Interação empática e acolhedora.
- **Lógica Híbrida:** Fluxo conversacional gerido no backend (GPT-4o-mini) auxiliado por planejamento visual, e automações (CRONs) via n8n.
- **Triagem Automatizada:** Onboarding de novos fiéis diretamente no WhatsApp.
- **Dashboard Admin:** Painel Vite + React para gerenciamento de usuários e monitoramento de analytics/créditos.
- **Monitoramento de Custos:** Acompanhamento em tempo real de consumo de tokens e custos de API.

## 🛠 Arquitetura
- **Motor Cognitivo & Backend:** NestJS (TypeScript) utilizando o SDK oficial do Supabase e GPT-4o-mini.
- **Gateway:** UAZAPI para integração com WhatsApp.
- **Frontend (Admin):** Vite + React + Tailwind CSS v4 + shadcn/ui + Styled-components.
- **Banco de Dados:** Supabase (Postgres) com Row Level Security (RLS).
- **Documentação Adicional:** [CHANGELOG.md](CHANGELOG.md) para histórico de versões.

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

## 📄 Documentação
- [Proposta de Negócio](PROPOSTA_MARIA.md)
- [Plano de Ação e Arquitetura](action-plan.md)

---
*Projeto em desenvolvimento ativo. Migração arquitetural em andamento para a arquitetura híbrida (Backend/Flows).*
