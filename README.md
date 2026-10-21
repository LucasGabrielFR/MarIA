# MarIA - Inteligência Artificial Maternal Católica

## 📌 Sobre o Projeto

## 🚀 Funcionalidades
- **MarIA Mobile (Santuário Digital iOS & Android em Flutter):** Aplicativo multiplataforma com Design System Sacro, tipografia clássica (*Cinzel* e *Plus Jakarta Sans*), Liturgia Diária e Santo do Dia alimentados dinamicamente em tempo real pela base canônica do backend (`daily_cache` via endpoint `/mobile/daily-content` com data sincronizada naturalmente pelo relógio do celular do usuário sem horários chumbados), garantindo paridade total com o Painel Administrativo e disparos do WhatsApp. Inclui **Suporte a Múltiplos Santos no Mesmo Dia** (com badge dinâmico no Hero Card e abas horizontais animadas no `SaintDetailPage` permitindo navegar livremente entre as biografias, virtudes e orações de cada santo celebrado na data litúrgica), **Autenticação Híbrida & Sincronização Omnichannel** (portal de abertura com Login/Cadastro e opção "Acessar sem conta" em modo restrito, exibindo o Plano de Vida e Exame Noturno na Home com Gatekeeper Devocional bloqueando recursos como Exame Noturno, MarIA Chat e Lembretes & Sinos, e ocultando a aba da MarIA na navegação inferior para convidados; **Login Social nativo com Google OAuth via Google Play Services / Supabase Auth**, login tradicional por E-mail/Senha, e vinculação de WhatsApp OTP via Uazapi com Smart Merge de contas pré-existentes), **Plano de Vida Espiritual personalizado** (com hábitos devocionais customizáveis, lembretes híbridos no celular e WhatsApp, streak diário, integração automática com novenas ativas por 9 dias e sincronização resiliente offline-first via Supabase), catálogo de orações/Rosário, **Santuário de Novenas (Novenário Litúrgico com início inteligente baseado na festa do santo — ex: São João Paulo II —, card dinâmico na tela inicial, 9 contas/velas táteis, modal com presets de horários de lembrete no celular e WhatsApp, e catálogo expansível via Supabase/NestJS)**, **Preparação para a Confissão** (com cofre sacramental protegido por biometria/senha do celular, exame detalhado dos 10 Mandamentos, modo confessionário de leitura rápida e expurgo irreversível pós-absolvição) e diálogo de acolhimento sob sigilo de oração. Consulte o planejamento e modelo híbrido em [`docs/ROADMAP_MOBILE.md`](file:///d:/Programming/AcutisTech/MarIA/docs/ROADMAP_MOBILE.md).

- **Linguagem Maternal:** Interação empática e acolhedora.
- **Arquitetura de Cache Híbrido:** Sistema inteligente de dois níveis (Diário e Semântico) para otimização radical de custos de API e redução drástica de latência.
- **Geração Noturna Automatizada:** Processamento via CRON que prepara Liturgia, Santo do Dia e Mistérios do Terço (com reflexões atreladas à Palavra) diariamente às 00:01.
- **Oração do Terço e Rosário Completo:** Capacidade de gerar e recitar os mistérios diários para o fiel, ou compilar os 4 terços da semana para entregar um Rosário completo com reflexões únicas baseadas na liturgia semanal.
- **Cache Semântico Teológico:** Reaproveitamento de respostas complexas do Magisterium AI via busca vetorial (Postgres Vector) com threshold de similaridade de 0.92, fornecendo sempre citações e fontes detalhadas e traduzidas.
- **Exame de Consciência Guiado & Completo (Evolução do Boa Noite):** Envio noturno interativo às 21h com escolha entre exame completo para oração pessoal e exame guiado em 3-4 passos com acolhida pastoral, indicação de virtude antídoto prática para o dia seguinte, Ato de Contrição e política estrita de privacidade/sigilo espiritual (anonimização do desabafo no banco).
- **Modelo de Mensagens Duplas:** Quando o conteúdo vem do cache (Liturgia/Santos), a MarIA envia duas mensagens: uma introdução calorosa personalizada e o conteúdo formatado em seguida, garantindo fidelidade total ao texto e naturalidade no diálogo.
- **Integração WhatsApp Premium:** Comunicação bidirecional via UAZAPI com suporte a **confirmação de leitura automática** e **indicador de "digitando"** em tempo real.
- **Dashboard de Telemetria, Auditoria & Incidentes:** Painel estatístico complexo com gráficos de consumo de tokens, análise de custos financeiros (USD/BRL), auditoria de logs de sistema em tempo real e aba dedicada a **Erros e Incidentes** persistidos no Supabase (`system_logs`), imunes a reinicializações de contêineres Docker.
- **Plano de Vida Espiritual & Lembretes Unificados (Mobile & WhatsApp):** Central única de rotina devocional e hábitos espirituais no app MarIA sincronizada com o backend e BullMQ/Redis. Elimina menus redundantes e consolida **horários 100% flexíveis (00:00 a 23:59)**, **notificações push nativas no celular** (`flutter_local_notifications` com canal Android de alta prioridade `maria_devotional_channel`, alarme exato mesmo com o aparelho bloqueado/em repouso, som de sino sacro e banner de heads-up), **mensagens opcionais no WhatsApp** para cada prática canônica ou pessoal, e expurgo automático de lembretes legados no Supabase (`reminders`), evitando lembretes invisíveis ou mensagens duplicadas.
- **Expiração Automática e Silenciosa de Fluxos Inativos:** Proteção inteligente contra travamentos de fiéis no WhatsApp caso iniciem e abandonem fluxos interativos (criação de lembretes, exame de consciência guiado ou assinatura de planos). Limpeza silenciosa sob demanda ao receber nova mensagem e via rotina CRON a cada 2 minutos, com tempo limite de inatividade customizável na aba de Configurações (padrão de 15 minutos).
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
  - **Fluxos Automáticos (WhatsApp Híbrido & Menus Interativos)**: Nova seção e rota dedicada (`/flows`) para gerenciamento visual de conversas guiadas e estruturadas armazenadas na tabela `automatic_flows`. O sistema possui suporte nativo a botões interativos WhatsApp (`type: "button"`) e menus de gaveta/lista (`type: "list"`, até 10 opções) via Uazapi, com fallback automático e transparente para listas numeradas em texto puro caso o dispositivo de recebimento não suporte mensagens interativas.
  - **Upgrade de Assinatura & Proteção Contra Duplicidade**: Fluxo avançado para mudança e prorrogação de planos (Básico / Premium). Se o usuário tem uma assinatura básica ativa e seleciona assinar o Premium, a assinatura antiga é cancelada no Asaas automaticamente assim que o novo pagamento for confirmado pelo webhook do Asaas, impedindo double billing e cobranças indevidas.
  - **Sincronização em Tempo Real com o Asaas**: Botão físico "Sincronizar com o ASAAS" na aba financeira do painel administrativo que executa uma chamada em lote (lote ativo de assinaturas) via API Asaas para manter os registros do banco local e do gateway sempre em conformidade, além de controles em linha para alterar plano/ciclo (Upgrade) de qualquer assinatura diretamente pelo painel administrativo.
- **Parametrização IA Pro Max**: Interface administrativa totalmente redesenhada com navegação lateral, busca global e labels educativas ("Onde Funciona" e "Impacto") para cada prompt do sistema.
- **Gestão de Administradores e Controle de Acesso (RBAC)**: Tela de gerenciamento dedicada permitindo que superadministradores convidem administradores (com senha padrão `MarIA123` e primeiro login com alteração de senha obrigatória), redefinam senhas a quente, alterem cargos e excluam contas de acesso.
- **Auditoria Operacional Completa (Timeline)**: Registro detalhado em tempo real de todas as ações administrativas críticas na tabela `activity_logs`. Ações como logins, alterações de planos/bônus de fiéis, edições de prompts e resets de cache são exibidos individualmente em uma timeline de auditoria elegante e interativa (Drawer).
- **Novenário MarIA & Supabase como Fonte Única da Verdade:**
  - **Catálogo Canônico Integral de 25 Novenas (225 Dias Estruturados):** Acervo relacional no Supabase (`novenas` e `novena_days`) com curadoria teológica rigorosa segundo a ordem de preferência: **1. Padre Paulo Ricardo (`padrepauloricardo.org`) → 2. Canção Nova (`cancaonova.com`) → 3. ACI Digital (`acidigital.com`)**.
  - **Categorias Contempladas:** Marianas (7), Santos de Devoção Universal (12), Devoções a Nosso Senhor Jesus Cristo (3) e Ciclos Litúrgicos (3).
  - **Riqueza de Conteúdo por Dia:** Cada um dos 225 dias contém Oração Inicial, Citação Bíblica completa com capítulo e versículo, Meditação Teológica aprofundada, Oração do Dia, Proposta de Intenção Particular e Orações Conclusivas tradicionais (Pai Nosso, Ave Maria, Glória, jaculatórias e bênção).
  - **Ferramentas de Automação & Auditoria:** Utilitário Python [`scripts/scrape_novenas.py`](scripts/scrape_novenas.py) para auditoria e raspagem com fallback sequencial entre as três fontes canônicas.
  - **Acompanhamento Espiritual & Progresso:** Registro de intenções pessoais do fiel, controle de dias rezados via contas/velas táteis no app e integração com lembretes no WhatsApp e push notifications.
- **Dashboard Admin:** Painel Vite + React para parametrização de prompts, gestão de fiéis, controle financeiro, curadoria de conteúdos e gestão de novenas.

## 🛠 Arquitetura
- **Motor Cognitivo & Backend:** NestJS (TypeScript) com arquitetura de **Triagem Híbrida**.
  - **Roteador de Intenções:** Classificação inteligente de mensagens e roteamento para caches ou LLMs.
  - **Injeção de Contexto Teológico:** Integração nativa com **Magisterium AI** e Cache Semântico local.
  - **Módulo de Novenas:** Endpoints para o CMS Admin (`/panel/novenas`) e consumo do app móvel (`/mobile/novenas`).
- **Supabase:** Postgres com extensões `vector` para busca por similaridade. Utilizado para a gestão de Prompts Dinâmicos, Cache Diário, Cache Semântico Global, Santos e Novenário Sagrado.
- **Frontend (Admin):** Vite + React + Tailwind CSS v4 + shadcn/ui.
- **Landing Page:** Next.js (React) + Tailwind CSS v4 para conversão, onboarding seguro e ativação de assinaturas.

## 🏃 Como Rodar o Projeto

Para agilizar o desenvolvimento, configuramos um orquestrador na raiz que inicia o Frontend e o Backend simultaneamente.

### Pré-requisitos
- Node.js instalado
- Dependências instaladas (você pode usar `npm run install:all` na raiz para instalar as dependências de todos os serviços: `backend`, `frontend` e `landing`).

### Execução em Desenvolvimento
Na raiz do projeto, você pode usar um dos seguintes comandos:

- **Via Terminal (npm):** `npm run dev`
- **Via Windows (Powershell):** `./dev.ps1`
- **Via Windows (CMD/Batch):** `dev.bat`

Isso iniciará o Vite (Frontend) na porta padrão e o NestJS (Backend) com hot-reload. Para a Landing Page, inicie separadamente acessando a pasta `landing` e rodando `npm run dev`.

### Execução em Servidor (VPS) via Docker (Recomendado)
Para realizar o deploy em um servidor VPS de forma isolada, limpa e padronizada, o projeto possui suporte oficial a Docker e Docker Compose com o Nginx atuando como API Gateway:

- **`/`**: Landing Page (Next.js)
- **`/admin`**: Painel Administrativo Web (React + Vite)
- **`/mobile`**: Aplicativo MarIA Web (Flutter Web PWA)
- **`/api/`**: Gateway Backend (NestJS)
- **`/webhook/`**: Webhooks Asaas e Uazapi

> 📖 **Instruções Detalhadas para IA e Operadores:** Consulte o runbook completo e automatizado em [`DEPLOY_GUIDELINES.md`](DEPLOY_GUIDELINES.md).

1. Conecte-se via SSH ao seu servidor e clone/puxe o projeto (`git pull origin main`).
2. Compile os estáticos do Flutter Web (ou transfira a pasta `mobile/build/web`):
   ```bash
   npm run build:mobile:web
   ```
3. Suba todos os serviços usando o orquestrador Docker Compose:
   ```bash
   docker compose up -d --build
   ```
O Docker irá gerenciar automaticamente as imagens, empacotando os estáticos do Admin e do Mobile Web dentro do Nginx (`frontend`), levantando os serviços nas portas 3002 (Backend), 3003 (Landing), 8081 (Frontend Gateway) e 6379 (Redis).

### Execução em Servidor via PM2 (Legado)
Para ambientes que não possuem Docker, também fornecemos scripts automatizados baseados no `pm2` para gerenciar os processos.

1. Conecte-se via SSH e puxe o projeto.
2. Dê permissão ao script de deploy:
   ```bash
   chmod +x scripts/deploy.sh
   ```
3. Execute o script de deploy:
   ```bash
   ./scripts/deploy.sh
   ```
Este comando instala dependências, gera a build e reinicia o projeto via **PM2** (`ecosystem.config.js`).

## 📄 Documentação
- [Guia de Deploy Automatizado para IA & Servidor](DEPLOY_GUIDELINES.md)
- [Documentação Geral da Arquitetura](docs/DOCUMENTATION.md)
- [Guia Magisterium AI](docs/MAGISTERIUM_AI.md)
- [Fluxo de Mensagens](docs/MESSAGE_FLOW.md)
- [Arquitetura Mobile](docs/PLANO_ARQUITETURA_MOBILE.md)
- [Roadmap Mobile](docs/ROADMAP_MOBILE.md)
- [Planos de Ação e Arquitetura](docs/plans/)
  - [Plano de Ação e Arquitetura Geral](docs/plans/action-plan.md)
  - [Arquitetura de Autenticação e Sync](docs/plans/auth-sync-architecture-plan.md)
  - [Arquitetura do CMS de Novenas](docs/plans/novenas-cms-architecture-plan.md)
  - [Plano de Vida Espiritual](docs/plans/spiritual-life-plan.md)
- [Propostas & Negócio](docs/business/)
  - [Proposta de Negócio MarIA](docs/business/PROPOSTA_MARIA.md)

---
*Projeto em desenvolvimento ativo. Migração arquitetural em andamento para a arquitetura híbrida (Backend/Flows).*
