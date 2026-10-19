# Plano de Implementação: Plano de Vida Espiritual Personalizado (Offline-First & Sincronizado)

## 📌 Visão Geral & Objetivo
Desenvolver uma experiência devocional exclusiva e personalizada no aplicativo móvel **MarIA Mobile**, unificando o **cumprimento diário de práticas espirituais (disciplina/hábitos)** com **lembretes pontuais de oração (no dispositivo e/ou no WhatsApp)**.

A funcionalidade operará sob a arquitetura **Offline-First**:
- O fiel pode consultar, marcar orações e configurar horários sem depender de conexão com a internet.
- Assim que o dispositivo estiver online, o plano é sincronizado com a nuvem (Supabase via backend NestJS), permitindo a ponte de lembretes devocionais pelo WhatsApp nos horários selecionados.

---

## 📱 Tipo de Projeto & Escopo
- **Tipo de Projeto:** Mobile App (Flutter) + Backend Gateway (NestJS) + Supabase (PostgreSQL).
- **Modelo Padrão Inicial:** **Plano Mariano Completo** (6 momentos essenciais: Oferecimento da Manhã, Liturgia & Evangelho, Angelus, Terço da Misericórdia, Santo Terço, Exame de Consciência).
- **Personalização Permitida:**
  - Adicionar práticas a partir de um catálogo clássico ou criação livre.
  - Excluir ou reordenar momentos devocionais.
  - Customizar horários individuais (`HH:mm`).
  - Ativar/desativar lembretes no smartphone (som de sino sacro) e/ou no WhatsApp da MarIA.

---

## 🎯 Critérios de Sucesso (Definition of Done)
1. **Experiência Visual & Hábito:** O fiel visualiza seu progresso do dia no Santuário (Home) e gerencia os momentos na tela "Meu Plano de Vida", agrupados por turnos (Manhã, Meio-dia, Tarde, Noite).
2. **Personalização Total:** Permite adicionar novos hábitos, editar horários via `TimePicker`, excluir itens e alternar o canal de notificação (Celular e WhatsApp).
3. **Resiliência Offline-First:** O app funciona perfeitamente sem internet (cache local via `SharedPreferences`), enfileirando alterações para sincronização silenciosa ao reconectar.
4. **Ponte com Backend & WhatsApp:** Endpoints `GET` e `PUT /mobile/spiritual-plan` persistindo o plano no Supabase e atualizando os agendamentos de WhatsApp para os hábitos marcados com `notifyOnWhatsApp: true`.
5. **Estabilidade & Qualidade:** 100% dos testes unitários/widget passando (`flutter test`), `flutter analyze` com 0 erros, sem regressão visual.

---

## 🛠️ Stack Tecnológica & Decisões Arquiteturais
- **Mobile (Frontend):** Flutter 3.47+ / Dart 3.13+, Flutter Riverpod 3.x (AsyncNotifier), Lucide Icons, SharedPreferences (Local Cache).
- **Backend (API):** NestJS, Supabase Client, BullMQ/Redis (fila de agendamento de lembretes).
- **Banco de Dados (Supabase):** Tabela `user_spiritual_plans` (com RLS) e integração com a tabela `reminders`.
- **Design System:** Paleta Sacra Oficial (Azul Cobalto `#0047AB`, Ouro Real `#D4AF37`, Azul Noturno `#001B44`, Fundo Celeste `#F4F7FC`), Tipografia *Cinzel* e *Plus Jakarta Sans*.

---

## 📂 Estrutura de Arquivos

```
mobile/lib/features/spiritual_plan/
├── domain/
│   ├── entities/
│   │   ├── spiritual_habit_entity.dart        # [Refatorado] Modelo unificado com lembretes e canais
│   │   └── default_spiritual_plans.dart       # Catálogo Mariano Completo + Sugestões da Tradição
│   └── repositories/
│       └── spiritual_plan_repository.dart     # Contrato com suporte Offline-First
├── data/
│   ├── datasources/
│   │   ├── spiritual_plan_local_data_source.dart   # SharedPreferences (Cache offline instantâneo)
│   │   └── spiritual_plan_remote_data_source.dart  # Cliente HTTP Dio comunicando com /mobile/spiritual-plan
│   └── repositories/
│       └── spiritual_plan_repository_impl.dart     # Estratégia de sync (Local-First + Background Sync)
└── presentation/
    ├── controllers/
    │   └── spiritual_plan_controller.dart          # Riverpod AsyncNotifier com persistência e sync
    ├── spiritual_plan_page.dart                    # Tela completa com agrupamento por turnos e gestão
    └── widgets/
        ├── habit_card_item.dart                    # Card nobre do hábito com toggle de lembrete e horário
        ├── add_habit_bottom_sheet.dart             # Modal de criação (Catálogo vs. Livre)
        └── habit_progress_header.dart              # Progresso e streak diário

backend/src/mobile/
├── mobile.controller.ts                            # Novos endpoints GET e PUT /mobile/spiritual-plan
├── mobile.service.ts                               # Lógica de sincronização e agendamento de lembretes
└── dto/
    └── spiritual-plan.dto.ts                       # DTOs de validação do payload

docs/migrations/
└── 20261014000000_create_user_spiritual_plans.sql  # Tabela no Supabase para persistência na nuvem
```

---

## 📋 Detalhamento de Tarefas (Task Breakdown)

### Fase 1: Domínio & Catálogo Modelo Mariano Completo
- **Task 1.1:** Evoluir `SpiritualHabitEntity` para conter:
  - `time` (`HH:mm`), `period` (`morning`, `midday`, `afternoon`, `night`)
  - `reminderEnabled` (bool), `notifyOnDevice` (bool), `notifyOnWhatsApp` (bool), `soundType` (string)
  - `isCustom` (bool), `orderIndex` (int), `updatedAt` (DateTime)
  - *Agent:* `mobile-developer` | *Skill:* `clean-code`
  - *INPUT:* Modelo atual `spiritual_habit_entity.dart`
  - *OUTPUT:* Entidade completa com métodos `toJson`, `fromJson`, `copyWith`
  - *VERIFY:* Testes unitários de serialização passando sem erros.

- **Task 1.2:** Criar catálogo `default_spiritual_plans.dart` com os 6 momentos do **Plano Mariano Completo** e lista de sugestões devocionais clássicas (Visita ao Santíssimo, Lectio Divina, Oração a São Miguel, etc.).
  - *Agent:* `mobile-developer` | *Skill:* `clean-code`

---

### Fase 2: Banco de Dados Supabase & Backend NestJS
- **Task 2.1:** Criar migration `docs/migrations/20261014000000_create_user_spiritual_plans.sql`:
  - Tabela `user_spiritual_plans` (`id`, `user_id`, `habits` JSONB, `streak_days`, `updated_at`).
  - *Agent:* `backend-specialist` | *Skill:* `database-design`
  - *VERIFY:* Script SQL compatível com Supabase e com RLS configurada.

- **Task 2.2:** Implementar no Backend (`mobile.controller.ts` e `mobile.service.ts`):
  - `GET /mobile/spiritual-plan`: retorna o plano salvo na nuvem ou modelo padrão caso novo.
  - `PUT /mobile/spiritual-plan`: salva o plano, sincroniza preferências e agenda os lembretes diários no BullMQ para os hábitos com `notifyOnWhatsApp = true`.
  - *Agent:* `backend-specialist` | *Skill:* `api-patterns`
  - *VERIFY:* Rebuild do container `maria-backend-1` e validação com `curl`.

---

### Fase 3: Camada de Dados Offline-First no Flutter
- **Task 3.1:** Implementar `SpiritualPlanLocalDataSource` aprimorado para salvar tanto os hábitos cumpridos do dia quanto o modelo personalizado ("template ativo") do fiel em `SharedPreferences`.
  - *Agent:* `mobile-developer` | *Skill:* `clean-code`

- **Task 3.2:** Implementar `SpiritualPlanRemoteDataSource` com Dio para sincronização bidirecional.
  - *Agent:* `mobile-developer` | *Skill:* `clean-code`

- **Task 3.3:** Implementar `SpiritualPlanRepositoryImpl` garantindo o fluxo:
  - Leitura imediata do cache local (0 delay na UI).
  - Tentativa silenciosa de sincronização com o backend se houver internet.
  - Resolução de conflitos pelo `updatedAt` mais recente.
  - *Agent:* `mobile-developer` | *Skill:* `clean-code`

---

### Fase 4: Interface de Gestão e Personalização (UI/UX)
- **Task 4.1:** Refatorar `SpiritualPlanPage`:
  - Seções por Turnos Litúrgicos (🌅 Manhã, ☀️ Meio-dia, 🕒 Tarde, 🌙 Noite).
  - Badges informativos: Indicador se a notificação do celular está ativa e se o WhatsApp está ativado.
  - Ajuste rápido de horário com `TimePicker` sacro.
  - *Agent:* `mobile-developer` | *Skill:* `frontend-design`

- **Task 4.2:** Criar modal `AddHabitBottomSheet`:
  - Aba 1: Sugestões devocionais clássicas da Igreja (adicionar com 1 toque).
  - Aba 2: Hábito livre personalizado (campo de texto, turno, horário e canais de lembrete).
  - *Agent:* `mobile-developer` | *Skill:* `mobile-design`

- **Task 4.3:** Atualizar `SpiritualHabitsRow` na Home:
  - Refletir dinamicamente a nova lista customizada de hábitos do dia, contador e link para a personalização.
  - *Agent:* `mobile-developer` | *Skill:* `clean-code`

---

### Fase 5: Validação, Testes & Documentação (Fase X)
- **Task 5.1:** Atualizar os testes unitários e de widgets (`test/widget_test.dart` e novos testes de plano de vida).
- **Task 5.2:** Executar `flutter analyze` e atestar 0 warnings.
- **Task 5.3:** Build Web para validação em navegador (`flutter build web`) e compilação do APK nativo para certificar integridade mobile.
- **Task 5.4:** Atualizar `CHANGELOG.md` e `docs/ROADMAP_MOBILE.md`.
