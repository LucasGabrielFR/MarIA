# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-08

### Added
- Página de Login com Split Layout premium e estética sacra/digital.
- Página de Gestão de Usuários com tabela de administradores e modal de convite.
- Integração com `react-router-dom` para navegação entre páginas.
- Novos componentes shadcn/ui: Input, Dialog, Table, DropdownMenu e Sonner.
- Configuração de orquestração na raiz com `package.json` e `concurrently`.
- Scripts de inicialização rápida: `dev.bat` e `dev.ps1` para rodar Front e Back simultaneamente.

- Scaffold do Frontend utilizando Vite + React + TypeScript.
- Integração com Tailwind CSS v4 e shadcn/ui.
- Implementação do Dashboard Administrativo com design premium "Mariano" (Azul Cobalto e Ouro).
- Componentes de Dashboard: Stats Cards, Tabela de Conversas Recentes e Saúde do Sistema.
- Logo premium gerada via IA para a marca MarIA.
- Configuração de alias de caminhos (`@/*`) e helpers de utilitários (`cn`).

### Changed
- Refatoração do `backend` para utilizar o SDK oficial do Supabase em vez do Prisma.
- Atualização do `action-plan.md` para refletir a nova estrutura de fases.

### Fixed
- Correção de conflitos de dependências no frontend com @base-ui/react.
- Ajuste de mapeamento de cores HSL no Tailwind 4.
