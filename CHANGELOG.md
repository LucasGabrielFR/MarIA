# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Arquivo `.gitignore` configurado com padrões para Node.js, Vite, logs e exclusão do diretório `.agent`.

## [1.1.0] - 2026-04-29

### Added
- Painel de **Analytics** no Admin para monitoramento de tokens e custos.
- Interface de gerenciamento de **Usuários** focada em triagem e créditos.
- **N8n Integration API**: Novos endpoints para consulta/criação de usuários e log de uso via n8n.
- Tabela `usage_logs` no banco de dados para rastreio de telemetria de IA.

### Changed
- Arquitetura migrada para **Single-Instance** (uma IA para todos).
- Delegada a automação de WhatsApp e lógica de LLM para o **n8n**.
- Backend refatorado para atuar como orquestrador de dados e painel administrativo.
- `schema.sql` simplificado, removendo suporte a multi-instâncias locais e flow builder interno.

### Removed
- `whatsapp_instances` e `automation_flows` (substituídos pelo n8n).
- Serviços redundantes de integração direta com LLM e WhatsApp no backend (`whatsapp.service`, `magisterium.service`, `router.service`).
- Antigo `MessageHandler` e rota de webhook direta da UAZAPI.

## [1.0.0] - 2026-04-28

### Added
- Arquivo `PROPOSTA_MARIA.md` contendo a proposta de negócio inicial da IA Maternal Católica.
- `README.md` com a visão geral do projeto.
- `CHANGELOG.md` para rastreamento de alterações.
- Arquivo `.env` com as chaves necessárias para integração (Supabase, OpenRouter, Magisterium, uazapi).
- Implementação do backend Node.js (Express + TypeScript) em `src/server.ts`.
- Sistema de Webhook para uazapi e gerenciamento multi-instância.
- Roteamento de intenções inteligente via MiniMax M2.5 (OpenRouter).
- Fluxo de triagem para novos usuários (Nome e Expectativas).
- Integração com Supabase para Chat History, Orações e Liturgia.
- Skeleton para Magisterium API (Aconselhamento Teológico).
- **Dashboard Admin (Frontend):** Projeto standalone usando Vite + React + Tailwind CSS v4 para gerenciamento do MarIA.
- Interface de gerenciamento de Múltiplas Instâncias de WhatsApp integradas a UAZAPI.
- Integração do `@acutis/flow-react` para permitir a construção visual de fluxos de automação customizados por instância.
- Endpoints REST `/api/instances` e `/api/instances/:id/flows` para suportar o painel administrativo.
- Atualização do `schema.sql` para suportar `whatsapp_instances` dinâmicas e `automation_flows`.
