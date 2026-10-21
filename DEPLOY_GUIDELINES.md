# 🚀 Guia de Deploy Automatizado (Instruções para Agentes de IA & Operadores)

> **Destinatário:** Este documento foi estruturado para ser lido, interpretado e executado autonomamente por agentes de inteligência artificial (ex: Gemini, Claude Code, Cursor, Copilot) ou engenheiros de DevOps no servidor de produção (VPS / Cloud) da plataforma **MarIA**.

---

## 🗺️ 1. Arquitetura e Mapeamento de Rotas

O ecossistema **MarIA** opera em containers Docker orquestrados via `docker-compose.yml`. O container `frontend` roda um **Nginx Alpine** que serve como API Gateway e Reverse Proxy central para o domínio `maria.acutistech.com.br`:

| Rota Externa | Tipo de Serviço | Destino Interno / Caminho Físico | Observações Críticas |
| :--- | :--- | :--- | :--- |
| **`/`** | Landing Page (Next.js) | `http://landing:3000` | SSR / Site institucional e checkout. |
| **`/admin`** | Painel Web (Vite + React) | `/usr/share/nginx/html/admin` | SPA de gestão administrativa e afiliados. |
| **`/mobile`** | App Web (Flutter Web) | `/usr/share/nginx/html/mobile` | PWA/Web mobile com base-href `/mobile/`. |
| **`/api/`** | Backend Gateway (NestJS) | `http://backend:3000` | Rewrite automático (`^/api/(.*) -> /$1`). |
| **`/webhook/`** | Webhooks (Asaas / Meta) | `http://backend:3000/webhook/` | Notificações de pagamento e mensagens. |

---

## 📋 2. Pré-requisitos do Servidor

1. **Docker & Docker Compose**: V2 instalado e operacional (`docker compose version`).
2. **Portas Alocadas**:
   - `8081` (ou `80/443` via reverse proxy externo Cloudflare / Nginx Host / Traefik) -> container `frontend`.
   - `3002` -> container `backend`.
   - `3003` -> container `landing`.
   - `6379` -> container `redis`.
3. **Arquivo de Variáveis de Ambiente**:
   - `backend/.env` deve existir com as credenciais do banco de dados (Supabase/PostgreSQL), Redis, Asaas, JWT, SMTP e OpenAI.

---

## ⚙️ 3. Procedimento Passo a Passo de Deploy

A IA ou operador deve executar os seguintes passos em sequência a partir da raiz do repositório:

### Passo 1: Atualizar o Repositório Git
```bash
git fetch origin main
git pull origin main
```

---

### Passo 2: Compilar o Aplicativo Flutter Web (`/mobile`)
O container Nginx necessita dos arquivos estáticos compilados em `mobile/build/web`.

#### Opção A (Se o host VPS possui Flutter instalado):
```bash
cd mobile
flutter pub get
flutter build web --base-href "/mobile/" --release
cd ..
```

#### Opção B (Se o host NÃO possui Flutter instalado - Via Container Temporário):
> 💡 *A IA pode rodar este comando caso o binário `flutter` não esteja disponível no PATH do host:*
```bash
docker run --rm -v "$(pwd)/mobile:/app" -w /app ghcr.io/cirruslabs/flutter:stable sh -c "flutter pub get && flutter build web --base-href '/mobile/' --release"
```

#### Opção C (Se o artefato foi compilado localmente/CI e transferido via SCP/Rsync):
Assegure que os arquivos estejam presentes em:
`./mobile/build/web/index.html`

---

### Passo 3: Reconstruir e Subir os Containers Docker
Execute a reconstrução dos containers para incorporar novos códigos, dependências e assets web:

```bash
docker compose up --build -d
```

Caso queira rebuildar apenas o serviço que foi alterado:
- Se mudou apenas frontend/mobile: `docker compose up --build -d frontend`
- Se mudou apenas backend: `docker compose up --build -d backend`
- Se mudou apenas landing: `docker compose up --build -d landing`

---

### Passo 4: Executar Migrações do Banco de Dados (Se aplicável)
Se houver novas migrações Prisma ou entidades no Backend:
```bash
docker compose exec backend npx prisma migrate deploy
```
*(Ou comando correspondente caso use TypeORM / Supabase CLI).*

---

## 🔍 4. Verificação Pós-Deploy (Checklist Automatizado para a IA)

A IA deve rodar os seguintes comandos de verificação de integridade e validar as respostas HTTP:

### 1. Verificar Status dos Containers:
```bash
docker compose ps
```
*Critério de Sucesso:* Todos os serviços (`backend`, `redis`, `frontend`, `landing`) devem estar com status `Up` ou `running`.

### 2. Testar Endpoint da Landing Page:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/
```
*Critério de Sucesso:* Código HTTP `200` ou `308`/`307`.

### 3. Testar Endpoint do Painel Admin:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/admin/
```
*Critério de Sucesso:* Código HTTP `200`.

### 4. Testar Endpoint do Flutter Web (`/mobile`):
```bash
curl -s http://localhost:8081/mobile/ | grep -i '<base href="/mobile/">'
```
*Critério de Sucesso:* Retorna a tag `<base href="/mobile/">` com código HTTP `200`.

### 5. Testar Endpoint da API Backend através do Nginx:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/mobile/daily-content
```
*Critério de Sucesso:* Código HTTP `200` (JSON com liturgia e santo do dia).

---

## ⚠️ 5. Regras Críticas e Armadilhas Evitadas

1. **Base Href Obrigatório:**
   - O Flutter Web **NUNCA** pode ser compilado sem `--base-href "/mobile/"`. Sem isso, o roteador e os scripts (`flutter_bootstrap.js`, `main.dart.js`, fontes e ícones) tentarão ser carregados da raiz `/`, quebrando a aplicação e colidindo com a Landing Page.
2. **Nginx Alias vs Root:**
   - O bloco `/mobile` utiliza diretiva `alias /usr/share/nginx/html/mobile;` combinada com `try_files $uri $uri/ /mobile/index.html;`. Não altere para `root`, pois a estrutura de pastas do container causaria erro 404.
3. **Resolução de API no Navegador (`AppConfig`):**
   - O Flutter Web detecta automaticamente se está rodando no navegador (`kIsWeb`) e utiliza a URL relativa `${Uri.base.origin}/api`. Isso elimina problemas de CORS, dispensa portas abertas adicionais e funciona em qualquer domínio/SSL.
4. **Notificações e Biometria no Navegador:**
   - Recursos nativos de sistema como `flutter_local_notifications` e `Platform.environment` possuem guards `if (kIsWeb) return;` no Dart para não disparar exceções de runtime no navegador.

---

## 🔄 6. Procedimento de Rollback de Emergência

Caso ocorra falha crítica pós-deploy:
```bash
# 1. Voltar o commit anterior
git log -n 5 --oneline
git checkout <COMMIT_HASH_ANTERIOR>

# 2. Reconstruir os containers com o estado estável
docker compose up --build -d

# 3. Validar se os serviços voltaram ao normal
docker compose ps
```
