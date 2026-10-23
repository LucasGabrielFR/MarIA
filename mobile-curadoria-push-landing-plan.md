# Plano — Curadoria Mobile, Push remoto e Landing Santuário Digital

## Escopo aprovado

- Push remoto para o aplicativo; sem mural/feed de comunicados.
- Central administrativa de Curadoria: destaques da Home e campanhas devocionais imediatas/agendadas.
- Landing reposicionada como Santuário Digital, apresentando recursos atuais do aplicativo com animação discreta e acessível.

## Etapas

1. [x] Criar migration Supabase para destaques, campanhas e instalações push; implementar registro autenticado e envio FCM agendado no backend.
2. [x] Integrar cadastro explícito de notificações no app, recebimento remoto e destaques dinâmicos na Home.
3. [x] Criar a central Curadoria no Admin com criação, ativação e agenda; consertar os atalhos da visão Mobile para não levar à gestão WhatsApp.
4. [x] Atualizar a Landing sem tocar no checkout, com identidade visual “Santuário Digital”, novos recursos mobile e animações respeitando `prefers-reduced-motion`.
5. [x] Atualizar README, CHANGELOG e o Segundo Cérebro; compilar app, executar verificações e reconstruir/validar Docker.

## Pré-requisitos externos

- Configurar Firebase Apps (Android, iOS e Web) e APNs/VAPID; fornecer opções públicas do Firebase na compilação Flutter.
- Configurar credencial de service account do Firebase Admin somente no segredo de ambiente do backend.
- Aplicar a migration SQL no projeto Supabase remoto. O Compose local não aplica migrations remotas automaticamente.

## Verificação

- Build/lint do backend, Admin e Landing; `flutter analyze` e build Flutter Web passaram.
- Docker Compose recriado e serviços em execução; `/`, `/admin/`, `/mobile/` e `/admin/mobile-curation` retornaram 200; `nginx -t` passou.
- Auditoria: dependências de produção do backend ainda possuem 7 vulnerabilidades (1 crítica, 4 altas, 1 moderada, 1 baixa), pendentes de triagem compatível.
- Teste real de push requer Firebase/APNs/VAPID configurados e aparelho/navegador com permissão.
