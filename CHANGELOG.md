# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/pt-br/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.37.1] - 2026-10-20

### Changed

- **Sincronização de Identidade e Badge Dinâmica de Assinatura ([`settings_page.dart`](mobile/lib/features/settings/presentation/settings_page.dart) & [`user_entity.dart`](mobile/lib/features/auth/domain/entities/user_entity.dart)):**
  - Adicionado getter inteligente `planDisplayName` em `UserEntity` para mapear e formatar dinamicamente os níveis de assinatura (`basic` -> "Plano Básico", `premium` -> "Plano Premium", `devoto` -> "Plano Devoto", `free` -> "Plano Gratuito").
  - Atualizada a badge na tela de Perfil/Configurações para exibir o status real da assinatura com destaque em ouro sacro (`• Ativo`) quando assinante, espelhando com precisão o plano contratado.
  - Exibição dinâmica do nome real do usuário registrado ("Lucas Gabriel") em substituição ao placeholder provisório ("Fiel MarIA").
- **Padronização de Datas Litúrgicas no Santuário de Novenas ([`novena.dart`](mobile/lib/features/novenas/domain/entities/novena.dart), [`novena_card.dart`](mobile/lib/features/novenas/presentation/widgets/novena_card.dart) & [`novena_detail_page.dart`](mobile/lib/features/novenas/presentation/pages/novena_detail_page.dart)):**
  - Implementado o getter `formattedFeastDay` para converter e exibir todas as datas de festas litúrgicas no formato padrão brasileiro `dd/mm` (ex: `28/09`, `12/10`, `13/05`), substituindo a notação do banco `mm-dd` nos cards do catálogo e na tela de detalhes.

### Fixed

- **Unificação de Contas e Associação Omnichannel (Supabase `public.users`):**
  - Realizada a fusão da conta de login mobile com o perfil prévio e ativo do WhatsApp/Asaas do usuário, garantindo a integridade dos dados históricos (mensagens, consumo e status de assinatura) e a sincronização do e-mail com o `auth_user_id`.

## [1.37.0] - 2026-10-19

### Added

- **Sementeira Canônica Integral de Novenas Católicas (25 Novenas / 225 Dias Estruturados):**
  - **Hierarquia Estrita de Fontes Canônicas:** Priorização sequencial estabelecida pelo usuário: 1. Padre Paulo Ricardo (`padrepauloricardo.org`) → 2. Canção Nova (`cancaonova.com`) → 3. ACI Digital (`acidigital.com`).
  - **Catálogo Abrangente em 4 Categorias Teológicas:**
    - *Marianas (7 novenas):* Nossa Senhora Desatadora dos Nós, N. Sra. Aparecida (Padroeira do Brasil), N. Sra. de Fátima, N. Sra. das Graças e Medalha Milagrosa, N. Sra. do Perpétuo Socorro, N. Sra. do Monte Carmelo e Imaculada Conceição de Maria.
    - *Santos (12 novenas):* São Judas Tadeu (Causas Desesperadas), São José (Patrono da Igreja e Operários), Santo Antônio de Pádua (Doutor Evangélico), São Miguel Arcanjo (Batalha Espiritual), Santa Teresinha do Menino Jesus (Chuva de Rosas), São Pio de Pietrelcina / Padre Pio, São Peregrino Laziosi (Patrono contra Câncer e Tumores), São Francisco de Assis (Paz e Criação), Santa Rita de Cássia (Causas Impossíveis), Beato Carlo Acutis (Eucaristia e Internet), São Bento Abade (Combate Espiritual e Proteção) e São João Paulo II (Famílias e Não Tenhais Medo).
    - *Senhor Jesus (3 novenas):* Sagrado Coração de Jesus (Reparação e Promessas a Santa Margarida Maria), Divina Misericórdia (Diário de Santa Faustina Kowalska) e Menino Jesus de Praga (Carmelitas / Infância Espiritual).
    - *Litúrgicas (3 novenas):* Espírito Santo e Seus Sete Dons (Pentecostes e Cenáculo com a Virgem Maria), Novena Tradicional de Natal (Encarnação e Presépio / Santo Afonso de Ligório) e Almas do Purgatório (Comemoração de Finados / Santo Afonso de Ligório).
  - **Densidade Litúrgica e Espiritual Completa:** Cada dia dos 225 dias contém Oração Inicial, Citação Bíblica completa com capítulo e versículo, Meditação Teológica profunda, Oração Específica do Dia, Proposta de Intenção Pessoal e Orações Conclusivas tradicionais (Pai Nosso, Ave Maria, Glória, jaculatórias e bênção).
  - **Scraper e Auditor de Novenas ([`scripts/scrape_novenas.py`](scripts/scrape_novenas.py)):** Utilitário em Python com suporte a busca sequencial nas 3 fontes oficiais (`padre_paulo_ricardo`, `cancao_nova`, `aci_digital`), verificação de conectividade (`--check-sources`), listagem do catálogo (`--list`) e exportação em JSON (`--export-json`).

### Changed

- **Substituição e Enriquecimento Profundo das Novenas Anteriores:**
  - Substituídos os textos genéricos e repetitivos das 5 novenas originais do banco de dados por meditações teológicas autênticas, orações canônicas e referências bíblicas minuciosas para cada um dos 9 dias, agora consolidadas no Supabase.
  - Desacoplamento da rota de sementeira no NestJS (`POST /panel/novenas/seed`): o método `seedDefaultNovenas()` agora opera diretamente contra o Supabase como fonte única da verdade, sem depender de arrays pesados estáticos em código.
  - Reconstrução obrigatória e reinicialização conteinerizada do container backend (`maria-backend-1`) via `docker compose up --build -d backend` com validação de saúde do serviço na porta 3002.
  - **Harmonização Visual do Card de Novenas ([`prayers_page.dart`](mobile/lib/features/prayers/presentation/prayers_page.dart)):** Padronizado o card do Santuário de Novenas para seguir a mesma semiótica e estados visuais do card de Exame de Consciência (opacidade atenuada a 0.6 quando bloqueado para convidados, borda e ícone circulares suaves com cadeado, e tipografia atenuada com badge alinhado).
  - **Formulários de Edição do Painel Admin ([`novenas.tsx`](frontend/src/pages/novenas.tsx)):** Conversão de todos os campos de orações, intenções, leituras bíblicas e títulos nos formulários do "Editor dos 9 Dias" e "Dados Gerais" de inputs de linha única para áreas de texto multilinhas (`<textarea>`) com suporte a redimensionamento vertical (`resize-y`), tipografia orante (`font-serif`) e quebra de linha visual (`leading-relaxed`), permitindo a edição e leitura confortável de textos e orações completas.
  - **Padrão Estrito de Segurança de Senha no Cadastro ([`register_page.dart`](mobile/lib/features/auth/presentation/pages/register_page.dart) & [`mobile-auth.service.ts`](backend/src/mobile/mobile-auth.service.ts)):**
    - Implementação de validação de alta segurança no cadastro por e-mail: mínimo de 6 caracteres, exigindo obrigatoriamente ao menos uma letra maiúscula (`[A-Z]`), uma letra minúscula (`[a-z]`), um número (`[0-9]`) e um caractere especial/símbolo (`[^a-zA-Z0-9\s]`).
    - Validação de entrada no app Flutter com orientações claras de requisitos (`helperText` descritivo) e validação impeditiva correspondente com `BadRequestException` no serviço de autenticação do NestJS.
  - **Refinamento Visual da Tela de Login ([`login_page.dart`](mobile/lib/features/auth/presentation/pages/login_page.dart)):** Remoção do subtítulo *"Entre com seu e-mail para sincronizar seu roteiro espiritual"* logo abaixo do cabeçalho "Acessar Conta", tornando o card de login mais limpo, direto e compacto.
  - **Catálogo e Filtros do Santuário de Novenas ([`novenas_catalog_page.dart`](mobile/lib/features/novenas/presentation/pages/novenas_catalog_page.dart) & [`novenas.service.ts`](backend/src/novenas/novenas.service.ts)):**
    - Sincronização dos identificadores das categorias (`marianas`, `santos`, `causas_urgentes`, `jesus`, `liturgicas`) com as categorias canônicas do banco de dados, restabelecendo a exibição das novenas ao tocar nos filtros.
    - Adição de indicador visual intuitivo de rolagem lateral com degradê de fade e ícone sutil de navegação à direita, evidenciando que existem mais categorias disponíveis para deslizar.
  - **Experiência Visual na Tela dos Dias da Novena ([`novena_prayer_day_page.dart`](mobile/lib/features/novenas/presentation/pages/novena_prayer_day_page.dart) & [`novena_progress_beads.dart`](mobile/lib/features/novenas/presentation/widgets/novena_progress_beads.dart)):**
    - AppBar reformulada em duas linhas hierárquicas (`1º Dia de Oração` no título sacro e o nome da novena no subtítulo), eliminando o corte de texto.
    - Correção do overflow horizontal de 55 pixels na régua de progresso das 9 contas orantes com dimensionamento elástico (`Flexible`), garantindo encaixe responsivo e sem faixas de advertência em qualquer largura de tela.


### Removed

- **Expurgo Definitivo de Scripts e Arquivos de Sementeira:**
  - Removidos todos os scripts de sementeira únicos em `backend/scripts/`: `seed_novenas.ts`, `seed_privacy_policy.ts`, `seed_terms_of_use.ts`, `seed_system_prompts.ts`, `seed_rosary_prompt.ts` e `seed_generator_prompts.ts`.
  - Removidos os arquivos temporários de dados locais e runner em `backend/src/novenas/`: `initial-novenas-data.ts`, `runner.ts` e a pasta `data/` (`marianas.data.ts`, `santos.data.ts`, `santos_part2.data.ts`, `santos_part3.data.ts`, `jesus.data.ts`, `liturgicas.data.ts`), mantendo o repositório leve e ágil já que todas as 25 novenas e 225 dias foram persistidos no Supabase.

### Fixed

- **Compatibilidade de Nomenclatura no App Mobile ([`novena_model.dart`](mobile/lib/features/novenas/data/models/novena_model.dart)):**
  - Ajustado `NovenaDayModel.fromJson` para suportar tanto a coluna `concluding_prayer` (do banco Supabase e backend NestJS) quanto `closing_prayer` (do modelo legado local), eliminando orações finais em branco na interface móvel.
- **Tratamento de Contas Existentes no Cadastro Mobile ([`mobile-auth.service.ts`](backend/src/mobile/mobile-auth.service.ts)):**
  - Corrigido fluxo de cadastro por e-mail quando o endereço já possui conta no sistema (ex: administradores do painel ou fiéis previamente registrados): adicionada checagem paralela em `public.admins` e detecção de códigos 422/already registered do Supabase Auth, substituindo o erro enganoso *"Usuário criado, mas falhou ao gerar sessão"* por uma instrução clara e amigável: *"Este e-mail já está cadastrado na MarIA. Toque em 'Entrar' para acessar sua conta"*.


## [1.36.1] - 2026-10-19

### Changed

- **Organização e Limpeza Estrutural da Raiz do Monorepo:**
  - **Planos Técnicos e de Arquitetura:** Movimentação de `action-plan.md`, `auth-sync-architecture-plan.md`, `novenas-cms-architecture-plan.md` e `spiritual-life-plan.md` para a pasta dedicada [`docs/plans/`](docs/plans/).
  - **Documentação de Negócio e Propostas:** Movimentação de `PROPOSTA_MARIA.md` para [`docs/business/`](docs/business/).
  - **Scripts de Automação:** Script de deploy movido de `deploy.sh` para [`scripts/deploy.sh`](scripts/deploy.sh) com navegação automática para a raiz do repositório (`cd "$(dirname "$0")/.."`), mantendo os launchers de desenvolvimento rápido ([`dev.bat`](dev.bat) e [`iniciar_emulador.bat`](iniciar_emulador.bat)) na raiz para conveniência.
  - **Sincronização de Referências e Documentação:** Atualizados comandos em [`package.json`](package.json) (`"deploy": "bash scripts/deploy.sh"`), referências no [`README.md`](README.md) e árvore de diretórios em [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md).

### Removed

- **Expurgo de Documentos Obsoletos da Raiz:**
  - Remoção definitiva no Git dos arquivos legados `ANALISE_FINANCEIRA.md`, `GUIA_TESTERS_MARIA.md`, `GUIA_TESTERS_MARIA.pdf`, `_Proposta de Negócio_ Maria no WhatsApp.pdf`, `analise_gateways_pagamento.md` e `pdf_styles.css`.

## [1.36.0] - 2026-10-18

### Added

- **MarIA Mobile & Backend — Login Social com Google OAuth Nativo (One-Tap / Google Play Services + Supabase Auth + Smart Merge):**
  - **Autenticação Nativa Mobile (`google_sign_in: ^7.2.0`):**
    - Adicionado suporte nativo à biblioteca `google_sign_in` com padrão Singleton (`GoogleSignIn.instance`) e inicialização única com o Web Client ID.
    - Acionamento direto da folha de contas do Google Play Services no Android / iOS sem redirecionamentos externos para navegador.
    - Captura do `idToken` criptografado e tratamento amigável de cancelamento (`GoogleSignInExceptionCode.canceled`) sem exibição de falsos erros ao fiel.
  - **Integração no Backend NestJS ([`MobileAuthController`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile-auth.controller.ts) & [`MobileAuthService`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile-auth.service.ts)):**
    - Novo endpoint `POST /mobile/auth/google` recebendo `{ idToken, accessToken }`.
    - Validação de identidade via `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`.
    - Smart Merge: se o fiel já possuir conta registrada ou histórico pastoral vinculado pelo e-mail do Google, as informações e quotas são consolidadas sem duplicação de perfil.
  - **Proteção e Gestão de Credenciais:**
    - Credenciais do cliente Android salvas e protegidas em [`mobile/android/app/google_oauth_android.json`](file:///d:/Programming/AcutisTech/MarIA/mobile/android/app/google_oauth_android.json).
    - Credenciais do cliente Web salvas em [`backend/client_secret_web.json`](file:///d:/Programming/AcutisTech/MarIA/backend/client_secret_web.json) e configuradas no Supabase Dashboard.
    - Variáveis de ambiente registradas em `backend/.env` (`GOOGLE_WEB_CLIENT_ID`, `GOOGLE_WEB_CLIENT_SECRET`, `GOOGLE_ANDROID_CLIENT_ID`).
    - Regras nos arquivos `.gitignore` na raiz, no backend e no mobile para impedir qualquer exposição acidental de credenciais no Git.
  - **Interface & Experiência de Usuário ([`LoginPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/login_page.dart)):**
    - Conexão do botão "Google" com feedback de carregamento em tempo real ("Conectando..." + spinner azul celestial).
    - Exibição de saudação acolhedora ("Bem-vindo! Que a Virgem Maria abençoe suas orações.") ao autenticar com sucesso.

## [1.35.0] - 2026-10-17

### Added

- **MarIA Mobile — Integração da Identidade Visual Sagrada (Logo MarIA Premium) e Redesign Solene da Tela de Login:**
  - **Pipeline de Assets e Emblema Sagrado (`maria_emblem.png`):**
    - Importada a identidade visual oficial de `landing/public/maria_logo_premium.png` para a pasta de assets móveis (`mobile/assets/images/`).
    - Realizado recorte de alta precisão do medalhão circular mariano (570x570 px), isolando o véu tecnológico e a coroa de doze estrelas de Nossa Senhora.
    - Atualizados os ícones oficiais do app web e favicon (`mobile/web/favicon.png`, `Icon-192.png`, `Icon-512.png`, `Icon-maskable-192.png` e `Icon-maskable-512.png`).
  - **Redesign Solene e Imersivo da Tela de Login ([`LoginPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/login_page.dart)):**
    - Fundo noturno mariano com gradiente radial e aura dourada (`#001538` → `#000E24`).
    - Emblema da MarIA posicionado como herói central em medalhão circular de 110 px com halo duplo dourado e glow suave.
    - Tipografia nobre com cabeçalho sagrado Cinzel ("MARIA", "INTELIGÊNCIA ARTIFICIAL CATÓLICA") e a passagem bíblica *«Fazei tudo o que Ele vos disser» (Jo 2, 5)*.
    - Card formulário em estilo *glassmorphic* translúcido (`rgba(0, 22, 58, 0.82)`) com bordas em dourado sacro.
    - Botão primário "Entrar" com efeito de centelhas (`sparkles`), botões sociais para Google e Apple lado a lado em estilo glass, e botão dedicado **"Acessar sem conta • Modo Visitante"** no rodapé.
  - **Posicionamento Estratégico da Identidade Visual pelo Aplicativo:**
    - **Portal de Autenticação & Cadastro:** Presente na [`LoginPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/login_page.dart) e na [`RegisterPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/register_page.dart).
    - **Modal Devocional Gatekeeper ([`DevotionalGatekeeperModal`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/widgets/devotional_gatekeeper_modal.dart)):** Emblema circular com halo no topo do modal de conversão.
    - **Santuário MarIA ([`DailyLiturgicalHeader`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/widgets/daily_liturgical_header.dart)):** Medalhão circular de 42 px com halo dourado ao lado da saudação e título "Santuário MarIA".
    - **Aba de Ajustes ([`SettingsPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/settings/presentation/settings_page.dart)):** Avatar de perfil do fiel visitante e selo no rodapé acima da versão.

### Changed

- **MarIA Mobile — Transição Suave via Modal Devocional ao Acessar Recursos Bloqueados:**
  - Substituída a navegação abrupta direta para o login ao clicar nos cards de recursos bloqueados (*Plano de Vida*, *Próxima Novena*, *Ações Rápidas* e banners de *Orações*).
  - O aplicativo agora abre o [`DevotionalGatekeeperModal`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/widgets/devotional_gatekeeper_modal.dart), oferecendo uma experiência acolhedora que explica os benefícios da conta, convida para cadastro gratuito, oferece login direto ou permite continuar como visitante.

## [1.34.2] - 2026-10-17

### Changed

- **MarIA Mobile — Harmonização Visual dos Cards Bloqueados (Novena & Plano de Vida) e Eliminação de Ações Duplicadas:**
  - **Harmonização do Card de Novena (`UpcomingNovenasCard`):** Quando desativado para visitantes, o card de Próxima Novena adota o mesmo tratamento visual do Plano de Vida (opacidade 0.6, bordas atenuadas e sem botões pesados no rodapé).
  - **Badge Superior como Botão Único de Conversão:**
    - O badge no topo à direita (`[ 🔒 Entre para liberar → ]`) atua como o botão exclusivo de conversão para a tela de autenticação ([`LoginPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/login_page.dart)).
    - Removida a duplicidade de CTAs no rodapé dos cards de **Plano de Vida** ([`SpiritualHabitsRow`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/widgets/spiritual_habits_row.dart)) e de **Próxima Novena** ([`UpcomingNovenasCard`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/home/presentation/widgets/upcoming_novenas_card.dart)).
    - Ambos os rodapés agora exibem harmoniosamente a descrição do recurso à esquerda e o indicador discreto `🔒 Bloqueado` à direita, proporcionando uma experiência visual limpa e sacra.

## [1.34.1] - 2026-10-17

### Added

- **MarIA Mobile — Tela Inicial de Login/Cadastro, Modo Restrito & Aspecto Desativado dos Blocos ("Entre para liberar"):**
  - **Portal Inicial de Autenticação (`LoginPage` & `RegisterPage`):** O aplicativo agora apresenta na inicialização a tela de login/cadastro para novos e recorrentes fiéis. Abaixo do formulário de acesso, foi disponibilizada a ação expressa **"Acessar sem conta"**, permitindo explorar o aplicativo em modo restrito (`guestAccessGrantedProvider`).
  - **Aspecto Desativado e Não-Clicável para Visitantes (`QuickActionsGrid`, `SpiritualHabitsRow` & `PrayersPage`):**
    - Os blocos de **Plano de Vida**, **Exame Noturno**, **Lembretes & Sinos** (Lembrar teus ensinos) e **Falar com a MarIA** adotam uma estética sacra desativada quando o usuário não estiver logado:
      - Opacidade atenuada (0.55 a 0.6) e paleta esmaecida.
      - Ícones com badges de cadeado dourado (`LucideIcons.lock`).
      - Inscrição nobre e explicativa: badge `🔒 Entre para liberar` e subtítulo contextualizado.
      - Totalmente não-clicáveis (`onTap: null`), sem disparos de cliques acidentais ou modais intrusivos.
  - **Otimização Visual e Omissão da Aba da MarIA para Visitantes (`AppScaffold`):**
    - Quando o usuário estiver no modo restrito (não logado), a barra inferior de navegação oculta de forma limpa a aba de acesso à IA MarIA, exibindo um layout harmonioso de 4 itens (*Santuário*, *Liturgia*, *Orações*, *Ajustes*).
    - Para usuários autenticados, a aba da MarIA é exibida nativamente na barra de navegação com todas as suas capacidades pastorais.

## [1.34.0] - 2026-10-17

### Added

- **MarIA Mobile & Backend — Autenticação Híbrida, Identidade e Sincronização Omnichannel (Supabase Auth + Uazapi OTP + Smart Merge):**
  - **Modelo Híbrido de Acesso (Inspirado em Hallow & Capela):**
    - Acesso livre para visitantes: Santo Terço, Liturgia Diária, Santo do Dia e Exame de Consciência Noturno disponíveis sem necessidade de cadastro.
    - Gatekeeper Devocional ([`DevotionalGatekeeperModal`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/widgets/devotional_gatekeeper_modal.dart)): Intercepta tentativas de acesso ao Plano de Vida Espiritual, Santuário de Novenas, Lembretes e Chat de IA com convite nobre, lista de benefícios e botões *"Criar conta grátis"*, *"Já tenho uma conta"* e *"Continuar como visitante"*.
  - **Autenticação Nativa por E-mail & Senha via Supabase Auth:**
    - Módulo Clean Architecture completo em `mobile/lib/features/auth/` (`UserEntity`, `UserModel`, `AuthRemoteDataSource`, `AuthLocalDataSource`, `AuthRepositoryImpl`, `AuthController`).
    - Telas de Login ([`LoginPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/login_page.dart)) e Cadastro ([`RegisterPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/pages/register_page.dart)) com validação de campos, Nome e Sobrenome, redefinição de senha oficial por e-mail e persistência criptografada em `FlutterSecureStorage` (com fallback Web).
    - Botões sociais desenhados para Google e Apple preparados para integração nativa.
  - **Vinculação Desacoplada do WhatsApp via OTP com Uazapi ([`LinkWhatsAppBottomSheet`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/auth/presentation/widgets/link_whatsapp_bottom_sheet.dart)):**
    - Disparo de código de 6 dígitos pelo WhatsApp da MarIA com validade de 15 minutos e expurgo de códigos expirados.
    - Motor de **Smart Merge** no backend NestJS ([`MobileAuthService`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile-auth.service.ts)): se o fiel já conversava com a MarIA no WhatsApp antes de baixar o app, as duas contas são consolidadas sem perda de dados, unindo histórico de orações, novenas, hábitos e assinaturas ativas sob o mesmo perfil.
  - **Integração Reativa Multiprovider (Riverpod 3):**
    - `UserNovenasNotifier` e `SpiritualPlanNotifier` conectados reativamente ao `activeUserIdProvider`, sincronizando imediatamente o acervo sagrado ao realizar login ou logout.
    - Aba de Perfil ([`SettingsPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/settings/presentation/settings_page.dart)) com card dinâmico do fiel, status da assinatura, indicador de sincronização do WhatsApp e botão de encerramento de sessão.
  - **Banco de Dados (Supabase Migration):**
    - Executada a migration [`docs/migrations/20261017000000_mobile_auth_and_sync.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20261017000000_mobile_auth_and_sync.sql) tornando `phone` opcional em `public.users` e adicionando as colunas `email` e `auth_user_id` com índices dedicados.

## [1.33.0] - 2026-10-15

### Added

- **MarIA Mobile & Backend — Novenas Litúrgicas Dinâmicas com Início Inteligente, Card na Home, Lembretes Multi-canal e Integração ao Plano de Vida Espiritual:**
  - **Cálculo Canônico Litúrgico Regressivo:** Algoritmo implementado na entidade `Novena` (`getFeastDate()`, `idealStartDate`, `daysUntilIdealStart` e `liturgicalBadge`) que calcula a data de início ideal com base na comemoração do santo (Festa no 9º dia: `festa - 8 dias = Dia 1`). Para a *Novena a São João Paulo II* (Festa em 22/10), a data ideal é 14/10, gerando badges pastorais contextualizados como *"COMEÇOU ONTEM (DIA 2/9)"* e *"COMEÇA HOJE!"*.
  - **Card Dinâmico na Tela Inicial (`UpcomingNovenasCard`):** Integrado à tela principal (`HomePage`), logo abaixo do Santo do Dia, destacando a próxima novena mais oportuna segundo o calendário litúrgico, com atalho direto para iniciar a oração ou visualizar o catálogo. Quando o fiel inicia uma novena, o widget transita automaticamente para o modo **"SUA NOVENA ATIVA"**, exibindo a barra de progresso dos 9 dias, intenção consagrada, horário de lembrete e botão de oração rápida do dia.
  - **Modal Completo de Inicialização de Novena com Lembretes:**
    - Campo para consagração da intenção particular.
    - Seletor de horário diário com presets rápidos (`07:00` Manhã, `12:00` Ângelus, `18:00` Tarde, `20:00` Noite) e TimePicker customizado.
    - Configuração de lembretes diários por notificação no celular e envio automático pelo WhatsApp (com campo de telefone).
    - Informativo de inclusão automática no Plano de Vida Espiritual.
  - **Integração Bidirecional ao Plano de Vida Espiritual (`SpiritualPlanNotifier`):**
    - A novena ativa é injetada dinamicamente na lista de hábitos diários do fiel (`novena_habit_${un.id}`) com o horário programado e período correspondente (*Manhã*, *Meio-dia*, *Tarde*, *Noite*).
    - Sincronização mútua: marcar o hábito no Plano de Vida conclui o dia correspondente na novena e vice-versa.
    - Expiração automática após o 9º dia de oração.
  - **Novena a São João Paulo II Semeada no Backend & Offline:** Povoamento completo dos 9 dias com orações iniciais, meditações, leituras bíblicas, orações próprias do Papa Wojtyła e ladainha, tanto na sementeira do Supabase (`initial-novenas-data.ts`) quanto nos dados offline do app (`default_novenas_data.dart`).
  - **Resiliência de Identificador Anônimo de Dispositivo:** Suporte a UUID determinístico no cliente mobile para compatibilidade imediata com esquemas relacionais do Supabase.

## [1.32.0] - 2026-10-15

### Added

- **MarIA Mobile — Santuário de Novenas Católicas com Modo Offline-First & Ritmo Pastoral Flexível (`mobile/lib/features/novenas/`):**
  - **Experiência Devocional das Grandes Novenas no App:** Implementado módulo nativo completo para vivência dos 9 dias de devoção, consumindo dinamicamente o catálogo do Supabase através do backend NestJS (`/mobile/novenas`) com sincronização transparente.
  - **Arquitetura Offline-First Resiliente:** Persistência local em cache via `SharedPreferences` ([`novenas_local_data_source.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/data/datasources/novenas_local_data_source.dart)) com fila de ações pendentes (`novenas_pending_sync_queue`) e pacote embutido de novenas canônicas de alta fidelidade ([`default_novenas_data.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/data/datasources/default_novenas_data.dart)). O fiel pode rezar em capelas ou igrejas sem sinal de internet com registro imediato de progresso e sincronização em segundo plano ao reconectar.
  - **Ritmo Pastoral Flexível:** Possibilidade de rezar o dia sugerido, compensar dias esquecidos ou revisar orações de dias anteriores com total liberdade devocional.
  - **Indicador Sagrado de Progresso (9 Contas/Velas Táteis):** Widget acessível [`NovenaProgressBeads`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/presentation/widgets/novena_progress_beads.dart) com alvos de toque superiores a 44x44px, diferenciação cromática para dias concluídos (Ouro Sacro `#D4AF37`), dia atual em destaque pulsante (Azul Mariano `#0047AB`) e dias futuros.
  - **Itinerário Litúrgico Contemplativo por Dia ([`novena_prayer_day_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/presentation/pages/novena_prayer_day_page.dart)):** Cada um dos 9 dias estrutura a oração em 5 momentos sagrados com tipografia litúrgica e cards devocionais:
    1. *Sinal da Cruz & Oração Inicial*
    2. *Palavra de Deus* (com citação e referência bíblica)
    3. *Meditação do Dia*
    4. *Oração Própria do Xº Dia* (com destaque dourado)
    5. *Orações Conclusivas & Amém* (Pai Nosso, Ave Maria e Glória)
    - Botão de ação inferior com feedback háptico (`HapticFeedback.mediumImpact()`) e diálogo celebrativo ao concluir o dia ou finalizar o novenário.
  - **Gestão de Intenções Pessoais ([`novena_detail_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/presentation/pages/novena_detail_page.dart)):** Modal devocional na abertura da novena para consagrar a intenção particular no Coração de Jesus e Maria, mantendo-a visível como lembrete constante no topo da oração diária, com botão de ação simplificado para **"Iniciar Novena"** (removendo a redundância devocional).
  - **Catálogo Santuário de Novenas ([`novenas_catalog_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/novenas/presentation/pages/novenas_catalog_page.dart)):** Tela principal com busca em tempo real, chips de filtro por categoria (*Marianas*, *Santos*, *Causas Urgentes*, *Cristológicas*, *Penitenciais*), card hero com atalho rápido para a novena em andamento e pull-to-refresh.
  - **Ponto de Acesso em Orações ([`prayers_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/prayers/presentation/prayers_page.dart)):** Banner nobre com insígnia sagrada e badge de 9 Dias integrado à aba de Devoções, logo abaixo do Santo Terço.
  - **Rotas Declarativas no GoRouter ([`app_router.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/core/router/app_router.dart)):** Registro de rotas `/novenas` e `/novenas/:idOrSlug`.
  - **Bateria de Testes Automatizados ([`mobile/test/novenas_test.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/test/novenas_test.dart)):** Testes unitários de modelos, serialização de progresso do usuário, renderização do indicador de 9 contas, cards e fluxo de oração com 100% de aprovação.

## [1.31.0] - 2026-10-15

### Added

- **Novenário MarIA & Supabase como Fonte Única da Verdade (`backend/src/novenas/` & `docs/migrations/`):**
  - **Modelagem Relacional de Novenas no Supabase:** Criação das tabelas [`public.novenas`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20261015000000_create_novenas_module.sql), `public.novena_days`, `public.user_novenas` e `public.user_novena_logs`, permitindo que todo o acervo devocional seja editável e expansível via CMS, eliminando hardcodes no aplicativo móvel.
  - **Módulo Backend NestJS Completo (`novenas`):** Implementados [`NovenasService`](file:///d:/Programming/AcutisTech/MarIA/backend/src/novenas/novenas.service.ts), `PanelNovenasController` (`/panel/novenas`) para o CMS e `MobileNovenasController` (`/mobile/novenas`) para o aplicativo mobile, com suporte a consulta pública de novenas publicadas, detalhamento dia a dia, inicialização de percurso espiritual com intenção pessoal e avanço diário.
  - **Sementeira das Grandes Novenas Católicas (Canção Nova & Tradição):** Povoamento de 4 novenas completas de 9 dias cada (36 dias de oração) com textos canônicos revisados:
    - *Novena a Nossa Senhora Desatadora dos Nós* (categoria Marianas)
    - *Novena a Santa Rita de Cássia* (categoria Causas Urgentes / Impossíveis)
    - *Novena ao Beato Carlo Acutis* (categoria Santos & Eucaristia)
    - *Novena a São Bento Abade* (categoria Santos & Libertação)
  - **Endpoint de Sementeira Administrativa:** Rota `POST /panel/novenas/seed` para reidratação ou atualização automática de novenas no Supabase.

## [1.30.1] - 2026-10-14

### Added

- **MarIA Mobile — Etapa Interativa Solene da Salve Rainha no Santo Terço (`rosary_page.dart`):**
  - **Etapa Dedicada da Salve Rainha:** Em vez de apresentar a Salve Rainha apenas em um pop-up após a 5ª dezena, o fluxo do Santo Terço agora transita diretamente para uma etapa interativa dedicada (`DecadeStage.hailHolyQueen`), com insígnia de coroa em ouro sacro, cabeçalho de *Encerramento do Santo Terço*, medalha de confirmação de *50 Ave-Marias Concluídas* e texto sagrado completo com versículo e resposta litúrgica (*"V. Rogai por nós, Santa Mãe de Deus / R. Para que sejamos dignos das promessas de Cristo. Amém"*).
  - **Navegação Contínua e Responsiva:** Ao terminar o Glória ao Pai da 5ª dezena, o botão de ação inferior convida expressamente a *"Rezar Salve Rainha"*, preservando a navegação bidirecional (possibilidade de retroceder conta para o 5º Glória).
  - **Celebração e Conclusão Limpa:** Ao tocar para concluir na Salve Rainha, exibe o diálogo celebrativo com a bênção da coroa de rosas e a reflexão espiritual de São João Paulo II (*"«Rezar o Terço é contemplar com Maria o rosto de Cristo.»"*), sem poluição ou duplicação do texto da oração em telas pequenas.

## [1.30.0] - 2026-10-14

### Added

- **MarIA Mobile — Módulo Completo de Preparação para a Confissão (Cofre Sacramental com Biometria & 10 Mandamentos):**
  - **Segurança Sacramental & Sigilo Absoluto (Zero-Knowledge):** Todo o exame de consciência e as anotações do fiel são persistidos estritamente no armazenamento local do dispositivo (`FlutterSecureStorage` com fallback para `SharedPreferences` na Web). Nenhum pecado ou anotação é transmitido para servidores ou salvo em banco de dados na nuvem.
  - **Bloqueio com a Senha do Celular & Biometria:** Integração com `local_auth` permitindo autenticação nativa com a impressão digital, Face ID ou senha/PIN/padrão do próprio smartphone (semelhante ao bloqueio de aplicativos como o WhatsApp), além de suporte a PIN numérico alternativo de 4 dígitos.
  - **Auto-Bloqueio por Inatividade de 2 Minutos:** Monitoramento ativo de inatividade que tranca automaticamente o cofre após 120 segundos sem uso ou ao minimizar o aplicativo.
  - **Exame Detalhado dos 10 Mandamentos da Lei de Deus:** Itinerário catequético e moral minucioso fundamentado no Magistério da Igreja e nos ensinamentos clássicos dos santos confessores (Santo Afonso de Ligório, São Tomás de Aquino). Cada mandamento conta com versículo bíblico meditativo, perguntas de exame com alerta visual de matéria grave e campo para anotações pessoais de circunstâncias/frequência.
  - **Modo Confessionário (Espelho de Leitura Diante do Sacerdote):** Interface de alto contraste e foco total, apresentando exclusivamente as faltas assinaladas agrupadas por mandamento, anotações pessoais, roteiro do diálogo com o padre (*"Abençoai-me, padre, porque pequei..."*) e o texto completo do Ato de Contrição.
  - **Expurgo e Selamento Sacramental ("Recebi a Absolvição!"):** Botão solene que, mediante confirmação, destrói e apaga irreversivelmente todas as anotações e seleções de pecados do aparelho, abrindo uma página sagrada de Ação de Graças com o versículo da reconciliação (*Lc 7, 48-50*) e oração pós-confissão.
  - **Acesso em Destaque na Aba de Orações:** Banner nobre incorporado em [`prayers_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/prayers/presentation/prayers_page.dart) com badge e indicador de cofre protegido.
  - **Refinamento do Guia Litúrgico:** Simplificação do título do 2º passo dos 5 passos clássicos da boa confissão para expressar diretamente a virtude sacramental de **Contrição** em [`confession_prep_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/confession/presentation/pages/confession_prep_page.dart).

## [1.29.4] - 2026-10-14

### Fixed

- **MarIA Mobile — Inclusão do Pai-Nosso no Início das Dezenas do Santo Terço (`rosary_page.dart`):**
  - **Pai-Nosso Inicial (Conta Grande):** Corrigido o fluxo do Santo Terço para contemplar o Pai-Nosso no início de cada uma das 5 dezenas (após a meditação do mistério), exibindo a oração completa e a representação visual da conta grande dourada antes das 10 Ave-Marias.
  - **Glória ao Pai & Jaculatória de Fátima:** Ao concluir a 10ª Ave-Maria de cada dezena, o aplicativo apresenta o Glória ao Pai e a oração de Fátima (*"Ó meu Jesus, perdoai-nos..."*) antes de transitar para o mistério seguinte.
  - **Navegação Bidirecional Perfeita:** Suporte completo ao botão de retroceder conta (`_previousBead`), permitindo retornar da Ave-Maria para o Pai-Nosso da dezena, e do Pai-Nosso para o Glória da dezena anterior.
  - **Textos das Orações Tradicionais:** Disponibilização dos textos litúrgicos completos do Pai-Nosso, Ave-Maria e Glória ao Pai dentro dos cards de contemplação para oração assistida.

## [1.29.3] - 2026-10-14

### Changed

- **MarIA Mobile — Exame de Consciência Noturno (100% Contemplativo & Privacidade Total):**
  - **Identidade e Distinção Noturna:** Rebatizado expressamente para *Exame de Consciência Noturno* em [`conscience_exam_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/prayers/presentation/conscience_exam_page.dart), nos atalhos e planos espirituais, com indicativo claro de que se trata de uma oração diária serena para o repouso em Deus, distinta do exame preparatório para a Confissão Sacramental.
  - **Privacidade Absoluta (Sem Digitação de Textos):** Removidos campos de texto e caixas de entrada de resoluções pessoais, assegurando que o fiel viva uma experiência meditativa interior sem risco de sentir sua intimidade exposta ou gravada.
  - **Seleção Rápida de Virtude Guia com 1 Toque:** Substituição do formulário livre por uma grade contemplativa de 8 virtudes católicas fundamentais (Paciência na Família, Pureza de Coração, Humildade & Mansidão, Fidelidade na Oração, Desapego das Telas, Silêncio contra Fofocas, Caridade com os Pobres, Gratidão sem Reclamar).
  - **Pausa de Silêncio Guiada (`_SilenceTimerWidget`):** Novo temporizador visual de 30 segundos com contagem suave e pulso respiratório para auxiliar o fiel a desacelerar e recolher a mente na presença de Deus.
  - **Modo Noturno Sereno (Focus Mode Escuro):** Paleta noturna profunda em azul marinho meia-noite (`#071120`) e ouro sacro, minimizando luz azul nos olhos antes do sono.
  - **Oração das Completas:** Inclusão da jaculatória litúrgica tradicional da Igreja (*"Em vossas mãos, Senhor, entrego o meu espírito"*) para concluir o exame e repousar em paz.

## [1.29.2] - 2026-10-14

### Changed

- **MarIA Mobile — Navegação Direta ao Tocar nos Cards & Otimização da Home (`home_page.dart`):**
  - **Acesso Direto ao Santo do Dia:** O card inteiro de `SaintHeroCard` agora possui feedback tátil e clique direto (`InkWell`), abrindo a nova tela dedicada [`SaintDetailPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/saint_of_day/presentation/saint_detail_page.dart) com arte sacra, memória litúrgica, citação, biografia e oração de intercessão.
  - **Plano de Vida sem Scroll Horizontal:** Transformação de `SpiritualHabitsRow` em um card coeso e interativo que abre o [`SpiritualPlanPage`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/spiritual_plan/presentation/spiritual_plan_page.dart) ao toque em qualquer parte do card. O scroll horizontal oculto foi substituído por uma visão geral estática e elegante com barra de progresso, 6 ícones circulares do dia com horários e indicação da próxima oração pendente.
  - **Liturgia da Palavra Direta:** O card `LiturgySummaryCard` agora é 100% clicável com transição direta para a leitura bíblica completa. Removido o ícone de fone de ouvido provisório e o botão pesado em favor de uma navegação fluida com affordance visual de chevron.

## [1.29.1] - 2026-10-14

### Changed

- **MarIA Mobile — Aprimoramento da Aba de Adicionar Prática Espiritual (`AddHabitBottomSheet`):**
  - **Remoção do Botão X:** Eliminado o ícone de fechamento estático em favor de um fechamento fluido e nativo através da barra de arraste (*drag handle*) e clique/toque fora (*barrier dismissible*).
  - **Barra de Arraste Superior & Título Centralizado:** Refinada a barra de arraste no topo do modal com dimensões proporcionais e centralizado o título sacro da prática espiritual.

## [1.29.0] - 2026-10-14

### Added

- **MarIA Mobile & Backend — Plano de Vida Espiritual Personalizado (Offline-First & Sincronizado):**
  - **Unificação de Hábitos & Lembretes Devocionais:** Transformação do Plano de Vida no coração devocional do app, onde cada momento espiritual combina disciplina diária (checklist com cálculo de streak consecutivo) e lembrete pontual com horário configurável.
  - **Template Padrão "Plano Mariano Completo":** Inicialização com os 6 momentos fundamentais da tradição católica:
    1. *Oferecimento da Manhã* (07:00 - Manhã)
    2. *Liturgia da Palavra & Evangelho* (09:00 - Manhã)
    3. *Oração do Angelus* (12:00 - Meio-dia)
    4. *Terço da Misericórdia* (15:00 - Tarde)
    5. *Santo Terço Mariano* (18:00 - Tarde)
    6. *Exame de Consciência* (21:30 - Noite)
  - **Catálogo de Sugestões da Tradição Católica & Criação Livre:** Novo modal [`AddHabitBottomSheet`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/spiritual_plan/presentation/widgets/add_habit_bottom_sheet.dart) com duas abas:
    - *Tradição Católica:* Adição com um toque de práticas como Visita ao Santíssimo, Lectio Divina, Oração a São Miguel Arcanjo, Jejum das Sextas e Jaculatória de Repouso.
    - *Criar Meu Hábito:* Formulário completo permitindo definir título livre, turno litúrgico, horário via `TimePicker` sacro e canais de notificação.
  - **Lembretes Híbridos (Celular & WhatsApp):** Cada item permite alternar de forma independente se dispara notificação local no smartphone (🔔 com toque sacro) e/ou mensagem direta no WhatsApp (💬 pela MarIA).
  - **Arquitetura Offline-First Resiliente:**
    - Operação 100% autônoma no dispositivo via `SharedPreferences`, garantindo leitura instantânea (0 delay na UI) e funcionamento sem internet ou em modo avião.
    - Sincronização em segundo plano transparente quando online, enviando o plano ativo para o banco de dados.
  - **Backend NestJS & Supabase Migration:**
    - Criada a tabela `user_spiritual_plans` via migration [`docs/migrations/20261014000000_create_user_spiritual_plans.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20261014000000_create_user_spiritual_plans.sql) com RLS para service role.
    - Endpoints `GET` e `PUT /mobile/spiritual-plan` implementados em [`mobile.controller.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile.controller.ts) e [`mobile.service.ts`](file:///d:/Programming/AcutisTech/MarIA/backend/src/mobile/mobile.service.ts).
    - Contêiner `maria-backend-1` reconstruído com Docker e em execução saudável.
  - **Testes & Qualidade:** 25 testes unitários e de widgets executados e 100% aprovados (`All tests passed!`), `flutter analyze` com 0 issues.

## [1.28.0] - 2026-10-13

### Added

- **MarIA Mobile & Backend — Sincronização de Preferências de Mensagens do WhatsApp (`RemindersPage`):**
  - **Card de Mensagens no WhatsApp:** Inserido na tela [`reminders_page.dart`](file:///d:/Programming/AcutisTech/MarIA/mobile/lib/features/reminders/presentation/reminders_page.dart) um card dedicado com status de vinculação do número de telefone e controles interativos de mensagens diárias enviadas pela MarIA.
  - **Controle Bidirecional de Envios Diários:**
    - **Liturgia Diária (Manhã):** Permite ligar/desligar o envio diário matinal das leituras bíblicas diretamente pelo aplicativo ou pelo WhatsApp (botão *"Cancelar envio diário"* / *"Receber envio diário"*).
    - **Exame de Consciência (Noite):** Toggle sincronizado para o convite guiado do exame de consciência às 21:30.
    - **Santo do Dia & Virtude:** Opção de receber a devoção e biografia do santo matinal.
  - **Endpoints Dedicados no Gateway Mobile:**
    - `GET /mobile/preferences?phone=...`: Consulta em tempo real o estado gravado na tabela `users` do Supabase.
    - `PUT /mobile/preferences`: Persiste no Supabase as alterações feitas nos switches do aplicativo, refletindo instantaneamente nos disparos agendados.
  - **Script de Migração SQL Supabase:** Criado [`docs/migrations/20261013000001_add_preferences_to_users.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20261013000001_add_preferences_to_users.sql) adicionando as colunas `receive_daily_exam`, `receive_daily_saint` e `whatsapp_bridge_enabled` com índices parciais.
  - **Fallback Seguro:** O backend opera com compatibilidade defensiva para atualizar os dados mesmo se a migração ainda estiver pendente no banco, com logs limpos de acompanhamento.
  - **Docker Rebuild:** Imagem do backend reconstruída e contêiner `maria-backend-1` em execução com os novos endpoints ativos.

## [1.27.3] - 2026-10-13

### Changed

- **MarIA Mobile — Indicador de Digitação Estilo WhatsApp (`features/chat_ai/presentation/chat_page.dart`):**
  - **Três Pontos Animados (Typing Dots):** Substituído o texto estático e spinner (*"MarIA está orando e formulando resposta..."*) por um balão compacto e fluido com 3 pontos animados que pulsam e saltam sequencialmente em onda (`_WhatsAppTypingIndicator`), reproduzindo com fidelidade a experiência nativa do WhatsApp.
  - **Harmonia Visual Católica:** O indicador mantém o fundo acolhedor de cartão, cantos arredondados assimétricos e os pontinhos dourados sagrados (`AppColors.sacredGold`) com micro-ícone de luz divina, transmitindo presença viva sem sobrecarregar a interface.

## [1.27.2] - 2026-10-13

### Fixed

- **MarIA Mobile — Comunicação Real do Chat com o Backend no Navegador (Flutter Web):**
  - **Compatibilidade Web em `ChatRemoteDataSource` (`kIsWeb`):** Resolvida a exceção silenciosa `Unsupported operation: Platform._operatingSystem` que ocorria ao avaliar `Platform.isAndroid` diretamente no navegador, a qual fazia a aplicação cair indevidamente no fallback de mensagens locais pré-configuradas (com o Sl 26).
  - **Resolução Segura de Host (`_baseUrl`):** Adicionada checagem com `kIsWeb` antes do acesso a `Platform.isAndroid`, garantindo que no navegador o app se conecte diretamente a `http://localhost:3002/mobile/chat` e receba em tempo real as respostas vivas e personalizadas geradas pela IA do backend.
  - **Headers HTTP Seguros no Browser (`ApiClient`):** Tornada condicional a atribuição do cabeçalho restrito `User-Agent` apenas para plataformas não-web (`if (!kIsWeb)`), evitando advertências de CORS ou recusa de headers inseguros pelo navegador.
  - **Aumento de Timeout e Observabilidade:** Ampliado o `receiveTimeout` para 30s para acomodar o tempo de reflexão e busca bíblica da MarIA sem timeout precoce, além da inclusão de logs detalhados via `debugPrint` para facilitar o diagnóstico de rede.

## [1.27.1] - 2026-10-13

### Added

- **MarIA Backend & Banco de Dados — Coluna de Origem (`origin`) na Tabela `messages` do Supabase:**
  - **Script de Migração SQL:** Criado [`docs/migrations/20261013000000_add_origin_to_messages.sql`](file:///d:/Programming/AcutisTech/MarIA/docs/migrations/20261013000000_add_origin_to_messages.sql) adicionando a coluna `origin VARCHAR(20) DEFAULT 'whatsapp'` e índice `idx_messages_origin` na tabela `messages`.
  - **Persistência de Origem no `AiService`:** Método `saveMessage` atualizado para receber o canal de origem (`'whatsapp'` ou `'mobile'`) e persistir tanto a mensagem do usuário quanto a resposta da MarIA com sua respectiva procedência.
  - **Fallback Defensivo sem Bloqueio:** O backend tenta persistir `origin` nativamente e, caso a coluna ainda não tenha sido criada no ambiente do Supabase, realiza o salvamento retrocompatível com log de aviso amigável sem interromper a experiência do fiel.

## [1.27.0] - 2026-10-12

### Added

- **MarIA Backend & Mobile — Unificação do Chat da IA (App & WhatsApp compartilhando o mesmo Motor `AiService`):**
  - **Arquitetura de Endpoints Dedicados com Motor Único:** O aplicativo mobile (`POST /mobile/chat`) agora utiliza diretamente o pipeline completo e oficial do `AiService`, o mesmo responsável pelas respostas da MarIA no WhatsApp.
  - **Identificação Unificada do Fiel e Persistência no Supabase:**
    - O backend agora suporta busca inteligente de usuários por número de telefone e identificadores mobile, associando a conta do fiel tanto no app quanto no WhatsApp.
    - As mensagens de oração e reflexões trocadas no app são persistidas na tabela `messages` do Supabase, alimentando o resumo pastoral contínuo (`general_summary`) e a memória de oração do fiel.
    - Se o usuário for anônimo/convidado, um telefone provisório não-nulo é gerado para satisfazer as restrições do banco de dados, sem travar o onboarding.
  - **Tratamento de Origem (`source: 'mobile' | 'whatsapp'`):**
    - Se a requisição vier do aplicativo móvel (`source: 'mobile'`), o backend pula automaticamente os fluxos de texto de triagem específicos do WhatsApp (perguntas de "como posso te chamar?") e entrega diretamente a resposta pastoral e maternal em formato síncrono no corpo HTTP.
    - Respostas interativas ou com botões do WhatsApp são normalizadas e tratadas com elegância para exibição no aplicativo Flutter.
  - **Docker Rebuild:** Imagem do backend reconstruída e contêiner `maria-backend-1` recriado e operando com sucesso.

## [1.26.3] - 2026-10-12

### Fixed

- **MarIA Mobile — Quebra Dinâmica e Exibição Completa da Virtude do Santo do Dia (`features/home/`):**
  - **Eliminação de Truncamento por Reticências:** Removida a limitação de `maxLines: 1` e `TextOverflow.ellipsis` que cortava virtudes mais extensas (como *"Maternidade Espiritual e Intercessão Materna"*) no card do Santo do Dia em telas menores.
  - **Quebra Natural de Linha (`softWrap: true`):** O texto agora se adapta suavemente à largura do aparelho, fluindo para a linha seguinte quando necessário sem truncar a frase no meio da palavra.
  - **Alinhamento e Responsividade do Card:** Ajustado o alinhamento da linha inferior entre a virtude e o botão de oração com `crossAxisAlignment: CrossAxisAlignment.center` e alinhamento do ícone sagrado no topo (`top: 1`), mantendo o layout harmônico e legível em qualquer resolução.

## [1.26.2] - 2026-10-12

### Changed

- **MarIA Mobile — Seletor Intuitivo dos Mistérios do Santo Terço (`features/prayers/`):**
  - **Substituição do Ícone de Filtro Oculto:** Substituído o antigo ícone ambíguo de funil (`listFilter`) por um botão direto e evidente no topo da AppBar: uma pílula com borda dourada e ícone sacro indicando `'Mistérios ▾'`.
  - **Header do Mistério Interativo com Feedback Tátil:** Transformado todo o cabeçalho superior do Terço em um cartão tocável com indicação clara de abertura (`'Toque para alterar'`), ícone temático e seta para baixo (`chevronDown`).
  - **Novo BottomSheet Nobre e Educativo de Mistérios:** Implementada uma folha modal com os 4 grupos de mistérios da Igreja Católica (Gozosos, Dolorosos, Gloriosos e Luminosos), indicando seus dias tradicionais, resumo contemplativo, badge `'Hoje'` para o mistério do dia da semana atual e marcação de seleção ativa com feedback háptico.
  - **Testes Automatizados:** Adicionado teste no Flutter (`testWidgets`) garantindo a abertura da folha modal e a seleção dos mistérios.

## [1.26.1] - 2026-10-12

### Fixed

- **MarIA Mobile — Correção de Transição Dinâmica no Leitor Litúrgico (`features/liturgy/`):**
  - **Eliminação de Exceção `Unexpected null value`:** Corrigido problema em que a transição entre dias litúrgicos de solenidades (com 4 abas: 1ª Leitura, Salmo, 2ª Leitura e Evangelho) e dias comuns de semana (com 3 abas, sem 2ª Leitura) causava falha de ciclo de vida e crash no Flutter.
  - **Adoção de `DefaultTabController` Declarativo:** Substituído o gerenciamento imperativo de `TabController` (que descartava o controller durante a renderização da árvore de widgets) pelo widget declarativo `DefaultTabController` com `ValueKey('${liturgy.dataFormatada}_${tabs.length}')`.
  - **Resiliência do Leitor de Leituras:** Eliminação de referências nulas ao esqueleto de carregamento (Shimmer) e garantia de que o usuário pode navegar livremente para frente, para trás ou por qualquer data do calendário sem travamento.

## [1.26.0] - 2026-10-12

### Added

- **MarIA Mobile — Fase 4 Concluída (Gestão Unificada de Lembretes & Hábitos do Plano de Vida):**
  - **Rastreador de Hábitos do Plano de Vida (`features/spiritual_plan/`):**
    - Entidade `SpiritualHabitEntity`, data source com `SharedPreferences` e `SpiritualPlanNotifier` com Riverpod 3.x.
    - Tela completa `SpiritualPlanPage` com gauge circular de santificação (% concluído), badge dinâmico de streak de constância diária e checklist interativa dos 5 hábitos católicos essenciais.
    - Atalhos diretos de "Rezar Agora" na checklist (abre o Santo Terço háptico, o Exame Noturno ou a Liturgia do Dia com 1 toque).
    - `SpiritualHabitsRow` da tela inicial (Home) conectado ao Riverpod, persistindo instantaneamente no aparelho e com atalho para o plano completo.
  - **Lembretes Devocionais & Ponte Híbrida com o WhatsApp (`features/reminders/`):**
    - Entidade `SpiritualReminderEntity`, persistência de configurações com `RemindersLocalDataSource` e `RemindersNotifier`.
    - Tela `RemindersPage` com ajuste dinâmico de horários de oração via seletor `showTimePicker`.
    - Suporte nativo à arquitetura híbrida: permite ao fiel selecionar simultaneamente `[x] Tocar no Celular` (com carrilhões e sinos de mosteiro) e `[x] Enviar no WhatsApp` para receber a meditação guiada pelo mensageiro.
    - Diálogo para criação de novos lembretes devocionais personalizados.
  - **Integração no Ecossistema:**
    - Atalho "Lembretes & Sinos" integrado no grid de ações da Home (`QuickActionsGrid`).
    - Seção "Vida Devocional & Lembretes" integrada na tela de ajustes (`SettingsPage`).
  - **Qualidade, Testes & Build:**
    - Suíte de testes expandida para **22 testes automatizados** aprovados com 100% de sucesso (`reminders_spiritual_plan_test.dart`, `chat_ai_test.dart`, `liturgy_saint_test.dart`, `rosary_conscience_test.dart`, `widget_test.dart`).
    - Análise de código estática com 0 issues (`flutter analyze`).
    - APK Android gerado com sucesso em `build\app\outputs\flutter-apk\app-debug.apk`.

## [1.25.0] - 2026-10-12

### Added

- **MarIA Mobile — Fase 3 Concluída (Inteligência Devocional Nativa, Chat Espiritual & Magisterium IA):**
  - **Diálogo Espiritual Fluido & Consistente (`features/chat_ai/presentation/chat_page.dart`):**
    - Interface devocional sacra com `ConsumerStatefulWidget` conectado ao Riverpod (`chatNotifierProvider`).
    - Chips dinâmicos com sugestões de partilha e oração para acolhimento inicial (*ansiedade à luz da fé*, *preparação para confissão*, *oração pela família*, *perdão sincero*, *meditação da Palavra*).
    - Indicador visual suave de digitação e oração ("MarIA está orando e formulando resposta...").
    - Auto-scroll suave para novas mensagens e suporte a cópia rápida para oração pessoal via toque longo com feedback tátil.
    - Botão de **Sigilo Espiritual** no AppBar com diálogo seguro para limpeza completa do histórico no dispositivo local.
  - **Camada de Dados & Resiliência Offline (`features/chat_ai/data/datasources/chat_remote_data_source.dart`):**
    - Comunicação com o gateway backend (`/mobile/chat`).
    - Fallback pastoral compassivo e teologicamente ancorado quando o dispositivo estiver offline ou em adoração silenciosa.
  - **Gateway Backend NestJS (`backend/src/mobile/`):**
    - Módulo `MobileModule` com `MobileController` e `MobileService` registrado no `AppModule`.
    - Integração de alta fidelidade doutrinária com `AiService`, `PromptService` (persona maternal da MarIA) e `MagisteriumService` para subsídio teológico sob demanda.
  - **Qualidade, Testes & Build:**
    - Suíte de testes expandida para 18 testes aprovados com 100% de sucesso (`chat_ai_test.dart`, `liturgy_saint_test.dart`, `rosary_conscience_test.dart`, `widget_test.dart`).
    - Análise estática do Flutter com 0 issues (`flutter analyze`).
    - Build de produção do backend (`nest build`) compilado com sucesso.
    - Build do APK Android gerado com sucesso (`build\app\outputs\flutter-apk\app-debug.apk`).

## [1.24.0] - 2026-10-12

### Added

- **MarIA Mobile — Fase 2 Concluída (Experiência Sacra Imersiva, Terço Háptico & Modos de Leitura):**
  - **Santo Terço Interativo (`features/prayers/presentation/rosary_page.dart`):**
    - Contador tátil de contas contemplativo com detecção automática do mistério do dia da semana (Gozosos, Dolorosos, Gloriosos, Luminosos) e troca manual.
    - Feedback háptico tátil a cada Ave-Maria (`lightImpact`), nas dezenas (`mediumImpact`) e na conclusão (`heavyImpact`), permitindo que o fiel reze de olhos fechados.
    - Meditação do mistério, virtudes associadas e barra de progresso visual (1 a 50 contas).
  - **Exame de Consciência Noturno Estruturado (`features/prayers/presentation/conscience_exam_page.dart`):**
    - Roteiro guiado em 4 passos: 1) Presença de Deus & Gratidão, 2) Luz do Espírito Santo, 3) Revisão dos atos do dia com perguntas compassivas, 4) Ato de Contrição e Resolução Prática.
    - Persistência da resolução espiritual pessoal no dispositivo com total sigilo (`SharedPreferences`).
  - **Modos de Contraste e Leitura na Liturgia (`features/liturgy/presentation/liturgy_page.dart`):**
    - Novo seletor de contraste na AppBar permitindo alternar entre **Modo Padrão**, **Modo Sepia (Pergaminho)** e **Modo Capela Noturna (OLED preto absoluto)** para leitura em ambientes escuros e adoração.
  - **Integração de Atalhos Rápidos:**
    - `QuickActionsGrid` da Home e banners de destaque em `PrayersPage` conectados para abrir diretamente o Santo Terço e o Exame Noturno.
  - **Qualidade & Testes:**
    - Novos testes de widget em `rosary_conscience_test.dart` aprovados com 100% de sucesso (totalizando 14 testes passando).
    - Compilação do APK de debug bem-sucedida (`app-debug.apk`).

## [1.23.0] - 2026-10-12

### Added

- **MarIA Mobile — Fase 1 Concluída (Liturgia Anual, Santo do Dia & Orações Reais):**
  - **Liturgia Diária Dinâmica (`features/liturgy/`):**
    - Integração de rede (`ApiClient` com Dio) consumindo a API Litúrgica oficial (`liturgia.up.railway.app/v2/`).
    - Cache local offline-first com `SharedPreferences` por chave de data (`LiturgyLocalDataSource`).
    - Navegação anual completa: permite avançar, recuar e navegar livremente por qualquer data do ano via `showDatePicker` e botão de retorno rápido "Hoje".
    - `LiturgyPage` redesenhada com abas adaptáveis (1ª Leitura, Salmo com refrão destacado, 2ª Leitura quando houver e Evangelho), seletor de tamanho de fonte e skeleton Shimmer.
  - **Santo do Dia Dinâmico (`features/saint_of_day/`):**
    - Calendário de santos católicos e memórias litúrgicas com dados de biografia, virtude e orações de intercessão, com suporte 100% offline.
    - Card de destaque da `HomePage` e modal BottomSheet atualizados para exibir os santos reais do dia.
  - **Catálogo de Orações Enriquecido (`features/prayers/`):**
    - Adição de barra de pesquisa instantânea para busca por nome ou trecho de oração.
    - Inclusão de orações essenciais: Oração a São Miguel Arcanjo, Angelus, Consagração a Nossa Senhora, Lembrai-vos (Memorare), Alma de Cristo, Santo Anjo e Terço da Divina Misericórdia.
  - **Qualidade & Testes:**
    - Testes unitários para `DateFormatterHelper`, `LiturgicalColorHelper`, `SaintDataSource` e `LiturgyModel` aprovados com 100% de sucesso.
    - APK de debug compilado e verificado sem erros (`app-debug.apk`).

## [1.22.2] - 2026-10-12

### Added

- **MarIA Mobile — Roadmap Estratégico & Ecossistema Híbrido (`docs/ROADMAP_MOBILE.md`):**
  - Definição do plano de evolução em 6 fases cronológicas, priorizando a testabilidade integral imediata (adiamento da autenticação para etapa final).
  - Mapeamento das capacidades exclusivas do aplicativo nativo frente ao WhatsApp (Modo Offline em Capela, Santo Terço com feedback háptico, Leitor Litúrgico com modos de contraste e ajuste tipográfico, Lembretes com badaladas sacras, Navegação Litúrgica anual e Biometria).
  - Estratégia de integração com a API Litúrgica oficial para carregamento dinâmico de qualquer dia do ano.

## [1.22.1] - 2026-10-05

### Changed

- **MarIA Mobile — Rebranding Visual de Cores Oficial da Logo:**
  - **Paleta de Cores (`AppColors`):**
    - Substituição do azul marinho escuro pelo **Azul Cobalto Mariano Oficial (`#0047AB`)**, idêntico à logo da MarIA e às plataformas web/landing.
    - Adição do **Azul Sagrado Profundo (`#002D6E`)** e **Azul Noturno Celestial (`#001B44`)** para títulos, contraste e degradês nobres.
    - Substituição do tom dourado ocre/queimado pelo **Ouro Real Radiante (`#D4AF37`)**, com realces celestiais nas 12 estrelas da coroa (`#FDE68A`) e halo radiante.
    - Atualização do fundo para superfície suavemente celeste (`#F4F7FC`) com bordas delicadas (`#E1EAF5`).
  - **Componentes do Santuário e Navegação:**
    - `DailyLiturgicalHeader`: Saudação "SALVE MARIA" em ouro radiante com marcador luminoso e título "Santuário MarIA" com destaque nobre em degradê/cobalto.
    - `SaintHeroCard`: Badge e halo do Santo do Dia em ouro luminoso, citações em superfície azulada celeste e botão de oração com estilo pílula em azul cobalto.
    - `SpiritualHabitsRow`: Marcadores de hábitos concluídos e badge de progresso padronizados no Azul Cobalto Mariano (`#0047AB`).
    - `LiturgySummaryCard`: Acentos, ícones e botões de leitura completa adaptados ao azul cobalto oficial.
    - `ChatPage`: Balões de mensagem do devoto em Azul Cobalto Mariano com tipografia branca nítida.
    - `NavigationBar`: Destaques ativos e ícone selecionado padronizados em Azul Cobalto Mariano.
  - **Testes & Qualidade:**
    - `widget_test.dart` atualizado e aprovado com 100% de sucesso.
    - `flutter analyze` validado com 0 avisos e 0 erros.

## [1.22.0] - 2026-10-05

### Added

- **MarIA Mobile — Santuário Digital Católico (Milestone 1 / Flutter):**
  - **Inicialização do Projeto e Arquitetura:**
    - Projeto Flutter 3.47+ configurado sob o identificador `com.acutistech.maria_app` no diretório `mobile/`.
    - Adoção do padrão arquitetural **Clean Architecture + Feature-First** desacoplado, com injeção de dependência e gerenciamento de estado via **Flutter Riverpod 3.x** e roteamento declarativo com **GoRouter**.
  - **Design System Sacro e Mariana (`lib/core/theme/`):**
    - **`AppColors`:** Paleta litúrgica e nobre com Azul Mariano Profundo (`#0A192F`), Ouro Sacro (`#C5A059`), Marfim Litúrgico e suporte a cores litúrgicas dinâmicas (Verde do Tempo Comum, Roxo Penitencial, Vermelho de Mártires, Branco Pascal e Rosa).
    - **`AppTypography`:** Tipografia nobre com títulos sacros em *Cinzel* e corpo de leitura de alta legibilidade em *Plus Jakarta Sans* via Google Fonts.
    - **`AppTheme`:** Temas completos Claro (Santuário Diurno) e Escuro (Capela Noturna de Oração) com CardThemeData e NavigationBarThemeData personalizados.
  - **App Shell & Navegação Sacra (`lib/core/router/`):**
    - `AppScaffold` com barra de navegação inferior fluida baseada em `IndexedStack` e ícones `lucide_icons_flutter` para as 5 áreas centrais:
      - 🏠 **Santuário (Hoje)**
      - 📖 **Liturgia Diária**
      - 📿 **Orações & Terço**
      - 🕊️ **MarIA (Chat Devocional)**
      - ⚙️ **Ajustes & Perfil**
  - **Módulo Santuário / Home (`lib/features/home/`):**
    - `DailyLiturgicalHeader`: Saudação "Salve Maria", data por extenso e badge do Tempo Litúrgico com cor sacra do dia.
    - `SaintHeroCard`: Card do Santo do Dia com nome, título, virtude inspiradora, citação célebre e modal de oração de intercessão.
    - `SpiritualHabitsRow`: Checklist interativo do Plano de Vida Espiritual (Oferecimento da Manhã, Angelus, Santo Terço e Exame Guiado) com contagem de progresso em tempo real.
    - `LiturgySummaryCard`: Evangelho do Dia com destaque tipográfico nobre, botão de leitura das leituras completas e ação de escuta em áudio.
    - `QuickActionsGrid`: Atalhos rápidos em grade com Santo Terço, Exame de Consciência, Diálogo com a MarIA e Entrega de Intenções de Oração.
  - **Módulos Complementares Funcionais:**
    - `LiturgyPage`: Leitor litúrgico completo com abas (1ª Leitura, Salmo Responsorial, Evangelho e Reflexão) e ajuste dinâmico de tamanho de fonte.
    - `PrayersPage`: Catálogo de orações fundamentais (Pai Nosso, Ave Maria, Salve Rainha, Credo, Mistérios do Rosário e Ato de Contrição) em cards sanfonados com diálogo de leitura.
    - `ChatPage`: Interface de diálogo e acolhimento com a MarIA AI, com banner de sigilo espiritual e privacidade.
    - `SettingsPage`: Gerenciamento de perfil, alternância dinâmica de tema (Claro / Escuro / Sistema) via Riverpod e switches de lembretes devocionais.
  - **Qualidade & Testes:**
    - `widget_test.dart`: Teste de inicialização e renderização do `MariaApp` com `ProviderScope` aprovado com 100% de sucesso.
    - Análise estática com `flutter analyze` sem qualquer erro, aviso ou depreciação (`No issues found!`).

## [1.21.0] - 2026-09-26

### Added

- **Expiração Automática e Silenciosa de Fluxos Inativos (Auto-Reset por Inatividade):**
  - **Prevenção de Travamento de Fiéis no WhatsApp:** Usuários que iniciam fluxos interativos (Criação de Lembretes, Exame de Consciência Guiado ou Fluxo de Assinatura/Planos) e abandonam a conversa sem finalizar ou cancelar não ficam mais bloqueados no bot.
  - **Cancelamento Silencioso (Zero Spam):** A expiração ocorre sem envio de notificações desnecessárias no WhatsApp, respeitando o silêncio do usuário. Ao retornar à conversa, o fiel tem seu estado automaticamente liberado e sua mensagem é processada naturalmente pela IA.
  - **Camada Dupla de Segurança (Sob Demanda + CRON em Segundo Plano):**
    - **Verificação Sob Demanda no `AiService`:** Ao receber uma nova mensagem, se o tempo decorrido desde a última interação no fluxo ultrapassar o limite, o estado é imediatamente resetado para `idle`/`active` antes de processar o novo texto.
    - **Rotina em Segundo Plano no `CronService` (`cleanupInactiveFlows`):** Executa periodicamente a cada 2 minutos para limpar silenciosamente usuários inativos e registrar a volumetria no `SystemLogsService`.
  - **Tempo Limite Configurável no Painel Administrativo:**
    - Nova chave `flow_inactivity_timeout_minutes` na tabela `system_settings` (padrão de 15 minutos).
    - Novo card **"Fluxos & Sessões Interativas"** na tela de **Configurações** (`/settings`) do painel web, permitindo aos administradores customizar o tempo de inatividade em minutos.
  - **Migration SQL (`docs/migrations/20260926_flow_inactivity_timeout.sql`):** Adiciona a coluna `flow_updated_at` na tabela `users` com índice parcial para otimizar a varredura de fluxos ativos.

## [1.20.3] - 2026-09-24

### Added

- **Instrumentação e Cobertura Contínua de Logs em Segundo Plano:**
  - **Mensagens Enviadas (Sucesso/Falha):** Registro persistente no `UazapiService` para todos os disparos de texto e mensagens interativas (botões e listas), capturando status HTTP, latência, previews e causas de erro.
  - **Ações de Negócio Relevantes:** Registro de ativações de assinaturas via código (`ActivationCode`), cancelamentos e reagendamentos de lembretes devocionais.
  - **Rotinas de Servidor em Segundo Plano (CRONs):** Instrumentação de `CronService` (sincronização de câmbio USD/BRL, limpeza de registros e expurgo) e `ScheduledMessagesService` (disparos de campanhas agendadas em lote).
  - **Webhooks de Entrada e Saída:** Monitoramento ponta a ponta em `UazapiController` (mensagens recebidas e processamento de IA) e `AsaasService` (confirmação de pagamentos, cobranças e cancelamentos no gateway).

## [1.20.2] - 2026-09-24


### Added

- **Tabela de Logs e Incidentes Persistentes (`system_logs`):**
  - Criação da tabela `system_logs` no Supabase com índices por data, nível de severidade e fonte, imune à perda de registros por reinicialização de contêineres Docker.
  - Implementação do módulo global `SystemLogsModule` e do serviço `SystemLogsService` no NestJS, capturando erros, avisos e eventos críticos de forma fail-safe.
  - Adição de endpoint `GET /panel/logs/system` no backend com suporte a paginação e filtros por nível e origem.
  - Nova aba **"Erros e Incidentes"** no painel administrativo web (`/logs`) com visualização em tempo real, badges de criticidade, contadores de erros e modal de inspeção profunda com stack trace e metadados JSON.

### Fixed

- **Motor de Auto-Cura e Reconciliação de Lembretes Diários:**
  - Criação do serviço `RemindersService` com reconciliação automática na inicialização da aplicação (`OnApplicationBootstrap`) e Watchdog CRON a cada 5 minutos (`handleWatchdogCron`).
  - Lembretes pendentes que perderam o agendamento em memória durante paradas ou reinicializações de contêineres são detectados e re-enfileirados no BullMQ automaticamente.
  - Lembretes com horários passados são avançados para o próximo ciclo diário válido no fuso horário de Brasília sem quebrar a cadeia de recorrência.
  - Ativação da persistência AOF (`--appendonly yes`) no serviço Redis do `docker-compose.yml` para proteger a integridade de filas de jobs atrasados (delayed jobs).
  - Configuração de políticas de retry (3 tentativas com backoff exponencial) e retenção no BullMQ para tolerância a oscilações temporárias de conexão com a API Uazapi.

## [1.20.1] - 2026-09-24


### Changed

- **Estruturação do Repositório Mobile Dedicado:**
  - Configuração da pasta `/mobile/` na raiz do ecossistema MarIA como um sub-repositório Git independente para o aplicativo Flutter.
  - Adição de `/mobile/` e `/MarIA-App/` ao `.gitignore` da raiz, garantindo isolamento total de versionamento, histórico de commits e pipelines de CI/CD para lojas de aplicativos móveis.

## [1.20.0] - 2026-09-19


### Added

- **Recorrência Diária & Ciclo Contínuo de Lembretes:**
  - O processador de lembretes (`RemindersProcessor`) agora re-agenda automaticamente o próximo disparo diário para o mesmo horário configurado (24h depois), mantendo o lembrete ativo em ciclo contínuo até ação contrária do usuário.
  - O registro no Supabase permanece em `status: 'pending'` com `scheduled_time` atualizado para o próximo dia no fuso horário de Brasília (`America/Sao_Paulo`).
- **Botão Interativo de Cancelamento (`🔕 Cancelar Lembrete`):**
  - Cada disparo de lembrete via WhatsApp passa a ser acompanhado por um botão nativo de cancelamento interativo com ID único (`cancel_reminder_${reminderId}`).
- **Soft Delete de Lembretes:**
  - Ao clicar no botão de cancelamento (ou digitar comandos como "cancelar lembrete"), o sistema realiza **soft delete**, marcando o status como `'cancelled'` e atualizando `updated_at`.
  - O agendamento futuro no BullMQ/Redis é removido imediatamente, e o processador ignora com segurança qualquer disparo pendente.
  - O fiel recebe uma confirmação acolhedora e maternal da MarIA confirmando que o aviso diário foi cancelado.
- **CRON de Limpeza Automática (30 Dias):**
  - Implementada rotina agendada diária às 03:00 da madrugada (`cleanupOldCancelledReminders` em `CronService`) que expurga permanentemente do Supabase os lembretes inativos (`status = 'cancelled'`) com mais de 30 dias de inatividade (`updated_at < NOW() - 30 days`).
- **Coluna `updated_at` na Tabela `reminders`:**
  - Adicionada coluna `updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()` na tabela `reminders` do Supabase para rastreamento do tempo de cancelamento e expurgo pela CRON.
- **Exclusividade para Assinantes:**
  - O agendamento de lembretes diários foi restrito apenas a usuários com assinatura ativa (qualquer plano exceto o gratuito), aprimorando os benefícios para quem apoia o projeto financeiramente.

## [1.19.0] - 2026-09-19

### Added

- **Sistema de Ferramentas e Ações Dinâmicas nos Nós (`Node Tools`):**
  - **Catálogo de Ferramentas Plug-and-Play (`AVAILABLE_NODE_TOOLS`):** Implementado ecossistema modular para conectar ferramentas de banco de dados, integrações e ações inteligentes aos nós dos fluxos automáticos.
  - **Ferramenta Catálogo de Orações (`prayer_list`):** A etapa `reminder_prayer_select` agora exibe formalmente sua integração com a tabela `prayers`, gerando Menu de Lista nativo no WhatsApp em tempo real sem depender de botões manuais engessados.
  - **Expansão para Todos os Fluxos do Sistema:**
    - `conscience_exam_flow` (`step_confession`): Conectada a ferramenta **Foco Diário do Exame de Consciência (`guided_exam_focus`)**, que injeta o exame do dia da semana em `{{foco_diario}}`.
    - `liturgy_flow` (`choose_format`): Conectada a ferramenta **Liturgia Diária (`liturgy_fetch`)**, buscando leituras da CNBB em versões Resumida ou Completa.
    - `subscription_flow` (`select_plan`): Conectada a ferramenta **Tabela de Preços & Cupons Asaas (`asaas_pricing`)**, calculando valores dinâmicos de planos e cupons.
    - `welcome_flow` (`ask_daily_liturgy`): Conectada a ferramenta **Preferência de Envio Diário (`user_preference_toggle`)**, gravando opt-in de liturgia matinal no Supabase.
  - **Visualização no Mapa Mental & Diagrama:**
    - Cards com ferramentas ativas agora exibem badge temático com ícone de ferramenta (`⚡ Ferramenta: [Nome da Ferramenta]`).
    - Rodapé dinâmico do card indica o tipo de lista ou integração conectada.
  - **Painel de Ferramentas no Workspace do Nó:**
    - Nova seção destacada com card gradiente apresentando status da ferramenta conectada, descrição de funcionamento e dicas técnicas.
    - Botão **"+ Adicionar Ferramenta"** com Modal de Diálogo interativo permitindo conectar, trocar ou desconectar ferramentas de qualquer nó com 1 clique.
  - **Preview Aprimorado do WhatsApp:** Exibição do botão de lista dinâmico simulado no WhatsApp quando a ferramenta de orações está ativa, substituindo mensagens enganosas de "nenhum botão configurado".

## [1.18.1] - 2026-09-19

### Changed

- **Atribuição Automática de Rota (`target_step`) na Criação de Botões (`flows.tsx`):**
  - Ajustada a lógica de criação de novos botões (tanto no final quanto na inserção em índice específico) para herdar inteligentemente uma rota destino.
  - O destino padrão (`target_step`) agora é inferido pela rota da etapa atual (`next_step`), pelo destino de um botão já existente na etapa, ou, em último caso, o ID da própria etapa (`stepKey`). Isso evita a criação de botões "órfãos" sem um fluxo de destino claro.

## [1.18.0] - 2026-09-19
### Added

- **Motor Interpretador de Fluxos (`FlowInterpreterService`):**
  - Implementado motor dinâmico e flexível no backend (`flow-interpreter.service.ts`) para interpretar e executar fluxos automáticos orientados a dados (*data-driven state machine*).
  - Eliminação de dependência frágil de strings fixas (`if (lowerMsg === '1')`). As transições entre etapas agora são guiadas diretamente pelos metadados configurados no banco de dados (`target_step`, `next_step`).
  - Suporte à resolução flexível por ID, texto ou índice de botão com fallback para saídas universais (`cancelar`, `sair`, `parar`).
  - Formatação inteligente de mensagens interativas: se a etapa possuir até 3 opções, despacha botões rápidos nativos; se possuir 4 ou mais opções, despacha Menu de Lista nativo com gaveta interativa.

- **Reordenação com Drag & Drop e Setas Rápidas de Opções (`flows.tsx`):**
  - Adicionado suporte a **Arrastar e Soltar (HTML5 Drag and Drop)** para reordenar os botões/opções interativas com handle de pegada visual (`GripVertical`), feedback em tempo real e destaque na área de soltura.
  - Adicionados botões de atalho de movimentação instantânea com 1 clique (`◀` / `▶`) no cabeçalho de cada card de opção para ajustes rápidos.
  - Novos atalhos de inserção: **"+ Inserir no Início"** (para adicionar facilmente horários matutinos como `06:00` antes de `07:00`) e **"+ Adicionar no Fim"**.
  - Campo de configuração de **Destino / Rota (`target_step`)** em cada botão para customização de ramificações diretamente pela interface.

- **Enriquecimento Estrutural do Banco de Dados (`automatic_flows`):**
  - Backup preventivo completo de todos os registros salvo em `backend/backups/automatic_flows_backup_2026-09-19.json` (zero perda de dados).
  - Enriquecimento não-destrutivo dos 6 fluxos existentes no Supabase com `title`, `type` (`decision`, `options`, `input`, `message`, `end`) e `target_step` em todos os nós.

## [1.17.3] - 2026-09-19

### Added

- **Menu Lateral Colapsável (`sidebar.tsx` & `main-layout.tsx`):**
  - Implementado botão de recolher/expandir o menu lateral tanto no cabeçalho superior quanto na barra lateral.
  - No estado recolhido, a sidebar reduz para `78px` em modo ícone compacto, liberando mais de 180px de largura útil para diagramas e edição.
  - Persistência automática do estado do menu no `localStorage` (`maria_sidebar_collapsed`).

- **Isolamento de Scroll e Navegação no Canvas de Fluxos (`flows.tsx`):**
  - **Eliminação do Scroll Horizontal Global:** A página administrativa não cria mais barras de rolagem horizontal no nível do navegador/janela (`overflow-x-hidden` e `min-w-0`).
  - **Quadro de Diagrama com Rolagem Própria:** A rolagem horizontal fica restrita e contida 100% dentro do quadro do mapa mental, utilizando uma scrollbar elegante (`.canvas-scrollbar`).
  - **Controles de Navegação no Canvas:** Adicionados botões no cabeçalho do diagrama (`↺ Início`, `◀ Esquerda`, `▶ Direita`) para deslizamento suave e fácil entre as etapas do mapa.
  - **Cards Compactos no Diagrama:** Redimensionamento refinado dos nós para `min-w-[210px] max-w-[245px]`, permitindo visualizar mais nós simultaneamente na tela.
  - **Seletor de Fluxos Colapsável:** Adicionado botão de recolher no card "Fluxos do Sistema", permitindo ocultar a grade de fluxos e focar inteiramente no diagrama ativo.

## [1.17.2] - 2026-09-19

### Added

- **Suporte Nativo a Menus de Opções / Listas no WhatsApp (`type: "list"`):**
  - Adicionada interface `InteractiveOptions` no `uazapi.service.ts` com suporte completo ao endpoint `/send/menu` no modo `type: "list"` do Uazapi.
  - Quando uma etapa interativa possui mais de 3 botões (limite da API do WhatsApp para botões rápidos) ou especifica o tipo `list`, o sistema envia automaticamente um menu de lista com botão de ação (ex: *"Ver opções"* ou *"Ver Orações"*), seções organizadas e descrições opcionais.
  - Implementado envio de lista suspensa nativa do WhatsApp para seleção de orações (`reminder_prayer_select`) com abertura de drawer direto no aplicativo do usuário.

- **Visualização em Mapa Mental e Diagrama Interativo de Fluxos (`flows.tsx`):**
  - Substituição da coluna vertical engessada por um canvas de **Mapa Mental / Diagrama de Fluxo** com nós visuais, setas direcionais e bifurcações de rota (`Rota: Oração` e `Rota: Personalizado`).
  - Cada nó exibe badge de rota, status de botões/menu de lista, título da etapa e resumo do texto.
  - O nó em edição recebe anel de destaque com pulso dinâmico; ao clicar em qualquer nó do diagrama, a etapa correspondente é imediatamente carregada no workspace de edição.
  - Seletor horizontal de fluxos no topo da tela com badges de quantidade de etapas e status ativo.

### Fixed

- **Envio de Botões de Horário no Fluxo de Lembretes:**
  - Corrigido o problema onde os botões de horário não eram despachados após o usuário escolher o turno (Manhã, Tarde ou Noite). O `ai.service.ts` agora busca tanto os nós específicos por período (`reminder_time_morning`, `reminder_time_afternoon`, `reminder_time_night`) quanto o nó universal `reminder_time`.
  - Adicionado fallback dinâmico de botões por período para garantir que o fiel nunca fique sem botões interativos na tela.
  - Otimizado o método `extractTargetTime` com reconhecimento instantâneo via regex para cliques diretos de botões de horário (ex: "07:00", "12:00", "8h"), eliminando latência e dependência desnecessária do LLM.

## [1.17.1] - 2026-09-19

### Changed

- **Refatoração do Fluxo de Lembretes:**
  - **Unificação do Nó de Horário:** Os nós redundantes de horário (`reminder_time_morning`, `reminder_time_afternoon`, `reminder_time_night`) foram consolidados em um único nó dinâmico (`reminder_time`) na máquina de estados da inteligência artificial (`ai.service.ts`). O turno escolhido pelo fiel é capturado independentemente da quantidade de opções.
  - **Painel Administrativo Otimizado:** A exibição dos passos do fluxo de lembretes no editor visual (`flows.tsx`) foi refatorada. Agora as bifurcações (Rota: Oração e Rota: Personalizado) são agrupadas visualmente com identação e marcadores de cores, melhorando a compreensão e manutenção do fluxo.
  - **Remoção de Limitação de Botões no WhatsApp:** Removido o `.slice(0, 3)` fixo no gateway do UAZAPI (`uazapi.service.ts`). Caso o administrador configure 4 ou mais opções em uma etapa (ex: horários variados), o sistema agora cai automaticamente em um fallback híbrido estruturado, enviando a pergunta como texto listado (1️⃣, 2️⃣, 3️⃣, 4️⃣) para burlar a limitação de 3 botões interativos da API do WhatsApp.

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
