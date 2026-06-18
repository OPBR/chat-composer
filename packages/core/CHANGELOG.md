# @chat-composer/core

## 1.0.1

### Patch Changes

- 2265421: chore: improve package descriptions, keywords, and add LICENSE file

## 1.0.0

### Major Changes

- 105b8a0: feat: complete Phase 1 — core engine rewrite + React/Vue adapter components
  - Core engine: DOM management, IME tracking, attachment manager, mention dropdown state machine, paste handling, plugin system
  - React adapter: useComposer hook + ComposerInput, MentionDropdown, AttachmentList components
  - Vue adapter: useComposer composable + ComposerInput, MentionDropdown, AttachmentList SFCs with scoped CSS
  - Breaking: `createComposer(element, config)` now requires a contentEditable HTMLElement as first argument

## 0.1.2

### Patch Changes

- 63e4b95: Verify CD pipeline after fixing NPM_TOKEN auth

## 0.1.1

### Patch Changes

- b03eb29: Initial scaffold release to verify CD pipeline
