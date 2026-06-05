<!--
 * @Author: zhangy
 * @Date: 2026-06-04 15:02:34
-->

# CLAUDE.md — chat-composer

## Overview

chat-composer is a lightweight rich-text input component library for AI chat applications. Core uses pure contentEditable DOM management — framework-agnostic — with thin React/Vue adapter layers.

## Tech Stack

- TypeScript 6 / Node 22 LTS / pnpm 9+ (always use latest)
- Build: tsdown (Rolldown-based) / Task orchestration: Turborepo
- Test: Vitest 4 (jsdom environment)
- Lint: ESLint 10 (single-root flat config) + Prettier
- Commit convention: Conventional Commits (commitlint + husky + lint-staged)
- Publish: Changesets + npm

## Dependency Policy

Always use the latest stable versions when adding or upgrading dependencies. Run `pnpm outdated -r` to check, and prefer major version upgrades when available (as long as tests pass). Never pin to old versions unless there's a documented compatibility reason.

## Commands

```bash
pnpm build          # build all packages
pnpm dev            # dev mode for all packages
pnpm test           # run all tests
pnpm lint           # ESLint check
pnpm typecheck      # TypeScript type check
pnpm format         # Prettier format
pnpm format:check   # Prettier check
```

## Project Structure

```
packages/core/    — @chat-composer/core (framework-agnostic DOM engine)
packages/react/   — @chat-composer/react (React adapter)
packages/vue/     — @chat-composer/vue (Vue adapter)
packages/demo/    — local verification demo (Vite)
```

## Core Architecture

- **Core manages DOM directly**: receives a contentEditable HTMLElement, takes over all events and DOM operations
- **React/Vue do not re-render contentEditable internals** (uncontrolled pattern)
- **Attachments/images embedded inside contentEditable**: wrapped in `contenteditable="false"` `<span>` nodes with `data-cc-type` for type and `data-cc-id` for unique identity
- **Backspace/Delete removes attachments**: same UX as deleting a character
- **Two-stage submit**: composer only produces ComposedMessage; uploading is the upper layer's responsibility
- **Inline thumbnails**: images and text flow on the same line
- **IME handling**: compositionstart/end shields mention detection and Enter-submit

## ESLint Configuration

Single root `eslint.config.js` handles all packages using `files` glob patterns to apply per-package plugin rules (react-hooks for React, vue for Vue). No per-package eslint config files. Uses `projectService` with `allowDefaultProject` for monorepo tsconfig resolution.

## Code Style

- No comments unless WHY is non-obvious
- Single-responsibility files, prefer small files
- TDD for modules with real logic
- ESLint + Prettier enforced via husky pre-commit hook

## Git Conventions

- All changes after Phase 0 go through feature branches + PRs
- Branch naming: `feat/xxx` / `fix/xxx` / `chore/xxx` / `docs/xxx`
- Squash merge to main
- Every PR must pass CI (lint + typecheck + build + test)
