# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
