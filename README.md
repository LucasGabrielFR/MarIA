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
- **Landing Page Premium com Checkout Integrado**:
  - **Identidade 100% Católica**: Copywriting focado no carinho maternal de Nossa Senhora e alinhamento dogmático estrito com o Magistério e o Catecismo da Igreja.
  - **Vitrine Dinâmica de Conversas**: Celular (iPhone) 3D perfeitamente alinhado com transição de screenshots reais das conversas e corte automático de barras de status para máxima credibilidade.
  - **Filtro e FAQ Inteligente**: Sessão interativa de Perguntas Frequentes (FAQ) detalhando aspectos de privacidade, sacramentos, quotas e limites.
  - **Suporte Centralizado**: Integração do canal corporativo oficial `maria@acutistech.com.br` para suporte técnico e solicitações de exclusão de dados.
  - **Checkout Seguro + Código de Ativação (Web → WhatsApp)**: Fluxo que elimina a necessidade de coletar telefone na Landing Page. O cliente faz o checkout seguro diretamente no Asaas, e a Landing Page realiza polling dinâmico exibindo em tempo real o código único `MARIA-XXXXXX` de ativação. Um botão elegante direciona o cliente direto ao WhatsApp para ativar sua conta de forma 100% automatizada. Os códigos gerados possuem expiração automática de 1 hora para maior segurança.
  - **Área do Assinante Nocode (Minha Conta):** Autenticação rápida de assinantes via código de verificação de 6 dígitos enviado por WhatsApp, dispensando senhas. Uma vez logado, o cliente possui acesso a uma interface premium (com histórico de faturas, próximo vencimento e status) para gerenciar sua assinatura de forma direta: cancelar cobranças recorrentes (com modal de dupla confirmação, mantendo o acesso ativo até a data de expiração do ciclo já pago) ou mudar de plano (upgrades/downgrades em tempo real com redefinição/zeragem automática de seu limite de mensagens) integrado ao Asaas.
- **Inteligência Financeira e Assinaturas (Stripe → Asaas)**:
  - **Integração Asaas**: Checkout robusto no cartão de crédito via links de pagamento hospedados, integrado aos ciclos Mensal e Anual com concessão automática de acesso. Adicionado suporte completo a assinaturas com origem `web` (via código de ativação enviado por e-mail e exibido na tela) e `wpp` (fluxo nativo e orgânico do WhatsApp), com sincronização e cancelamento automático de planos anteriores para evitar double billing.
  - **Serviço de Mail Transacional**: Módulo global integrado (`MailService`) que envia e-mails elegantes com o código de ativação destacado e instruções de resgate para o e-mail de faturamento do cliente cadastrado de forma segura no Asaas.
  - **Módulo Financeiro**: Dashboard de Margem de Contribuição com cálculo em tempo real de Receita vs. Custos de IA, agora equipado com **Filtro de Período dinâmico** por presets rápidos (Mês Atual, Semana, 15/30 Dias, 3/6 Meses, Ano, Todo o Período) ou datas personalizadas via calendário.
  - **Gestão de Assinatura Premium**: Painel de visualização moderno em grid de cards interativos, com atalhos inteligentes de prorrogação de prazo (+30, +90 dias, Limpar) e controles estritos de validade.
  - **Comprovação de Pagamento (Emerald Panel)**: Seção dedicada com degradê elegante, seletor segmentado e registro ágil de pagamentos em Pix/Dinheiro com emissão automática de 30 dias de acesso premium.
  - **Cancelamento e Exclusão Segura**: Operações destrutivas no financeiro com validação de perfil de `superadmin` no banco de dados e modais de confirmação dinâmicos.
  - **Controle de Quotas Inteligente**: Diferenciação automática entre mensagens gerativas (LLM) e conteúdos utilitários (Cache), garantindo que consultas à Liturgia ou Santo do Dia não consumam a franquia do fiel.
  - **Pausa Pastoral (Silenciamento do Bot)**: Permite pausar individualmente o envio de respostas automáticas da IA para um fiel específico através do dashboard, mantendo o recebimento de mensagens e o histórico íntegros.
  - **Limite de Bônus (R$)**: Define um limite mensal de bônus em Reais (R$) para o consumo de mensagens extras fora da franquia padrão de mensagens do plano do fiel, com bloqueio automático inteligente e aviso amigável quando atingido.
  - **Recuperação e Métricas**: Usuários com dados excluídos são mantidos como `disabled` para métricas; ao enviar nova mensagem, a triagem é reiniciada automaticamente.
  - **Arquitetura Plugável**: Estrutura preparada para integração de webhooks do Asaas para processar cancelamentos e aprovações de crédito.
  - **Fluxos Automáticos de Vendas (WhatsApp Híbrido)**: Nova seção e rota dedicada (`/flows`) para gerenciamento visual de conversas guiadas e estruturadas armazenadas na tabela `automatic_flows`. O sistema possui suporte nativo a botões interativos WhatsApp via Uazapi com fallback automático e transparente para listas numeradas em texto puro (Híbrido) caso o dispositivo de recebimento não suporte botões.
  - **Upgrade de Assinatura & Proteção Contra Duplicidade**: Fluxo avançado para mudança e prorrogação de planos (Básico / Premium). Se o usuário tem uma assinatura básica ativa e seleciona assinar o Premium, a assinatura antiga é cancelada no Asaas automaticamente assim que o novo pagamento for confirmado pelo webhook do Asaas, impedindo double billing e cobranças indevidas.
  - **Sincronização em Tempo Real com o Asaas**: Botão físico "Sincronizar com o ASAAS" na aba financeira do painel administrativo que executa uma chamada em lote (lote ativo de assinaturas) via API Asaas para manter os registros do banco local e do gateway sempre em conformidade, além de controles em linha para alterar plano/ciclo (Upgrade) de qualquer assinatura diretamente pelo painel administrativo.
- **Parametrização IA Pro Max**: Interface administrativa totalmente redesenhada com navegação lateral, busca global e labels educativas ("Onde Funciona" e "Impacto") para cada prompt do sistema.
- **Gestão de Administradores e Controle de Acesso (RBAC)**: Tela de gerenciamento dedicada permitindo que superadministradores convidem administradores (com senha padrão `MarIA123` e primeiro login com alteração de senha obrigatória), redefinam senhas a quente, alterem cargos e excluam contas de acesso.
- **Auditoria Operacional Completa (Timeline)**: Registro detalhado em tempo real de todas as ações administrativas críticas na tabela `activity_logs`. Ações como logins, alterações de planos/bônus de fiéis, edições de prompts e resets de cache são exibidos individualmente em uma timeline de auditoria elegante e interativa (Drawer).
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

### Execução em Servidor (VPS) via Docker (Recomendado)
Para realizar o deploy em um servidor VPS de forma isolada, limpa e padronizada, o projeto possui suporte oficial a Docker e Docker Compose.

1. Conecte-se via SSH ao seu servidor e clone/puxe o projeto.
2. Na raiz do projeto, crie e configure os arquivos de ambiente:
   - `backend/.env`
   - `landing/.env.local`
3. Suba todos os serviços usando o orquestrador Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
O Docker irá gerenciar automaticamente o banco de imagens, dependências, o build otimizado (standalone para a Landing Page e Nginx para o Frontend SPA) e levantar os serviços nas portas 3000 (Landing), 3001 (Backend) e 8080 (Frontend).

### Execução em Servidor via PM2 (Legado)
Para ambientes que não possuem Docker, também fornecemos scripts automatizados baseados no `pm2` para gerenciar os processos.

1. Conecte-se via SSH e puxe o projeto.
2. Na raiz do projeto, dê permissão ao script:
   ```bash
   chmod +x deploy.sh
   ```
3. Execute o script de deploy:
   ```bash
   ./deploy.sh
   ```
Este comando instala dependências, gera a build e reinicia o projeto via **PM2** (`ecosystem.config.js`).

## 📄 Documentação
- [Análise Financeira](ANALISE_FINANCEIRA.md)
- [Guia Magisterium AI](docs/MAGISTERIUM_AI.md)
- [Proposta de Negócio](PROPOSTA_MARIA.md)
- [Plano de Ação e Arquitetura](action-plan.md)

---
*Projeto em desenvolvimento ativo. Migração arquitetural em andamento para a arquitetura híbrida (Backend/Flows).*
