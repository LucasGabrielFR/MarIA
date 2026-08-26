# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/pt-br/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.17.0] - 2026-08-26

### Added

- **Exame de Consciência Guiado & Completo (Evolução do Boa Noite):**
  - **Experiência Espiritual Noturna:** Evolução da saudação noturna para envio interativo do Exame de Consciência com 2 opções (`[✨ Exame Guiado]` e `[📖 Exame Completo]`).
  - **Máquina de Estados de 3 a 4 Passos:**
    - **Passo 1 (Presença de Deus & Gratidão):** Reconhecimento das graças e acertos do dia.
    - **Passo 2 (Exame das Faltas & Desabafo):** Pedido de luz ao Espírito Santo e acolhida sincera das fraquezas do fiel.
    - **Passo 3 (Pastoral, Virtude & Reparação):** IA pastoral com consolo maternal, recomendação de virtude prática antídoto para o dia seguinte e condução da oração de reparação / Ato de Contrição.
    - **Passo 4 (Guia de Confissão & Conclusão):** Lembrete amoroso da Confissão Sacramental para faltas graves com acesso ao Guia de Confissão.
  - **Política de Privacidade e Sigilo de Oração:** Anonimização automática das mensagens de confissão do usuário no banco de dados (`messages`) após o encerramento do exame (`[Exame de consciência realizado em sigilo de oração]`), garantindo total discrição espiritual.
  - **Ferramenta no Painel de Mensagens Agendadas:** Opção configurável no painel administrativo (`scheduled-messages.tsx`) para anexar a ferramenta de Exame de Consciência às campanhas noturnas com disparo automático via `broadcast.service.ts`.
  - **Prompts & Fluxos no Supabase:** Adicionados `generator_guided_exam`, `full_exam_text`, `guide_confession` e o fluxo `conscience_exam_flow` em `automatic_flows`.

## [1.16.7] - 2026-06-10

### Added

- **Suporte Oficial a Docker:** Implementação completa de `Dockerfile` otimizados para os três principais serviços (`backend`, `frontend`, `landing`) utilizando build multi-estágio para redução drástica do tamanho das imagens de produção.
- **Orquestração com Docker Compose:** Criação de `docker-compose.yml` na raiz do projeto para subir todo o ambiente de forma unificada e simples, com mapeamento correto de portas e injeção de variáveis de ambiente.
- **Otimização Next.js para Docker:** Configuração `output: 'standalone'` adicionada em `next.config.ts` na Landing Page para gerar builds otimizados, excluindo dependências não utilizadas.
- **Nginx para o Painel Administrativo:** Configuração dedicada de Nginx (`nginx.conf`) para o frontend, garantindo que as rotas SPA do React funcionem adequadamente no subdiretório `/admin`.

## [1.16.6] - 2026-06-10

### Fixed

- **Condição de Corrida em Mensagens Simultâneas (Crítico):** Implementada fila de processamento por usuário (`enqueueForUser`) no `UazapiController` via encadeamento de Promises. Mensagens do mesmo número enviadas em sequência rápida agora são processadas uma a uma, eliminando respostas duplicadas, estados corrompidos e sobreposição de contexto no banco de dados.

- **Crash em Resposta Inválida do OpenRouter (Crítico):** O método `callOpenRouter` em `ai.service.ts` passou a usar encadeamento opcional (`choices?.[0]?.message?.content`) com verificação explícita de tipo. Respostas da API sem `choices` agora lançam erro descritivo em vez de propagar `undefined` silenciosamente pelo pipeline.

- **Timeout Ausente em Todas as Chamadas Externas (Crítico):** Adicionado `AbortSignal.timeout()` em todos os pontos de saída HTTP da aplicação — `callOpenRouter` (30 s), `magisterium.service.ts` (30 s), `asaas.service.ts` método `request()` (15 s), `liturgy.service.ts` (10 s) e todos os métodos de `uazapi.service.ts` (10 s cada). Elimina travamentos indefinidos que paralisavam workers do NestJS em caso de lentidão ou queda de serviços externos.

- **Falha Silenciosa ao Persistir Mensagem no Banco (Crítico):** O método `saveMessage` em `ai.service.ts` agora captura o objeto `error` do Supabase e lança exceção explícita se o insert falhar ou se o `id` não for retornado, tornando o retorno não-nulo (`string`) e evitando propagação de `undefined` para os estados subsequentes do fluxo.

- **Formato Incorreto de `chatId` no Envio de Código de Verificação:** O método `requestVerificationCode` em `customer-auth.service.ts` agora usa `user.wa_chatid` quando disponível, com fallback para `${user.phone}@s.whatsapp.net`, garantindo compatibilidade com o formato UAZAPI (`número@s.whatsapp.net`) em vez de enviar um número de telefone nu que a API rejeita silenciosamente.

- **Acúmulo de Códigos de Verificação Não Utilizados:** Antes de inserir um novo código na tabela `magic_links`, o sistema deleta todos os registros anteriores não utilizados (`used = false`) do mesmo usuário, prevenindo acúmulo de tokens expirados e possíveis ataques de enumeração.

- **Método HTTP Incorreto em `updateSubscription` (Alto):** Corrigido o uso de `'POST'` para `'PUT'` na chamada à API do Asaas (`/subscriptions/{id}`). O Asaas exige `PUT` para atualização de assinatura existente; `POST` criava recursos novos em vez de atualizar, causando falha silenciosa nas alterações de plano.

- **Ausência de Deduplicação no Webhook do Asaas (Alto):** Adicionada verificação de idempotência em dois pontos do `handleWebhook`: (1) para o fluxo web, consulta se já existe registro em `activation_codes` para o `session_id` antes de inserir novo código; (2) para o fluxo de usuário, verifica se existe registro em `subscriptions` criado nos últimos 5 minutos antes de inserir. Previne cobranças duplicadas e criação múltipla de assinaturas em caso de reenvio de webhook pelo Asaas.

- **Falha em Cascata na Geração de Conteúdo Diário (Alto):** O método `generateAllForDay` em `cron.service.ts` substituiu `Promise.all([...])` por um laço `for...of` com `try/catch` individual por tarefa (liturgia, santo, rosário). Uma falha isolada em um tipo de conteúdo não aborta mais a geração dos demais.

- **`isSubscribeRequest` Interceptando Consultas de Gerenciamento (Alto):** Adicionada verificação `isManagementQuery` em `ai.service.ts` que exclui do gatilho de fluxo de assinatura mensagens contendo termos de gerenciamento ("cancelar", "minha assinatura", "fatura", "vencimento", "portal", etc.). Usuários que perguntavam sobre seu plano ou cancelamento eram incorretamente direcionados ao fluxo de venda.

- **Promoção de Status Antes da Conclusão da IA (Médio):** No estado `triage_presentation_subscription`, o `update({ status: 'active' })` agora ocorre somente após `callOpenRouter` completar com sucesso, em paralelo com `saveMessage`. Anteriormente o status era promovido antes da chamada à IA, deixando o usuário em `active` mesmo em caso de falha do LLM.

- **Ausência de Log para Prompts Ausentes (Médio):** O método `getPrompt` em `prompt.service.ts` emite `Logger.warn` quando a chave solicitada não existe no cache, facilitando a identificação de prompts não carregados do banco em vez de retornar string vazia silenciosamente.

- **URL Dummy Retornada Silenciosamente Sem `ASAAS_API_KEY` (Médio):** Os métodos `createWebCheckoutSession` e `createCheckoutUrl` em `asaas.service.ts` agora lançam `Error` quando `apiKey` não está configurado, em vez de retornar `https://sandbox.asaas.com/checkout/dummy`. Isso expõe imediatamente a má configuração de ambiente em vez de propagar um link inválido para o usuário.

- **Fallback Ausente na Detecção de `fromMe` (Baixo):** A verificação de mensagens enviadas pelo próprio bot em `uazapi.controller.ts` passou a usar `messageData.fromMe ?? messageData.key?.fromMe ?? false`, cobrindo payloads alternativos do UAZAPI que encapsulam o campo dentro de `key`.

- **Geração de Códigos com `Math.random` (Baixo — Segurança):** Substituído `Math.random().toString(36)` por `crypto.randomBytes()` em todos os pontos de `asaas.service.ts`: geração de `sessionId` para checkout web e geração do código de ativação `MARIA-XXXXXX`. `Math.random` não é criptograficamente seguro e pode produzir colisões previsíveis.

### Added

- **Documentação Técnica Completa:** Criado `docs/DOCUMENTATION.md` e `docs/DOCUMENTATION.pdf` com documentação abrangente do sistema incluindo: arquitetura geral, diagramas de fluxo, schema do banco de dados, mapeamento de endpoints REST, webhooks Asaas e UAZAPI, análise de requisitos funcionais e não-funcionais, e matriz de dependências externas.

## [1.16.5] - 2026-05-24

### Changed
- **Instruções no Modal de Checkout:** Adicionada orientação explícita no modal "Aguardando Pagamento" da Landing Page informando que, além da exibição em tempo real na tela, um e-mail contendo os dados de acesso e ativação será disparado automaticamente após a confirmação do pagamento, com um lembrete para verificação da pasta de spam.

## [1.16.4] - 2026-05-24

### Added
- **Política de Privacidade Oficial:** Criação e redação completa do documento de Política de Privacidade da MarIA em Markdown. Detalha de forma transparente e em total conformidade com a LGPD a coleta de dados de identificação e contato (WhatsApp ID, e-mail de faturamento do Asaas), o armazenamento temporário de históricos de mensagens e a geração automática de resumos de contextos devocionais/pastorais. Esclarece a total segurança de dados financeiros processados diretamente pelo gateway Asaas (sem armazenamento local de cartões), políticas restritas de não comercialização de dados com fins publicitários e a segurança via Row Level Security (RLS) no Supabase.
- **Semeador de Configurações de Privacidade:** Implementação e execução do script de semente de dados `seed_privacy_policy.ts` na pasta `backend/scripts`, persistindo com sucesso a Política de Privacidade oficial na tabela `system_settings` sob a chave pública `privacy_policy`.

## [1.16.3] - 2026-05-24

### Added
- **Termos de Uso Oficiais:** Criação e redação completa dos Termos de Uso formais da aplicação MarIA em Markdown (compatíveis com o renderizador da Landing Page). O documento aborda de forma robusta e transparente a natureza devocional da IA (frisando que não substitui sacramentos católicos nem aconselhamento de sacerdotes reais), as diretrizes de uso pessoal (vedação a bots e automações), regras de segurança maternal contra violações e LGPD (incluindo direitos de privacidade, armazenamento para personalização pastoral e canal de suporte oficial `maria@acutistech.com.br`).
- **Semeador de Configurações de Termos:** Implementação e execução do script de semente de dados `seed_terms_of_use.ts` na pasta `backend/scripts`, persistindo com sucesso os Termos de Uso oficiais na tabela `system_settings` sob a chave pública `terms_of_use`.

## [1.16.2] - 2026-05-23

### Added
- **Reset de Mensagens no Upgrade/Downgrade:** Implementada a redefinição automática (zeragem) da contagem de mensagens consumidas do usuário (alterando o status `is_llm` de suas mensagens do mês para `false`) sempre que um upgrade ou downgrade for efetuado, tanto via Self-Service no Portal quanto via webhook do Asaas ou atualização manual do painel administrativo. Isso garante que o usuário inicie o novo ciclo com o limite de mensagens totalmente renovado ao ser cobrado o valor cheio.

### Changed
- **Vigência de Assinatura Cancelada:** Reformulado o fluxo de cancelamento de plano. Ao cancelar, a recorrência futura é desativada no Asaas e o campo `asaas_subscription_id` local é limpo, porém o acesso (plano ativo e expiração `subscription_expires_at`) é mantido integralmente ativo no banco de dados local até a data final do ciclo atual que já foi pago.
- **Interface e Dashboard do Assinante:** Atualizada a Landing Page para exibir um badge elegante de "Cancelada (Válida até DD/MM/AAAA)" e ocultar os botões de controle de faturamento caso o plano tenha sido cancelado, além de preservar e renderizar todo o histórico de faturas do cliente na tabela mesmo após o cancelamento.

## [1.16.1] - 2026-05-23

### Added
- **Expiração de Códigos de Ativação (Segurança):** Implementado tempo de expiração padrão de 1 hora para os códigos de ativação gerados após checkout bem-sucedido no gateway de pagamentos Asaas.
- **Validação Automática de Expiração no WhatsApp:** O webhook do Uazapi agora verifica se o código de ativação recebido do usuário já expirou. Caso tenha expirado, atualiza o status do código para `expired` no banco de dados, bloqueia o resgate e envia uma resposta amigável instruindo o cliente a entrar em contato com o suporte técnico para emissão de um novo token.

## [1.16.0] - 2026-05-23

### Added
- **Fluxo de Autenticação por Código via WhatsApp:** Substituído o fluxo legado de "magic link" por um sistema interativo de envio de código numérico de 6 dígitos via WhatsApp e confirmação direta na Landing Page.
- **Máscara de Entrada de Telefone Inteligente:** Implementada máscara de input em React no formato brasileiro `(xx) xxxxx-xxxx` na tela de login da Landing Page.
- **Painel do Assinante (Dashboard Cliente):** Nova interface premium e moderna com efeito de glassmorphism e micro-animações integrada à Landing Page que permite aos fiéis autenticados visualizarem os dados de seu plano, data de próximo vencimento, e histórico completo de faturas anteriores.
- **Auto-Autenticação e Persistência de Sessão:** Suporte a salvamento seguro do token de sessão no `localStorage` do navegador para manter o cliente conectado automaticamente e realizar revalidação em tempo real a cada carregamento de página.
- **Gestão de Assinaturas Auto-Serviço:** Botões seguros para auto-cancelamento da cobrança recorrente no Asaas (com modal de dupla confirmação) e alteração direta de plano (upgrade de Básico para Premium ou modificação de ciclo Mensal/Anual) diretamente pelo painel do assinante.
- **Endpoints de Portal e Sessão no Backend:** Novos endpoints seguros no controlador NestJS `CustomerAuthController` sob `/api/customer/auth/*` e `/api/customer/subscription/*` para envio de códigos de 6 dígitos, validação, gerenciamento de tokens de sessão hexadecimais de 32 bytes (com expiração de 1 hora) e cancelamento/alteração de planos com o AsaasService.

### Changed
- **Compatibilidade Retroativa de Endpoints:** O prefixo do controlador NestJS foi alterado para `/customer` agrupando as rotas da área do assinante de forma ideal, porém preservando e remapeando os endpoints legados `/customer/auth/magic-link` e `/customer/auth/verify` para não quebrar integrações existentes.
- **Mapeamento de Dependências:** Adicionado o `AsaasModule` nos imports do `CustomerAuthModule` do backend NestJS para permitir o uso seguro do `AsaasService` nas requisições do assinante.

## [1.15.3] - 2026-05-21

### Fixed
- **Inativação de Links de Pagamento Confirmados no Asaas:** Corrigido o erro da API do Asaas (`invalid_action: Não é permitido remover links de pagamento com cobranças geradas.`) ao tentar remover o link de pagamento temporário do faturamento após a confirmação. O método `deletePaymentLink` foi reformulado para utilizar uma requisição `PUT /v3/paymentLinks/{id}` enviando `{ active: false }` ao invés de um método `DELETE`, permitindo que o Asaas inative o link com sucesso e impeça pagamentos adicionais duplicados mesmo contendo cobranças existentes em seu histórico.

## [1.15.2] - 2026-05-21

### Fixed
- **Botão "X" de Fechamento do Modal de Confirmação:** Removido o condicional de ocultação do botão fechar e adicionada a classe `z-50` para garantir que o botão de "X" seja visível, destacado e plenamente funcional em todas as telas do modal de pagamento (incluindo a tela final de "Assinatura Confirmada!"). Isso permite ao usuário fechar a janela em qualquer etapa sem ficar preso na tela de sucesso.

## [1.15.1] - 2026-05-21

### Fixed
- **Bug da Rota de API no Checkout (Erro 404 Not Found):** Corrigido o erro crítico em que a Landing Page retornava status 404 ao tentar assinar um plano. Isso acontecia porque a API Route anterior do Next.js estava localizada em `/api/checkout`, e a configuração de proxy/Nginx em produção intercepta qualquer requisição iniciando com `/api` para o backend NestJS (onde o endpoint não existia).
- **Renomeação da Rota do Next.js:** Movido o endpoint do Next.js de `/api/checkout` para `/checkout-session`, contornando a interceptação do proxy Nginx e permitindo que o Next.js lide com a rota de forma autônoma e faça a requisição server-side para o backend NestJS com sucesso.
- **Chamadas de Status e Verificação Relativas:** Ajustadas as chamadas de polling e autenticação no cliente para utilizarem caminhos relativos com o prefixo `/api` (ex: `/api/payment/asaas/status/...`), as quais agora são interceptadas corretamente e encaminhadas de forma imediata pelo proxy Nginx para o backend NestJS tanto localmente (via regras de `rewrites` no `next.config.ts`) quanto em produção.

## [1.15.0] - 2026-05-21

### Added
- **Novo Fluxo de Faturamento via Landing Page (Web Session + Código de Ativação):** Implementado um fluxo de pagamento seguro de ponta a ponta na Landing Page que elimina a necessidade de digitação prévia de telefone e evita erros de digitação e duplicidade de suporte técnico.
- **Tabela de Códigos de Ativação (`activation_codes`):** Criada a tabela de controle e resgate no banco de dados com suporte a chaves únicas `MARIA-XXXXXX` e controle de segurança Row Level Security (RLS).
- **Serviço de Mail Transacional (`MailService`):** Implementado serviço com `nodemailer` para envio de e-mails em formato HTML elegante com instruções, código destacado e link direto para ativação no WhatsApp.
- **Rastreamento de Origem de Assinatura (`origin`):** Adicionada a coluna `origin` nas tabelas `users` e `subscriptions` com suporte a `'web'` e `'wpp'` para identificar a origem das vendas.
- **Polling de Status em Tempo Real:** Implementado endpoint de polling `/payment/asaas/status/:sessionId` no backend NestJS e integrado na Landing Page (Next.js) com um modal interativo e responsivo.
- **Interceptação e Ativação por Código no WhatsApp Bot:** Ajustado o webhook do Uazapi no `UazapiController` para detectar códigos `/MARIA-[A-Z0-9]{6,10}/` no texto, resgatar o código de forma atômica no banco, cadastrar/atualizar o perfil do fiel vinculando seu `wa_chatid` com `origin = 'web'` e responder com uma saudação festiva premium ou básica.

## [1.14.8] - 2026-05-21

### Added
- **Desativação Automática de Link de Pagamento no Webhook:** Nova funcionalidade de segurança que inativa e desabilita permanentemente o link de pagamento recorrente no Asaas (`deletePaymentLink`) assim que a confirmação de pagamento (`PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`) é processada com sucesso. Isso impede que o cliente ou terceiros efetuem pagamentos duplicados ou adicionais indesejados através do mesmo link.
- **Método de Exclusão de Link de Pagamento:** Implementado o método assíncrono `deletePaymentLink(linkId: string)` em `AsaasService` para disparar de forma isolada e com tratamento robusto de erros a requisição de inativação (`DELETE /v3/paymentLinks/{id}`) na API do Asaas.

## [1.14.7] - 2026-05-21

### Added
- **Etapa de Confirmação de Pagamento no Fluxo Automático:** Adicionado o passo "Confirmação de Pagamento" (Etapa 3) no gerenciador de fluxos automáticos (`/flows`). Agora o administrador pode configurar de forma totalmente visual o conteúdo da mensagem de boas-vindas/sucesso que é enviada no WhatsApp.
- **Suporte a Placeholders em Mensagem de Confirmação:** O novo passo suporta a substituição dinâmica de `{tier_label}` (nome amigável do plano contratado em português) e `{user_name}` (nome do usuário associado) para mensagens personalizadas de alto engajamento.
- **Sincronização de Scripts e Seeds SQL:** Atualizados os scripts de semente e migração de banco de dados (`migration_automatic_flows.sql` e `update_subscription_flow_buttons.sql`) para incluir e carregar por padrão a nova estrutura de 3 etapas com a mensagem de boas-vindas otimizada e quebras de linha nativas pré-configuradas.

### Changed
- **Integração Webhook do Asaas Resiliente a Quebras de Linha:** O manipulador do webhook de pagamentos (`handleWebhook` em `asaas.service.ts`) foi atualizado para consultar a mensagem personalizada diretamente da nova propriedade `steps.payment_confirmed.text` na tabela `automatic_flows`.
- **Tratamento de Quebras de Linha Escapadas:** Implementada conversão robusta de sequências literais `\n` em quebras de linha reais do WhatsApp (`.replace(/\\n/g, '\n')`), corrigindo definitivamente o problema em que o WhatsApp enviava mensagens mal formatadas com a sequência do caractere de escape explícita.
- **Fallbacks de Segurança de Boas-vindas:** Mantido fluxo secundário de verificação que recorre à tabela `ai_prompts` (`welcome_basic` ou `welcome_premium`) e mensagens estáticas padronizadas de segurança se o fluxo não estiver populado no banco de dados.

## [1.14.6] - 2026-05-21

### Added
- **Vinculação Direta por Link de Pagamento (`paymentLink`):** Implementada a correspondência de transações pagas no Asaas diretamente ao usuário da MarIA por meio do ID único do link de pagamento (`paymentLink`). O ID do link gerado no checkout é agora armazenado na coluna `asaas_payment_link_id` do usuário e consultado prioritariamente no webhook de confirmação de pagamento (`PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`).

### Fixed
- **Erros de Compilação do TypeScript no Asaas Service:** Correção de 15 erros de compilação estrita em `asaas.service.ts` relacionados à inferência de tipo `never` na variável `user` e discrepâncias de retorno em chamadas de banco de dados (`maybeSingle()` do Supabase RPC). A variável foi explicitamente tipada como `any` e os retornos do RPC foram convertidos para contornar limitações de tipagem estática.

## [1.14.5] - 2026-05-21

### Added
- **Vinculação Dinâmica via Webhook (External Reference):** O webhook processa o ID do cliente criado de forma orgânica pelo Asaas durante o checkout, cruzando o telefone embutido no `externalReference` (`plan_cycle_phone`) e registrando o `asaas_customer_id` no banco local no exato momento da confirmação de pagamento.

### Changed
- **Geração Otimizada de Link de Pagamento Recorrente Exclusivo:** O método `createCheckoutUrl` foi refatorado para utilizar estritamente a estratégia de links de pagamento recorrentes (`paymentLink` com `chargeType: 'RECURRENT'`) configurados para cartão de crédito (`billingType: 'CREDIT_CARD'`). Isso elimina a criação prévia de clientes rascunho ("Cliente MarIA + Telefone") no painel do Asaas, permitindo que o cliente preencha seus próprios dados cadastrais diretamente na página segura e garantindo restrição exclusiva a pagamentos via cartão de crédito.

## [1.14.4] - 2026-05-21

### Added
- **Prevenção de Duplicação de Clientes Asaas por Telefone:** Implementação da busca ativa do cliente pelo telefone (com e sem o DDI `55`) no Asaas via API `/customers` antes de instanciar um novo perfil (`ensureAsaasCustomer`). Vincula dinamicamente no banco de dados local caso encontre.
- **Sincronização Bidirecional Inteligente (Telefone/Asaas ID):** Ação de sincronização em lote (`syncSubscriptions`) aprimorada para buscar detalhes de clientes não vinculados diretamente no Asaas, pesquisando fiéis locais pelo telefone e salvando automaticamente o `asaas_customer_id` correto no banco local para restaurar a integridade dos dados sem intervenção manual.
- **Validade e Expiração de Checkouts Hospedados:** Configuração do parâmetro `minutesToExpire` em `120` minutos (2 horas) para expiração automática de links de checkout pendentes no Asaas. Os links também passam a expirar imediatamente e de forma definitiva no exato instante em que o primeiro pagamento é concluído com sucesso.

### Changed
- **Priorização de Links de Assinatura Únicos (Anti-Duplicação):** A geração de links em `createCheckoutUrl` foi reestruturada para testar primeiro os fluxos seguros e de fatura única (`subscription` e `checkout` hospedado), deixando `paymentLink` genérico apenas como último recurso. Desta forma, o cliente sempre acessa uma sessão identificada, evitando a digitação manual de dados redundantes e a consequente duplicação no painel do Asaas.

## [1.14.3] - 2026-05-21

### Added
- **Tag do Google Analytics na Landing Page:** Implementação oficial do script de rastreamento do Google Tag Manager (gtag.js) com ID `G-992519QBXX` utilizando o componente `<Script>` do Next.js para otimização de performance, carregamento assíncrono inteligente e eliminação de hydration mismatches.

## [1.14.2] - 2026-05-21
### Fixed
- **Bug Crítico: JSON Parse no Status do Fluxo (`SyntaxError: Expected ':'`):** O método `handleFlowStep` em `ai.service.ts` usava `split(':')` para decodificar o status do usuário no formato `flow:subscription_flow:confirm_plan:{"plan":"1"}`. Como o JSON contém dois-pontos (`:`) em seus valores, o split fragmentava o payload, causando `SyntaxError` ao tentar dar `JSON.parse`. Corrigido usando `indexOf(':')` posicional para extrair com precisão apenas o segmento do JSON sem quebrá-lo.
- **Link do Asaas Incorreto (Link Dummy / URL Inválida):** A integração com o Asaas usava `billingType: 'CREDIT_CARD'`, que **não gera uma URL de checkout pública** para assinaturas. Alterado para `billingType: 'UNDEFINED'`, que permite o cliente escolher o método de pagamento (Pix, Boleto ou Cartão) no checkout do Asaas e retorna corretamente um `invoiceUrl` público na primeira cobrança pendente. Adicionado retry com 3 tentativas (intervalo de 1s) para aguardar a propagação da cobrança na API do Asaas antes de falhar.
- **Botões Nativos WhatsApp Não Sendo Enviados:** O `sendInteractiveMessage` em `uazapi.service.ts` agora tenta **primeiro** os botões nativos do WhatsApp quando há 3 ou menos opções configuradas, e só realiza o fallback para texto se o envio nativo falhar (erro HTTP) ou lançar exceção. Quando há mais de 3 botões, bypassa a tentativa nativa e envia direto o texto (que já contém a lista numerada 1️⃣, 2️⃣... proveniente do banco de dados).

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
