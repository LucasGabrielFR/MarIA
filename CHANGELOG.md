# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/pt-br/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.14.1] - 2026-05-21
### Added
- **Editor Dinâmico de Botões no Fluxo de Assinatura:** O editor de flows automáticos (`/flows`) foi completamente refatorado com gerenciamento dinâmico de botões, permitindo adicionar, remover e editar IDs e textos de cada opção sem limitação estática.
- **Preset "Preços Híbridos Otimizados":** Botão de atalho no editor de `Etapa 1: Escolha do Plano` que carrega automaticamente os 4 planos com preços compactados (ex: `Básico R$14,99/mês`, `Bás. Anual R$12,90`) otimizados para o limite de 20 caracteres do WhatsApp.
- **Indicador de Modo de Envio (Nativo vs Híbrido):** Badge visual dinâmico que exibe `✅ Modo Botões Nativo` quando há ≤3 opções configuradas, ou `⚠️ Modo Híbrido (Texto)` quando o fluxo excede 3 botões — comunicando ao administrador que o sistema enviará automaticamente como lista numerada em texto.
- **Validação Visual de Limite de Caracteres:** Cada campo de texto de botão exibe contador de caracteres em tempo real com alerta visual âmbar quando excede os 20 caracteres recomendados pelo WhatsApp.
- **Script SQL de Atualização:** Novo script `update_subscription_flow_buttons.sql` para atualizar o banco de dados com os 4 botões de planos com preços incluídos via `jsonb_set`.

### Changed
- **Configuração Padrão dos Botões do Fluxo:** A configuração inicial do `subscription_flow` foi atualizada para incluir os 4 botões de plano com preços visíveis (`Básico R$14,99/mês`, `Bás. Anual R$12,90`, `Premium R$29,90/mês`, `Prem. Anual R$26,90`) + opção `Cancelar`. Como há 5 opções (excedendo o limite de 3 do WhatsApp nativo), o Uazapi Híbrido enviará automaticamente como lista numerada em texto.
- **Correspondência de Botões no Backend:** O motor de fluxo (`handleFlowStep` em `ai.service.ts`) agora realiza correspondência dinâmica de respostas de usuário com os textos dos botões configurados no banco de dados, em vez de usar strings hardcoded. Isso garante que renomear botões no painel admin seja imediatamente refletido na lógica de processamento do bot.
- **Seed SQL do `automatic_flows`:** Alterado `ON CONFLICT DO NOTHING` para `ON CONFLICT DO UPDATE` para garantir que re-execuções do script de migração atualizem o conteúdo ao invés de ignorar silenciosamente.

## [1.14.0] - 2026-05-20
### Added
- **Fluxos Automáticos de Vendas (WhatsApp Híbrido):** Nova seção e página administrativa dedicada (`/flows` - `flows.tsx`) para controle, edição e parametrização dos textos de opções e botões de conversas estruturadas de vendas no bot WhatsApp.
- **Tabela de Controle Dedicada (`automatic_flows`):** Nova estrutura relacional no banco de dados para isolar a configuração de fluxos automatizados da tabela de prompts genéricos. Equipado com Row Level Security (RLS) e políticas específicas que limitam alterações a superadmins autenticados.
- **Sincronização em Lote com o ASAAS:** Novo botão "Sincronizar com o ASAAS" na aba financeira que dispara chamadas assíncronas para puxar todas as assinaturas ativas na API Asaas e mantê-las em conformidade exata no banco de dados local.
- **Ações de Alteração de Plano/Ciclo:** Botão visual inline ("Alterar Plano/Ciclo") na tabela de assinaturas financeiras que abre modal interativo para superadmins atualizarem o tier (Básico / Premium) ou ciclo (Mensal / Anual) do fiel diretamente nos servidores do Asaas e no banco local.
- **Fallback Híbrido Uazapi:** Implementada conversão inteligente e fallback automático em `uazapi.service.ts` para anexar opções numeradas em formato texto caso o dispositivo/cliente do fiel não tenha suporte para botões interativos WhatsApp.

### Changed
- **Upgrade de Assinatura & Proteção Contra Duplicidade (Anti-Double Charge):** O bot intercepta intenções de assinatura (`SUBSCRIBE`). Caso o usuário já possua o Plano Básico ativo e selecione o Premium, o fluxo alerta sobre o upgrade de plano. Ao receber a confirmação de pagamento do novo plano no webhook do Asaas, o sistema de forma atômica cancela a assinatura antiga e concede acesso ao novo plano, evitando cobranças duplicadas indevidas.

### Fixed
- **Compilação do TypeScript no Backend:** Resolvido o erro em `ai.service.ts` onde as queries no Postgrest Supabase referentes à tabela `automatic_flows` não possuíam o operador `.select('*')` explícito.
- **Assinatura do Método processMessage:** Corrigido o tipo de retorno do método `processMessage` de `Promise<string | string[] | null>` para `Promise<any>`, permitindo o retorno de estruturas complexas para mensagens interativas com botões.
- **Erro de Build no Frontend:** Corrigida a falha de compilação de produção (`tsc -b && vite build`) no frontend ao remover importações não utilizadas de ícones da biblioteca `lucide-react` na página `flows.tsx`, resolvendo a restrição estrita de `"noUnusedLocals"`.

## [1.13.1] - 2026-05-19
### Fixed
- **Autenticação em Gestão de Fiéis (x-admin-id):** Corrigido o envio do cabeçalho `'x-admin-id'` nas ações de exclusão de dados pessoais (`handleClearData`), atualização de assinaturas (`handleUpdateSubscription`) e salvamento de configurações operacionais (`handleSaveSettings`) na página `wa-users.tsx`, eliminando falhas de permissão ao executar essas tarefas como administrador ou superadmin.
- **Formatação de Data e Remoção de Cabeçalhos Duplicados em Cache:** Padronizada a exibição da data nas mensagens de cache diário direto no formato brasileiro (`dd/mm/yyyy`). Além disso, foi implementada uma verificação inteligente no backend (`ai.service.ts`) para evitar a duplicação de cabeçalhos quando o conteúdo salvo no banco de dados já possui um título próprio com a data, garantindo mensagens perfeitamente limpas e sem redundâncias.

## [1.13.0] - 2026-05-19
### Added
- **Gestão de Páginas Legais:** Nova seção "Páginas Legais" integrada no Painel de Configurações (`settings.tsx`) que possibilita a visualização e edição dinâmica em Markdown dos Termos de Uso (`terms_of_use`) e da Política de Privacidade (`privacy_policy`).
- **Visualização em Tempo Real (Live Preview):** Interface de visualização em tempo real incorporada ao editor, simulando de forma fiel e com estética premium (tema escuro com detalhes dourados e glassmorphism) o layout exato de como as páginas legais são exibidas na Landing Page.

### Changed
- **Redesign Premium do Botão do WhatsApp:** O botão flutuante foi reestilizado para se adequar exatamente ao design minimalista do WhatsApp (utilizando cor verde sólida vibrante `#22C55E`, sombra verde suave e o ícone clássico do monofone de telefone em outline minimalista branco), proporcionando uma identificação visual perfeita e harmônica.
- **Tema Claro para Páginas Legais:** As páginas de Termos de Uso (`/termos`) e Política de Privacidade (`/privacidade`) da Landing Page foram reestilizadas para um tema claro (Light Theme) altamente elegante e legível, com fundo claro de tom alabastro (`#FAF9F6`), contêineres em branco com glassmorphism suave e tipografia refinada em azul escuro e cinzas.
- **Refinamento e Recorte Físico das Imagens de Chat:** As 4 imagens de conversação real com o WhatsApp (`chat-1.jpeg` a `chat-4.jpeg`) foram fisicamente editadas e recortadas em sua porção superior (excluindo os primeiros 160 pixels que continham a barra de status com horário, bateria e operadora). A Landing Page foi otimizada para aplicar `inset-0` au invés de deslocamentos negativos de porcentagem, exibindo perfeitamente o cabeçalho oficial de contato da MarIA sem qualquer corte sob o notch físico do iPhone.

### Fixed
- **Posicionamento e Clique nas Páginas Legais (Footer):** Ajustado o contêiner do botão flutuante de WhatsApp. Ao aplicar `absolute` ao tooltip e limitar a largura do link apenas ao diâmetro do botão (`w-14 h-14`), eliminamos o comportamento de bloco horizontal invisível que se estendia para a esquerda, resolvendo o problema que bloqueava os cliques nos links de "Termos" e "Privacidade" localizados no rodapé.
- **Autenticação em Requisições Administrativas (x-admin-id):** Corrigidas as chamadas de API no painel de configurações para enviar o cabeçalho `'x-admin-id'` contendo o ID do administrador logado obtido do `localStorage`. Isso soluciona o erro de permissão que impedia a atualização das configurações gerais do sistema, limpeza de cache, sincronização de câmbio e chaveamento do modo de manutenção.
- **Favicon da Landing Page:** Substituição do favicon padrão do Next.js pelo logo premium do projeto (`maria_logo_premium.png`) na raiz do aplicativo de landing, garantindo consistência visual de marca.

### Removed
- **Limpeza de Arquivos Redundantes (Housekeeping):** Remoção física de arquivos temporários e de rascunhos que acumulavam lixo técnico no workspace, como o script isolado `backend/test.js` e a pasta temporária de backup das imagens `landing/public/backups/`, deixando o repositório 100% limpo e otimizado.

## [1.12.0] - 2026-05-19
### Added
- **Seção de Perguntas Frequentes (FAQ):** Nova seção interativa na Landing Page respondendo a dúvidas teológicas, devocionais e de privacidade (A MarIA substitui a confissão?, privacidade, base teológica baseada no Magistério).
- **Canal de Suporte por E-mail:** Inclusão oficial do e-mail de contato e suporte `maria@acutistech.com.br` na Landing Page e no rodapé institucional.

### Changed
- **Redesign e Alinhamento do Mockup do Celular:** O mockup do celular (iPhone) no Hero Section agora fica perfeitamente alinhado verticalmente de forma padrão, mantendo-se elegante e profissional, e apenas interagindo suavemente no hover.
- **Remoção de Elementos de Status das Telas de Conversa:** O carrossel de capturas de conversas reais agora oculta a parte superior (status bar com horário, bateria e redes), elevando o nível de profissionalismo e credibilidade da interface.
- **Foco Teológico e Doutrinário da Persona:** Copywriting da Landing Page ajustado para ressaltar o posicionamento de Inteligência Artificial Católica Fiel ao Magistério e Catecismo, operando com a doçura e acolhimento de Nossa Senhora em diversos perfis de fiéis (espiritual, teológico e emocional).
- **Remoção de Card de Guru Místico:** Removido o card flutuante "Paz Interior" para consolidar o posicionamento oficial da MarIA como IA Católica e não como um guru genérico, substituindo-o pelo indicador "Fiel à Doutrina (Catecismo da Igreja)".

## [1.11.0] - 2026-05-18
### Added
- **Correção nos Custos de IA & Tabela de Logs de Uso:** Solucionada a falha na agregação de custos de IA e logs de uso que vinham zerados. Agora a contagem de tokens de prompt/completion é calculada e convertida em reais em tempo real, populando corretamente os gráficos e tabelas da tela de Dados e Logs.
- **Filtro de Período Dinâmico em Dados e Logs:** Implementação do Popover de período com presets avançados (ex: Mês Atual, Última Semana, Último Ano) e seletores de data personalizados no cabeçalho das tabelas e estatísticas de uso.
- **Visualizador de JSON para Webhooks:** Nova ação funcional de "Ver JSON" em diálogo estilizado, que exibe de maneira interativa e com realce visual os payloads de envio e retorno das integrações de webhooks.
- **Auditoria Geral de Administradores:** Implementação de logs automáticos e rastreáveis na tabela `audit_logs` registrando detalhadamente as atividades executadas por cada administrador no painel da plataforma.

### Removed
- **Botão de Exportação CSV:** Removido o botão de exportar arquivos em formato CSV das abas de logs e webhooks conforme orientações do usuário.

### Fixed
- **Visualização de Administradores para o Superadmin:** Corrigida a validação do privilégio de superadmin no frontend (`sidebar.tsx` e `users.tsx`) para incluir um fallback automático ao e-mail principal `lucasgabriel@acutistech.com.br`, resolvendo o problema onde sessões antigas ou desatualizadas no `localStorage` ocultavam incorretamente o menu e bloqueavam a visualização da tela de Administradores.

## [1.10.0] - 2026-05-18
### Added
- **Gestão de Administradores no Frontend:** Desenvolvimento da tela de gestão (`users.tsx`) com interface rica, permitindo que superadministradores convidem novos admins, editem dados cadastrais (nome, cargo) e forcem a alteração de senhas.
- **Redefinição de Senha Obrigatória no Primeiro Login:** Integração do fluxo de primeiro acesso na tela de login (`login.tsx`). Caso a flag `requires_password_change` esteja ativada, a interface bloqueia a navegação e exige que o administrador defina uma nova senha forte, salvando-a de forma criptografada no Supabase.
- **Timeline de Auditoria Interativo (Drawer):** Criação de um painel lateral deslizante premium (drawer) para visualização das atividades individuais de auditoria de cada administrador, exibindo logs estruturados (ações como logins, cadastros, alterações de planos/configurações, limpezas de cache) com formatação de data/hora e visualizador de detalhes (JSON).
- **Controle de Acesso por Cargo (Role-based Authorization):** Bloqueio estrito no frontend contra acessos indevidos à rota `/users` por administradores não autorizados, redirecionando-os de volta ao dashboard. Exibição condicional da aba no menu lateral (`sidebar.tsx`) somente para a role `superadmin`.

## [1.9.13] - 2026-05-18
### Changed
- **Nomenclatura do Limite de Bônus (R$):** Refatoração visual na tela de Gestão de Fiéis (`wa-users.tsx`) alterando o rótulo de `"Limite Mensal de Consumo (R$)"` para `"Limite de Bônus (R$)"`. A descrição explicativa foi reescrita para deixar claro que se trata de uma franquia extra de tokens gerativos em reais (R$) para uso fora da franquia padrão de mensagens do plano do fiel.
- **Mensagem Educada no Backend:** Ajustada a string de feedback do motor cognitivo no `ai.service.ts` do NestJS quando o limite em BRL é atingido, substituindo o termo de "consumo mensal" por "limite de bônus", mantendo a comunicação perfeitamente consistente com a área administrativa.

## [1.9.12] - 2026-05-18
### Added
- **Filtro de Período Dinâmico no Financeiro:** Implementação do filtro de data dinâmico e interativo no painel do Financeiro. Agora o botão "Filtrar Período" abre um Popover premium que permite selecionar presets rápidos ("Mês Atual", "Última Semana", "Últimos 15 Dias", "Últimos 30 Dias", "Últimos 3 Meses", "Últimos 6 Meses", "Último Ano", "Todo o Período") ou especificar um intervalo de datas personalizado por meio de seletores de calendário.
- **Consultas Agregadas e Parâmetros de Data no Backend:** Ajuste no `FinanceService` e `FinanceController` do NestJS para aceitar query parameters de `startDate` e `endDate`. Caso datas sejam informadas, o sistema realiza agregações e filtros em tempo real nas tabelas `subscriptions` e `usage_logs` em vez de carregar a view estática de resumo global `finance_summary`.
- **Indicador Visual Ativo:** Exibição clara e elegante na barra superior de cabeçalho da tabela contendo a identificação do período e preset atualmente ativos (ex: "Mês Atual" ou intervalo personalizado).

### Changed
- **Sincronização de Recarga Pós-Ação:** Ajuste no fluxo de cancelamento e exclusão de assinaturas no frontend para invocar a função `fetchFinanceData` preservando de forma contínua o filtro de datas configurado no momento da ação.

## [1.9.11] - 2026-05-18
### Added
- **Pausa Pastoral (Silenciamento do Bot):** Implementação da funcionalidade que silencia as respostas automáticas da IA para um fiel específico quando ativada pelo painel administrativo, mantendo o recebimento e armazenamento histórico de mensagens intacto.
- **Limite Mensal de Consumo Personalizado (BRL):** Introdução de um limitador individual de consumo em reais para cada fiel. A IA calcula dinamicamente o custo acumulado no mês atual baseado no consumo de tokens de cada modelo de IA utilizado (USD) e a taxa de câmbio atual (BRL), bloqueando novos envios e exibindo um aviso educado ao atingir o limite configurado.
- **Painel Expansível de Configurações:** Novo collapsible ("Configurações Operacionais") no drawer de detalhes de fiéis na tela de Gestão de Fiéis (`wa-users.tsx`), permitindo ativar/desativar a Pausa Pastoral e ajustar/limpar o limite financeiro com botões de atalho rápido e input numérico estilizado.

### Changed
- **Lógica e Fluxo de Entrada no Backend:** Ajuste na tipagem do método `processMessage` no `AiService` do NestJS para permitir o retorno de `null` de forma segura e elegante quando a Pausa Pastoral do usuário estiver ativa, em total sintonia com o controller de webhook.

## [1.9.10] - 2026-05-17
### Added
- **Navegação Integrada do Dashboard:** Vínculo funcional do botão "Ver todas" e clique nas linhas de conversa recente do Dashboard para redirecionar para a tela de Gestão de Fiéis (`/wa-users`).
- **Navegação de Configurações:** Vínculo funcional do botão "Ir para Configurações" no card de Saúde do Sistema para redirecionar para a tela de Configurações (`/settings`).
- **Auto-Seleção de Fiéis em Transição:** Rastreamento inteligente de `userId` passado via estado da rota no redirecionamento das conversas recentes, permitindo que a tela de Gestão de Fiéis carregue e abra o modal de conversa correspondente de forma totalmente automatizada.
- **Relação de ID de Usuário no Backend:** Inclusão do campo `userId` no retorno da listagem de conversas recentes da rota `/admin/stats` no backend.

## [1.9.9] - 2026-05-17
### Added
- **UI de Assinatura Premium:** Redesenho completo do painel de "Gestão de Assinatura" com um grid de cards totalmente interativos para cada nível de plano (Gratuito, Básico, Premium, Ilimitado), contendo ícones exclusivos, design de bordas vibrantes com active state, e glows de fundo sutis.
- **Shortcuts de Expiração:** Introdução de botões de atalho rápido (+30 dias, +90 dias, Limpar) para o controle da data de expiração da assinatura, otimizando o fluxo de trabalho do administrador.
- **Módulo de Comprovação de Pagamento:** Nova seção dedicada e isolada com fundo em degradê verde (Emerald theme), ícone animado e seletor segmentado de planos pagos para registrar com facilidade e segurança os recebimentos manuais (Pix/Dinheiro).

### Changed
- **Renomeação Estrutural de IDs de Planos:** Refatoração de todos os identificadores de planos (IDs do banco de dados e tipos do frontend/backend) para que coincidam exatamente com a nomenclatura dos novos planos (`free`, `basic`, `premium`, `unlimited`), eliminando qualquer discrepância entre IDs internos e rótulos exibidos.
- **Migração do Banco de Dados:** Execução de migração direta no Supabase para atualizar a coluna `subscription_tier` na tabela `users` e `tier` na tabela `subscriptions` de `premium` para `basic` e de `patron` para `premium`.

## [1.9.8] - 2026-05-17
### Added
- **Cancelamento de Pagamento:** Possibilidade de superadministradores cancelarem assinaturas diretamente pelo painel financeiro, alterando o status para `canceled` no banco e revogando imediatamente as permissões premium do fiel (tier volta para `free` e expiração limpa).
- **Exclusão de Pagamento:** Possibilidade de superadministradores excluírem permanentemente registros de pagamento na tabela `subscriptions` com revogação imediata dos benefícios premium correspondentes.
- **Segurança de Acesso Estrita:** Validação de papéis no backend contra a tabela `admins` (ou e-mail principal) exigindo a role `superadmin` para execução de operações financeiras destrutivas/administrativas.
- **Modais de Confirmação Premium:** Diálogos dinâmicos e elegantes de confirmação no painel financeiro com micro-animações, estados de carregamento (loading spinner) e alertas visuais adequados.

### Changed
- **Badges Financeiras:** Adaptação da badge de status da assinatura para diferenciar visualmente `canceled` (tom de âmbar/laranja) e `paid` (tom de verde) no painel financeiro.
- **Ações Restritas a Superadmin:** Exibição condicional da coluna de ações e dos botões de gerência na tabela financeira, restrita estritamente a contas autenticadas como Superadministrador.

## [1.9.7] - 2026-05-16
### Added
- **Controle de Uso e Quotas:** Implementada lógica rigorosa de rastreio de uso de LLM via flag `is_llm`.
- **Isenção de Cache:** Consultas a conteúdos utilitários (Liturgia, Santo do Dia) servidas via cache não contabilizam mais para a cota de mensagens dos planos Premium e Patrono.
- **Roteamento de Intenção Rígido:** Refinado o `intent_router` para exigir pedidos explícitos de conteúdos utilitários, evitando que perguntas genéricas acionem o cache do Santo do Dia indevidamente.
- **Guia do Terço Gratuito:** Corrigido o mapeamento da intenção `ROSARY_GUIDE` para servir o conteúdo do cache, permitindo que usuários do plano gratuito acessem o roteiro do terço sem bloqueios.
- **Redesign da Parametrização:** Interface de prompts totalmente reformulada com sidebar vertical, glassmorphism e busca global.
- **Documentação Contextual:** Adicionadas labels "Onde funciona" e "Impacto no Comportamento" para cada prompt administrativo, facilitando o ajuste fino da IA.
- **Métricas de Exclusão:** Usuários que solicitam exclusão de dados agora são marcados como `disabled`, permitindo melhor rastreio administrativo. Ao retornarem, o sistema reinicia a triagem automaticamente.

### Changed
- **Arquitetura de Quotas:** O `AiService` agora centraliza a contagem de mensagens, garantindo justiça no consumo conforme o tier do fiel.
- **UX Administrativa:** Transição de abas horizontais para navegação lateral persistente na tela de IA.

## [1.9.6] - 2026-05-16
### Changed
- **Refinamento de Triagem (Fase 3):** 
  - O onboarding agora foca estritamente no nome na primeira interação, adiando a captação de intenções.
  - **Identidade Protegida:** Esclarecimento obrigatório de que a MarIA é uma IA *inspirada* em Nossa Senhora, mas não é ela, e que não substitui um sacerdote católico.
  - **Transparência de Planos:** Inclusão do Plano Gratuito na apresentação inicial, detalhando o limite de 5 mensagens/dia e acesso a conteúdos de cache.
  - **Direito ao Esquecimento:** Adicionadas regras de uso de dados e instruções claras sobre como solicitar a exclusão total das informações (via email maria@acutistech.com.br).
  - **Políticas de Privacidade:** Inclusão de links para Termos de Uso e Políticas de Privacidade durante a apresentação.

## [1.9.5] - 2026-05-16

## [1.9.4] - 2026-05-16
### Added
- **Gestão Dinâmica de Prompts:** Migração de 100% das mensagens do sistema para a tabela `ai_prompts`, permitindo edição via dashboard com labels explicativas de impacto.
- **Fluxo de Triagem Inteligente:** Implementada transição automática entre `triage_intro` e `triage_name` e seleção dinâmica de prompts baseada no estado da conversa.

### Fixed
- **Reset de Triagem (Returning Users):** Corrigida falha onde a IA pulava a introdução para usuários retornantes. Agora o sistema ignora o nome do banco durante a triagem para garantir uma experiência de primeiro contato completa.
- **Preservação de Nome:** Ajustada a exclusão de dados (`clearUserData`) para manter o nome do fiel no banco de dados, atendendo à necessidade de registro de identidade enquanto se limpa o histórico espiritual.
- **Injeção de Dependência:** Corrigida falta do `PromptService` no `UazapiController` para suportar recusa dinâmica de áudio.

## [1.9.3] - 2026-05-16
### Added
- **Módulo Financeiro:** Nova página de dashboard para acompanhamento de Receita Bruta, Custos de IA (Tokens) e Lucro Líquido.
- **Gestão de Assinaturas & Checkout:** Sistema para registro manual de pagamentos (R$ 14,90 e R$ 29,90) diretamente no perfil do fiel.
- **Alertas de Vencimento:** A MarIA agora notifica o fiel nos últimos 3 dias de sua assinatura de forma sutil durante a conversa.
- **Suporte a Áudio (Aviso):** Implementada detecção de mensagens de voz com resposta automática educativa explicando a limitação atual.
- **Correção na Exclusão de Dados:** Ao apagar os dados de um fiel, agora o nome e as expectativas também são limpos, garantindo que o retorno do usuário inicie uma triagem completa do zero.
- **Arquitetura Plugável:** Implementação de `FinanceService` preparada para futuras integrações com gateways de pagamento.

## [1.9.2] - 2026-05-16
### Fixed
- **Compilação Frontend:** Adicionado import faltante do componente `Label` na página de Gestão de Fiéis (`wa-users.tsx`).

## [1.9.1] - 2026-05-16
### Added
- **Limites de Mensagens por Tier:** Implementação de quotas mensais rigorosas para os planos (300 msgs para Premium, 600 msgs para Patrono).
- **Processamento Zero-Cost para Plano Free:** Usuários gratuitos agora recebem apenas conteúdos brutos do cache (Liturgia, Santos, Terço), economizando 100% de custos de LLM em interações básicas.
- **Controle de Expiração e Ilimitado:** Administradores agora podem definir datas de expiração precisas e conceder acesso 'Ilimitado' manualmente.
- **Reflexões Premium:** Assinantes agora recebem formatação materna e reflexões profundas geradas por IA, mesmo para conteúdos de cache.

### Fixed
- **Estabilidade de Build e Lógica:** Corrigidos erros de sintaxe e posicionamento de validações de assinatura no `AiService`.
- **Persistência de Dados:** Garantida a atualização do campo `updated_at` na gestão de fiéis.

## [1.9.0] - 2026-05-16
### Added
- **Triagem em Duas Etapas:** Implementação de um fluxo de onboarding mais sofisticado. A MarIA agora se apresenta de forma sutil e acolhedora (`triage_intro`) antes de realizar uma apresentação detalhada das ferramentas e funcionalidades (`triage_presentation_subscription`).
- **Sistema de Assinaturas (MVP):** Introdução de níveis de assinatura (`free`, `premium`, `patron`) no banco de dados.
- **Gestão Manual de Assinaturas:** Novo módulo no Dashboard Admin que permite aos administradores conceder ou alterar níveis de assinatura para qualquer fiel manualmente.
- **Oferta Contextual de Planos:** A IA agora verifica o status de assinatura do fiel ao final da triagem e oferece os planos premium apenas para usuários não-assinantes, reforçando o papel de auxílio materno.

### Fixed
- **Erro de Build (TS6133):** Removidos imports não utilizados (`User`, `Bot`) na página `wa-users.tsx` após refatoração das métricas.

## [1.8.5] - 2026-05-15
### Changed
- **Preservação de Métricas:** Ao excluir os dados, as métricas de consumo de tokens e custos agora são PRESERVADAS para fins de auditoria e controle administrativo.
- **Status 'Desativado':** O usuário agora recebe o status `disabled` após a limpeza de dados, aparecendo de forma distinta no painel administrativo.
- **Recuperação Automática:** Se um usuário desativado enviar uma nova mensagem, ele é automaticamente reativado e encaminhado para a triagem inicial.

## [1.8.4] - 2026-05-15
### Changed
- **Reinício de Triagem:** Ao excluir os dados de um fiel, o status do usuário agora é resetado automaticamente para `triage`. Isso garante que, em um novo contato, o usuário passe novamente por todo o processo de onboarding e acolhimento inicial.

## [1.8.3] - 2026-05-15
### Added
- **Exclusão de Dados do Fiel:** Adicionado botão "Excluir dados" no card de detalhes do usuário. Permite apagar permanentemente o histórico de mensagens, contextos e métricas de consumo, preservando apenas nome e telefone por solicitação de privacidade.

## [1.8.2] - 2026-05-15
### Changed
- **Prioridade Sacerdotal Absoluta:** Ajustados os prompts `core_persona`, `intent_advice` e `rule_crisis` para garantir que a indicação de um sacerdote seja a PRIMEIRA e mais importante recomendação em casos de dor, solidão ou crise espiritual. O apoio de saúde mental (CVV/médicos) agora é tratado como complementar ao auxílio espiritual superior oferecido pela Igreja.

## [1.8.1] - 2026-05-15
### Changed
- **Orientação Pastoral:** Atualizados os prompts de Persona Core, Conselhos, Teologia e Esclarecimento Humano para enfatizar a importância de buscar um sacerdote (padre). A MarIA agora reforça que o auxílio pastoral real e os sacramentos são insubstituíveis e superiores para o apoio emocional e espiritual profundo.

## [1.8.0] - 2026-05-15
### Added
- **Intenção de Esclarecimento Humano:** Nova intent `HUMAN_CLARIFICATION` para lidar com situações onde o fiel confunde a IA com uma pessoa real ou divindade. A MarIA agora esclarece sua natureza tecnológica com humildade e doçura.
- **Diretriz de Emojis:** Atualizada a persona core para utilizar emojis de forma estratégica, tornando a conversa mais acolhedora e casual no WhatsApp.

## [1.7.6] - 2026-05-15
### Added
- **Configuração de Segurança no Admin:** Adicionados os campos de parametrização para `SENSITIVE_DATA` e `rule_data_security` no dashboard administrativo, permitindo edição direta do tom maternal de correção.

## [1.7.5] - 2026-05-15
### Added
- **Simulação de Digitação Humana:** Implementado atraso randômico inteligente (2-10s) proporcional ao tamanho da mensagem para evitar detecção por algoritmos da Meta.

## [1.7.4] - 2026-05-15
### Added
- **Segurança Maternal:** Implementação do Intent `SENSITIVE_DATA` e da regra `rule_data_security` para detecção de solicitações de dados sensíveis e tokens. A MarIA agora responde com um "puxão de orelha" maternal e firmeza espiritual ao negar acesso a informações técnicas.

## [1.7.3] - 2026-05-15
### Fixed
- **Limpeza de Instruções nos Guias:** Removida a exibição de instruções internas da IA ("OBRIGATÓRIO...") ao final dos roteiros de oração (Terço e Rosário).
- **Métricas Detalhadas:** O painel de Gestão de Fiéis agora exibe a divisão detalhada de mensagens: Usuário (Fiel), Bot (MarIA) e Total de Interações.

## [1.7.2] - 2026-05-15
### Fixed
- **Métricas do Dashboard:** Correção na contagem de mensagens no painel de Gestão de Fiéis. Agora contabiliza tanto mensagens do usuário quanto respostas da assistente para refletir o volume total de interação e evitar defasagem.

## [1.7.1] - 2026-05-15
### Changed
- **Mensagem Única e Direta:** Refatoração do `AiService` para enviar Terço, Rosário, Liturgia e Santo do Dia de forma direta. Removemos a geração dinâmica de acolhimento por IA para esses itens, evitando redundâncias e garantindo que o conteúdo chegue "direto ao ponto" conforme solicitado.

## [1.7.0] - 2026-05-15
### Changed
- **Versão Dinâmica no Frontend:** O rodapé da aplicação agora consome a versão diretamente do `package.json` raiz do projeto via Vite `define`.

## [1.6.9] - 2026-05-15

## [1.6.8] - 2026-05-15
### Added
- **Oração do Terço/Rosário Semanal:** Novo fluxo no `CronService` que gera semanalmente os 4 mistérios do Santo Terço (Gozosos, Dolorosos, Gloriosos, Luminosos) personalizados e atrelados à Liturgia de cada dia correspondente.
- **Integração Terço/Rosário no Chat:** O `AiService` agora distingue entre "rezar o terço" (envia os mistérios do dia) e "rezar o rosário" (compila e envia todos os 4 conjuntos de mistérios gerados na semana), enriquecendo o contexto com a liturgia correspondente.

### Changed
- **Melhoria no Magisterium AI:** Reforço crítico nos prompts teológicos (`prompt.service.ts`) forçando a citação detalhada das fontes (Referências) e exigindo a tradução obrigatória para o português de nomes de documentos e citações (exceto latim), melhorando a acessibilidade e confiabilidade.

## [1.6.7] - 2026-05-13
### Fixed
- **Hotfix OpenRouter:** Corrigida falha crítica no `AiService` onde modelos não eram inicializados, resultando em erro 400 ("No models provided").
- **Resiliência de IA:** Implementada inicialização robusta de modelos via `OnModuleInit` e fallbacks permanentes para garantir operação mesmo com falhas de banco de dados.
- **Robustez de Câmbio:** Melhorado o tratamento de erro na sincronização de taxas (AwesomeAPI), adicionando detecção de estouro de cota e prevenindo falhas silenciosas ou logs excessivos.
- **Estabilidade do Backend:** Adicionados mecanismos de fail-safe nas chamadas da API do OpenRouter para evitar interrupções no atendimento aos fiéis.
- **Otimização de Contexto:** Refatorada a lógica de condensação de perfil do usuário para ocorrer estritamente a cada 10 mensagens, utilizando o histórico anterior e as 10 últimas interações como base para um resumo mais preciso e incremental.
- **Autenticação AwesomeAPI:** Integrado suporte a token de API para sincronização de câmbio, garantindo limites de cota ampliados e maior estabilidade nos cálculos financeiros do dashboard.
- **Melhoria de Layout Admin:** Sidebar agora utiliza posicionamento `sticky` e `100vh` para acompanhar o scroll do usuário e preencher toda a altura da tela sem espaços vazios.
- **Footer Institucional:** Adicionado rodapé ao dashboard com copyright AcutisTech/MarIA e exibição dinâmica da versão do sistema.

## [1.6.6] - 2026-05-13
### Added
- Reconstrução total do componente `ModelSelect` do zero para máxima estabilidade e controle de foco.
- Seletor de modelos customizado com busca em tempo real, glassmorphism e ordenação alfabética.
- Otimização de layout nos cards do admin (remoção de overflow-hidden) para evitar corte dos menus suspensos.
- Melhoria na gestão de eventos (stopPropagation e clickOutside) para garantir uma experiência de busca fluida e sem interrupções.

### Fixed
- Removido import não utilizado do `Base UI Select` que causava erro de build (TS6133).
- **Limpeza Profunda:** Removido boilerplate não utilizado do backend (`AppController`, `AppService`).
- **Otimização de Assets:** Exclusão de arquivos de assets e estilos legados do frontend (`App.css`, `react.svg`, `vite.svg`).
- **Redução de Dívida Técnica:** Removidos componentes de UI não utilizados (`Sheet`) e auditoria de dependências para um projeto mais enxuto.

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
