# Configuração de push remoto mobile

O aplicativo usa FCM para campanhas remotas; lembretes pessoais continuam sendo notificações locais. O fiel ativa o push em **Ajustes → Comunicação & Novidades**. Não existe mural dentro do app.

## 1. Firebase

O projeto Firebase Android está registrado como `maria-f8965`, com package `com.acutistech.maria_app`. O arquivo `mobile/android/app/google-services.json` e o plugin Gradle Google Services estão configurados. O Manifest também habilita o Firebase Installation ID usado pelo registro de campanhas. Se recriar o app no Firebase, substitua o JSON pelo arquivo do mesmo package.

Habilite Firebase Cloud Messaging e cadastre iOS e Web Apps quando esses destinos forem configurados.

- Android: configure o app Firebase e verifique as credenciais de FCM no projeto.
- iOS: habilite Push Notifications e Background Modes → Remote notifications no Xcode; carregue uma chave APNs válida em Firebase Console → Project Settings → Cloud Messaging.
- Web: gere uma chave pública Web Push (VAPID). O navegador exige HTTPS para push, exceto em `localhost`.

As opções públicas de cliente Android (`FIREBASE_API_KEY`, `FIREBASE_ANDROID_APP_ID`, `FIREBASE_PROJECT_ID`, `FIREBASE_MESSAGING_SENDER_ID` e `FIREBASE_STORAGE_BUCKET`) já estão preenchidas em `mobile/firebase_options.json`. Elas são incorporadas ao app compilado. Web ainda requer cadastro de Web App, VAPID e configuração de `mobile/web/push/firebase-messaging-sw.js`, que tem escopo isolado `/mobile/push/`. iOS também requer registro do app e configuração de APNs. Não coloque credenciais de service account neste arquivo. O cliente registra o FID (Firebase Installation ID), e o Admin SDK endereça as campanhas por FID.

O build padrão (`npm run build:mobile:web`) lê esse JSON. Para Android/iOS, use a mesma opção `--dart-define-from-file=firebase_options.json` na compilação Flutter.

## 2. Backend

Configure no `backend/.env` (local) ou no gerenciador de segredos do deploy:

- `FIREBASE_PROJECT_ID`: ID do projeto Firebase.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON da service account com permissão para enviar FCM. Mantenha como segredo; nunca versione nem registre no Segundo Cérebro.
- `PUBLIC_APP_URL`: origem HTTPS pública da aplicação, usada no clique de notificações Web (por exemplo `https://seu-dominio`).

Sem a service account, campanhas ficam registradas como `failed` e o Admin informa que o Firebase precisa ser configurado.

## 3. Supabase

Aplique manualmente `backend/docs/migrations/20261023010000_mobile_curation_and_push.sql` no projeto Supabase antes de publicar o Admin/API/App. As tabelas têm RLS ativo; o backend usa service role e o cliente não envia nem escolhe `user_id`.

## 4. Operação e privacidade

- O app solicita permissão ao ativar os avisos; o FID da instalação é associado ao perfil pela sessão Supabase validada no backend.
- Campanhas vão apenas para instalações ativas que deram opt-in. O sistema desativa tokens inválidos e registra contagens agregadas por campanha.
- Não envie informações pessoais, sacramentais ou de conversa nas notificações. Use mensagens gerais e breves.
- O cron do NestJS busca campanhas agendadas uma vez por minuto; timestamps são armazenados em UTC.

Referências oficiais: [configuração FCM para Flutter](https://firebase.google.com/docs/cloud-messaging/flutter/get-started), [recebimento no Flutter/Web](https://firebase.google.com/docs/cloud-messaging/flutter/receive-messages), [envio pelo Admin SDK](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk).
