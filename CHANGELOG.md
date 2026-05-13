# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/pt-br/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.6] - 2026-05-13
### Added
- Reconstrução total do componente `ModelSelect` do zero para máxima estabilidade e controle de foco.
- Seletor de modelos customizado com busca em tempo real, glassmorphism e ordenação alfabética.
- Otimização de layout nos cards do admin (remoção de overflow-hidden) para evitar corte dos menus suspensos.
- Melhoria na gestão de eventos (stopPropagation e clickOutside) para garantir uma experiência de busca fluida e sem interrupções.

### Fixed
- Removido import não utilizado do `Base UI Select` que causava erro de build (TS6133).

## [1.6.5] - 2026-05-13
### Fixed
- **Remoção de Placeholders:** Eliminada a exibição e salvamento de marcadores internos como `[CONTEÚDO CACHEADO...]` nas mensagens da MarIA.
- **Clareza Temporal:** Adicionada restrição rigorosa contra o uso de termos relativos ("hoje", "amanhã", "ontem") nas respostas da IA, garantindo precisão ao consultar liturgias e santos de datas passadas ou futuras.
- **Integridade do Histórico:** O sistema agora salva apenas o conteúdo espiritual das mensagens no histórico, removendo metadados técnicos.

## [1.6.4] - 2026-05-13
### Added
- **Inteligência de Datas:** Detecção avançada de referências temporais (ex: "domingo", "dia 15", "amanhã") via IA Bridge, garantindo que a liturgia e o santo corretos sejam entregues.
- **Modelo de Ponte (Configurável):** Nova opção no painel de configurações para definir o modelo de roteamento e extração (ex: Gemini Flash para baixo custo e alta velocidade).

### Changed
- **Acolhimento Humano:** A saudação da MarIA antes de liturgia/santos agora é contextual e baseada no conteúdo do dia, fugindo de frases genéricas e trazendo uma reflexão inicial rápida.
- **Dinamismo de Modelos:** O `AiService` agora consome os modelos (`main`, `bridge`) diretamente do banco de dados, permitindo troca a quente sem reinicialização do servidor.
- **Cabeçalhos de Data:** Toda resposta de liturgia ou santo agora inclui obrigatoriamente um cabeçalho com a data referida (`*Liturgia do dia DD/MM/AAAA*`).

### Fixed
- **Build Backend:** Corrigido erro de tipagem (TS2554) no `AiService` relacionado à passagem de parâmetros na extração de datas.

## [1.6.3] - 2026-05-13

## [1.6.2] - 2026-05-13

### Added
- **Seleção Dinâmica de Modelos (OpenRouter):** Substituição de inputs de texto plano por componentes de seleção (`Select`) que consultam em tempo real a API do OpenRouter.
- **Metadados de IA:** O seletor agora exibe informações críticas como custo por milhão de tokens (Input/Output) e limite de contexto, auxiliando na escolha estratégica dos motores de IA.
- **Filtragem Inteligente:** O sistema filtra automaticamente modelos compatíveis com processamento de texto (`text->text`).
- **Sincronização Financeira Automática:** A taxa de câmbio (USD/BRL) é sincronizada via AwesomeAPI sempre que a página de configurações é aberta, garantindo precisão nos cálculos de custo.
- **Polimento Estético (Danger Zone):** Redesign da Zona de Segurança com melhor hierarquia visual e feedback tátil.

## [1.6.0] - 2026-05-13

### Added
- **Dashboard de Dados e Logs:** Nova central de telemetria com gráficos interativos (Recharts) para monitoramento de tokens e custos diários.
- **Auditoria Técnica:** Implementação de logs detalhados de uso de IA e eventos de Webhook com paginação.
- **Central de Configurações:** Interface simplificada para gestão de modelos de IA (Main e Cron), taxa de câmbio e nova Zona de Segurança redesenhada.
- **UI/UX Relevante:** Redesign da Zona de Perigo com melhor hierarquia visual e remoção de parâmetros técnicos secundários (Temperature/Max Tokens/Budget) para maior foco operacional.

### Changed
- **Persistência de Parâmetros:** Migração das configurações de modelos e taxas de câmbio de variáveis de ambiente estáticas para a tabela `system_settings` no Supabase, permitindo atualizações em tempo real sem restart do servidor.

## [1.5.4] - 2026-05-12

### Added
- **Geração Individual de Conteúdo:** Adicionados botões para gerar Liturgia e Santo do Dia de forma independente no painel administrativo.
- **Botão Gerar Tudo:** Renomeado o botão global de IA para maior clareza operacional.
- **Métricas Reais de Engajamento:** Implementação do cálculo dinâmico de frequência de uso nos últimos 30 dias.
- **Contagem de Mensagens:** Substituição da métrica de frequência por "Mensagens Enviadas" no dashboard principal para melhor clareza do volume de uso.
- **Gráfico de Atividade Diária:** Implementação de um gráfico de área (Recharts) no modal do usuário, exibindo o volume de interações dos últimos 30 dias.
- **Perfil de Interação Dinâmico:** Classificação automática de usuários (Super Engajado, Engajado, Ocasional, Inativo) baseada na atividade real.
- **Detalhamento de Tokens I/O:** Separação visual e lógica entre tokens de entrada (prompt) e saída (completion) em todos os níveis de análise.
- **Monitoramento de Automação (GPT-4o):** Inclusão do modelo GPT-4o no dashboard para rastrear custos de crons e processamentos de fundo.
- **Análise Detalhada por Modelo:** Novo painel no dashboard com breakdown de tokens e custos (USD/BRL) por IA.
- **Histórico de Conversas Real:** Integração do banco de dados com o card de conversas recentes do dashboard.
- **Métricas Individuais por Usuário:** Detalhamento de consumo de tokens e custos por modelo dentro do modal de gestão de fiéis.
- **Indicadores de Saúde Dinâmicos:** Monitoramento de status de banco de dados e personas ativas no painel principal.

### Changed
- **Interface de Conteúdo Diário:** Removida a aba "Reflexão" e simplificado o fluxo de revisão diária.

### Fixed
- **API de Liturgia:** Corrigido o formato da URL de requisição para `?dia={dia}&mes={mes}&ano={ano}`, garantindo a busca correta para datas específicas.
- **Metrificação de Crons:** Implementado o registro de uso de tokens (GPT-4o) para as automações de Liturgia e Santo do Dia, garantindo visibilidade total de custos de infraestrutura.
- **Consumo por Modelo:** Corrigido erro de exibição `[OBJECT OBJECT]` no detalhamento de tokens por usuário.
- **Detalhamento I/O:** Corrigido problema de valores zerados em tokens de entrada/saída no modal de fiéis.
- **Build Frontend:** Removida variável `isGlobal` não utilizada que causava erro de compilação.
- Erro de sintaxe (JSX Parse Error) no modal de gestão de fiéis.
- Erro de compilação (Build Error TS6133) causado por imports e estados não utilizados.
- Otimização de concorrência no backend para evitar travamentos durante o processamento de métricas.

## [1.5.3] - 2026-05-12

### Changed
- **Typography Refinement:** Redução da escala tipográfica global do modal de usuários para um visual mais clean e profissional (Títulos 5xl -> 3xl, Métricas 3xl -> xl).
- **Spaciousness:** Ajuste de paddings e margens para harmonizar com as fontes reduzidas, aumentando a densidade de informação sem perder a elegância.

## [1.5.2] - 2026-05-12

## [1.5.1] - 2026-05-12

## [1.5.0] - 2026-05-12

### Added
- **Modal de Gestão de Fiéis:** Migração total para um `Dialog` centralizado, substituindo o painel lateral antigo.
- **Contexto Espiritual IA:** Exibição do resumo pastoral e interesses dos fiéis extraídos do `user_contexts`.
- **Dashboards de Métricas:** Cards de consumo de tokens, créditos, taxa de retorno e engajamento.
- **Sigilo Pontifício:** Implementação de desfoque (blur) no histórico de mensagens para proteção de privacidade.

### Fixed
- **Mapeamento de Dados:** Correção na estrutura de retorno do `AdminService` para tratar objetos de contexto.
- **Estética Visual:** Padronização completa para o tema Light Premium da plataforma.

## [1.4.0] - 2026-05-11

### Added
- **Estabilização de Dados de Santos:** Migração do scraping live para banco de dados Supabase (`saints`).
- **Novo Pipeline de Liturgia:** Geração de conteúdo estruturado via IA para WhatsApp.
- **Alternativa OpenRouter:** Substituição do modelo Gemini Flash por GPT-4o-mini no pipeline de bridge.
