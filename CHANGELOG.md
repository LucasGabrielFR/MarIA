# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-08

### Added
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
