---
'@chat-composer/core': major
'@chat-composer/react': major
'@chat-composer/vue': major
---

feat: complete Phase 1 — core engine rewrite + React/Vue adapter components

- Core engine: DOM management, IME tracking, attachment manager, mention dropdown state machine, paste handling, plugin system
- React adapter: useComposer hook + ComposerInput, MentionDropdown, AttachmentList components
- Vue adapter: useComposer composable + ComposerInput, MentionDropdown, AttachmentList SFCs with scoped CSS
- Breaking: `createComposer(element, config)` now requires a contentEditable HTMLElement as first argument
