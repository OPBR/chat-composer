# @chat-composer/react

## 1.0.0

### Major Changes

- 105b8a0: feat: complete Phase 1 — core engine rewrite + React/Vue adapter components
  - Core engine: DOM management, IME tracking, attachment manager, mention dropdown state machine, paste handling, plugin system
  - React adapter: useComposer hook + ComposerInput, MentionDropdown, AttachmentList components
  - Vue adapter: useComposer composable + ComposerInput, MentionDropdown, AttachmentList SFCs with scoped CSS
  - Breaking: `createComposer(element, config)` now requires a contentEditable HTMLElement as first argument

### Patch Changes

- Updated dependencies [105b8a0]
  - @chat-composer/core@1.0.0

## 0.1.2

### Patch Changes

- 63e4b95: Verify CD pipeline after fixing NPM_TOKEN auth
- Updated dependencies [63e4b95]
  - @chat-composer/core@0.1.2

## 0.1.1

### Patch Changes

- b03eb29: Initial scaffold release to verify CD pipeline
- Updated dependencies [b03eb29]
  - @chat-composer/core@0.1.1
