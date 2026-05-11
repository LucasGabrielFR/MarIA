# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-05-11

### Added
- **Tabela `saints` no Supabase:** Novo schema para persistência definitiva dos santos do calendário romano, com índice por `(month, day)` e constraint UNIQUE por `(month, day, name)`.
- **Script `scripts/scrape_saints.py`:** Utilitário Python autônomo que raspa os ~365 dias do Vatican News, extrai títulos, descrições curtas e biografias completas (via "Leia tudo"), salvando tudo no banco via `upsert`. Suporta `--month`, `--day` e `--resume`.
- **`scripts/requirements.txt`:** Dependências Python para os scripts utilitários (`requests`, `beautifulsoup4`, `supabase`, `python-dotenv`).

### Changed
- **`SaintService` refatorado (DI correta):** Injeção do `SupabaseService` via NestJS em vez de criar cliente próprio — garante consistência com o restante da arquitetura e autenticação `SERVICE_ROLE_KEY`.
- **Fluxo de geração do santo:** `CronService.generateSaint` agora obtém dados brutos direto da tabela `saints` (zero latência HTTP); o scraping do Vatican News é mantido apenas como fallback para dias não indexados.
- **Encoding UTF-8 corrigido:** Forçado `response.encoding = 'utf-8'` no script de scraping, corrigindo caracteres corrompidos nos nomes dos santos.

## [1.2.0] - 2026-05-11


### Added
- **Arquitetura de Cache Híbrido:** Implementação de um sistema de cache de dois níveis para otimização de custos e latência.
- **Geração Automatizada (CronService):** Sistema de tarefas agendadas que gera conteúdos de Liturgia Diária, Santo do Dia e Reflexões Espirituais semanalmente domingo às 00:01 usando GPT-4o.
- **Cache Semântico (Vector Search):** Integração com Supabase Vector para reaproveitamento de respostas teológicas complexas (Magisterium AI) baseadas em similaridade de embeddings (threshold 0.92).
- **Modelo Bridge (Gemini Flash):** Uso do modelo Gemini 1.5 Flash como ponte de baixo custo para envolver conteúdos cacheados na persona da MarIA, economizando tokens de modelos premium.
- **Painel de Conteúdo Diário:** Nova interface administrativa para revisão, edição e gerenciamento manual dos textos gerados pela cron.

### Changed
- **AiModule:** Inclusão de `CronService`, `EmbeddingService` e `ScheduleModule`.
- **Backend Flow:** O processamento de mensagens agora realiza triagem automática em caches locais antes de invocar APIs externas de alto custo.
- **Sidebar Admin:** Adição de navegação direta para gerenciamento de conteúdos diários.

### Fixed
- **Intent Routing:** Adição da intenção `REFLECTION` para tratar solicitações de mensagens inspiracionais diárias.

## [1.1.1] - 2026-05-10

### Added
- **Confirmação de Leitura Automática:** O bot agora marca as mensagens recebidas como lidas imediatamente após o processamento inicial.
- **Indicador de Digitando:** Implementado o estado de "composing" (digitando) enquanto a IA processa a resposta, oferecendo um feedback visual em tempo real para o usuário no WhatsApp.

### Changed
- **Serviço UAZAPI:** Expansão do `UazapiService` para incluir métodos de manipulação de presença e status de leitura de chats.

## [1.1.0] - 2026-05-08

### Added
- **Deploy Automático:** Script bash (`deploy.sh`) e configuração do PM2 (`ecosystem.config.js`) para simplificar e gerenciar a execução do app em servidores VPS Linux.
- **Integração UAZAPI (WhatsApp):** Recebimento e envio de mensagens via provedor UAZAPI (Webhook e Outbound).
- **Memória de Longo e Curto Prazo (Supabase):** Implementação de armazenamento de histórico de chat e sumarização assíncrona de contexto geral do usuário a cada 10 mensagens para prover contexto enriquecido ao LLM.
- **Integração Magisterium AI (Chat API):** Consulta à base oficial de dados teológicos via API robusta.
- **Arquitetura de Regras Dinâmicas:** Sistema de roteamento de intenções com injeção de regras estritas (`rule_crisis`, `rule_prohibited`, `rule_etiquette`).
- **Novo Prompt de Persona:** Refinamento do core maternal e acolhedor da MarIA.
- **Documentação Técnica:** Guia completo de integração com Magisterium AI em `docs/MAGISTERIUM_AI.md`, Script SQL inicial em `docs/sql/uazapi_init.sql` e Fluxo de Mensagens em `docs/MESSAGE_FLOW.md`.
- **Auditoria de Webhooks:** Tabela `webhook_logs` para armazenamento de payloads brutos da UAZAPI, facilitando depuração e análise de eventos.

### Changed
- **UI de Parametrização:** Reformulação completa da página de configurações da IA usando **Tabs** para reduzir a carga cognitiva.
- **Design Premium:** Implementação de estética "Sacred-Digital" com gradientes suaves, tipografia refinada e cards de alta definição.
- **Segurança (Supabase):** Correção de recursão infinita em políticas RLS usando funções `SECURITY DEFINER`.

### Fixed
- **Componentes UI:** Correção de importação do `Textarea` no shadcn/ui.
- **Componentes UI:** Estabilização do componente de Abas (Base UI), corrigindo atributos `data-[active]` e layout `flex` que causavam sobreposição.
- **Backend:** Resolução de erro de compilação no `AiService` ao importar dependências essenciais do `MagisteriumService`.
- **Ícones:** Correção global na importação de ícones do `lucide-react`, eliminando prefixos incorretos.
- **Estabilidade do Roteador:** Tratamento de erros aprimorado na classificação de intenções.

## [1.0.0] - 2026-05-08

### Added
- Arquitetura de Inteligência Artificial dinâmica com **Two-Step Prompting**.
- **Roteador de Intenções:** LLM dedicado para classificar mensagens em categorias (Casual, Oração, Teologia, Conselhos).
- **PromptService:** Sistema de cache em memória para regras da IA com atualização em tempo real.
- **Painel de Parametrização:** Interface administrativa para editar prompts e regras do sistema.

### Fixed
- Correção de **Recursão Infinita nas Políticas RLS** do Supabase usando funções `security definer`.
- Ajuste na localização de componentes shadcn instalados incorretamente.
