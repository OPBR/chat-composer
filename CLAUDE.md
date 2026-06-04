# CLAUDE.md — chat-composer

## 项目概述

chat-composer 是一个轻量级 AI 聊天富文本输入框组件库。核心用纯 contentEditable 实现，框架无关，React/Vue 为薄适配层。

## 技术栈

- TypeScript 5.8+ / Node 22 LTS / pnpm 9+
- 构建工具: tsup / 任务编排: Turborepo
- 测试: Vitest (jsdom environment)
- 代码规范: ESLint 9 (flat config) + Prettier
- 提交规范: Conventional Commits (commitlint + husky)
- 发布: Changesets + npm

## 常用命令

```bash
pnpm build          # 所有包构建
pnpm dev            # 所有包开发模式
pnpm test           # 所有包测试
pnpm lint           # ESLint 检查
pnpm typecheck      # TypeScript 类型检查
pnpm format         # Prettier 格式化
pnpm format:check   # Prettier 检查
```

## 项目结构

```
packages/core/    — @chat-composer/core (框架无关的 DOM engine)
packages/react/   — @chat-composer/react (React 适配层)
packages/vue/     — @chat-composer/vue (Vue 适配层)
packages/demo/    — 本地验证 demo (Vite)
```

## 核心架构

- **core 直接管理 DOM**: 接收 contentEditable HTMLElement，接管所有事件和 DOM 操作
- **React/Vue 不重新渲染 contentEditable 内部** (uncontrolled 模式)
- **附件/图片嵌入 contentEditable 内部**: 用 `contenteditable="false"` 的 `<span>` 包裹，`data-cc-type` 标识类型，`data-cc-id` 唯一标识
- **Backspace/Delete 删除附件**: 和删除普通字符一样的操作逻辑
- **两阶段提交**: composer 只产出 ComposedMessage，上传由上层决定
- **行内缩略图**: 图片和文字在同一行流动
- **IME 处理**: compositionstart/end 标记屏蔽特殊处理

## 代码风格

- 不写注释（除非 WHY 不明显）
- 文件单一职责，小文件优先
- 测试先行（TDD）对有逻辑的模块
- ESLint + Prettier 通过 husky pre-commit 自动执行

## Git 规范

- Phase 0 后所有改动通过分支 + PR
- 分支命名: `feat/xxx` / `fix/xxx` / `chore/xxx` / `docs/xxx`
- Squash merge 到 main
- 每个 PR 必须通过 CI
