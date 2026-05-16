# MarIA - Inteligência Artificial Maternal Católica

## 📌 Sobre o Projeto

## 🚀 Funcionalidades
- **Linguagem Maternal:** Interação empática e acolhedora.
- **Arquitetura de Cache Híbrido:** Sistema inteligente de dois níveis (Diário e Semântico) para otimização radical de custos de API e redução drástica de latência.
- **Geração Noturna Automatizada:** Processamento via CRON que prepara Liturgia, Santo do Dia e Mistérios do Terço (com reflexões atreladas à Palavra) diariamente às 00:01.
- **Oração do Terço e Rosário Completo:** Capacidade de gerar e recitar os mistérios diários para o fiel, ou compilar os 4 terços da semana para entregar um Rosário completo com reflexões únicas baseadas na liturgia semanal.
- **Cache Semântico Teológico:** Reaproveitamento de respostas complexas do Magisterium AI via busca vetorial (Postgres Vector) com threshold de similaridade de 0.92, fornecendo sempre citações e fontes detalhadas e traduzidas.
- **Modelo de Mensagens Duplas:** Quando o conteúdo vem do cache (Liturgia/Santos), a MarIA envia duas mensagens: uma introdução calorosa personalizada e o conteúdo formatado em seguida, garantindo fidelidade total ao texto e naturalidade no diálogo.
- **Integração WhatsApp Premium:** Comunicação bidirecional via UAZAPI com suporte a **confirmação de leitura automática** e **indicador de "digitando"** em tempo real.
- **Dashboard de Telemetria e Auditoria:** Painel estatístico complexo com gráficos de consumo de tokens, análise de custos financeiros (USD/BRL) e auditoria de logs de sistema em tempo real.
- **Busca e Ordenação de Modelos**: Interface administrativa aprimorada com busca em tempo real e ordenação alfabética para facilitar a seleção de IAs.
- **IA Bridge & Roteamento Inteligente**: Arquitetura otimizada para tarefas de backend e conversação.
- **Acolhimento Humano e Contextual:** Antes de entregar conteúdos de liturgia ou santos, a MarIA gera uma saudação espiritual baseada no conteúdo do dia, tornando a conversa mais humana e menos mecânica.
- **Gestão Financeira e IA Dinâmica:** Sincronização automática de câmbio (AwesomeAPI) e seleção assistida de modelos via OpenRouter com visualização de custos. O sistema permite a troca a quente (hot-swap) dos modelos Principal, Ponte e Cron diretamente pelo painel administrativo.
- **Controle de Infraestrutura Crítica:** Funcionalidade de **Modo de Manutenção** para pausa imediata de atendimento e ferramenta de **Limpeza de Cache Semântico** para renovação de interpretações teológicas.
- **Segurança Enterprise:** Implementação de Row Level Security (RLS) em todo o banco de dados, garantindo isolamento total e controle granular de acesso administrativo com **diálogos de confirmação** para ações críticas e irreversíveis.
- **Proteção de Dados e Segurança Maternal:** Identificação de intenções maliciosas ou pedidos de dados sensíveis (tokens, segredos). A MarIA responde com firmeza e um "puxão de orelha" maternal, protegendo o sistema com doçura e autoridade espiritual.
- **Onboarding Humanizado em 2 Etapas**: Fluxo de acolhimento que separa a saudação inicial da apresentação detalhada de ferramentas e oferta de planos.
- **Inteligência Financeira e Assinaturas**:
  - **Módulo Financeiro**: Dashboard de Margem de Contribuição com cálculo em tempo real de Receita vs. Custos de IA.
  - **Gestão de Checkout**: Sistema modular para registro de pagamentos manuais e alertas automáticos de vencimento via WhatsApp.
  - **Controle de Quotas Inteligente**: Diferenciação automática entre mensagens gerativas (LLM) e conteúdos utilitários (Cache), garantindo que consultas à Liturgia ou Santo do Dia não consumam a franquia do fiel.
  - **Recuperação e Métricas**: Usuários com dados excluídos são mantidos como `disabled` para métricas; ao enviar nova mensagem, a triagem é reiniciada automaticamente.
  - **Arquitetura Plugável**: Estrutura preparada para integração futura com gateways (Stripe, Mercado Pago).
- **Parametrização IA Pro Max**: Interface administrativa totalmente redesenhada com navegação lateral, busca global e labels educativas ("Onde Funciona" e "Impacto") para cada prompt do sistema.
- **Dashboard Admin:** Painel Vite + React para parametrização de prompts, gestão de fiéis, controle financeiro e curadoria de conteúdos.

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
- [Análise Financeira](ANALISE_FINANCEIRA.md)
- [Guia Magisterium AI](docs/MAGISTERIUM_AI.md)
- [Proposta de Negócio](PROPOSTA_MARIA.md)
- [Plano de Ação e Arquitetura](action-plan.md)

---
*Projeto em desenvolvimento ativo. Migração arquitetural em andamento para a arquitetura híbrida (Backend/Flows).*
