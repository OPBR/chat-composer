# chat-composer

**The missing input component for AI apps.**

Framework-agnostic composer with first-class support for @mentions, code block detection, image paste, and file attachments — outputs structured JSON ready for any AI API.

```
npm install @chat-composer/core
npm install @chat-composer/react   # React 18+
npm install @chat-composer/vue     # Vue 3
```

---

## Why chat-composer?

Every team building an AI product re-implements the same input box. Existing rich-text editors (Tiptap, Lexical) are designed for documents — not for structured AI messages. chat-composer is built specifically for this use case:

- **Output is structured, not HTML** — get `{ text, mentions, codeBlocks, images, files }` directly
- **Zero dependencies** in core — drop into any stack
- **Framework wrappers** for React and Vue — same API, same behavior
- **Plug-in system** — extend without forking

---

## Quick start (React)

```tsx
import { useComposer } from '@chat-composer/react'

const TEAM = [
  { id: '1', label: 'Alice', description: 'Design' },
  { id: '2', label: 'Bob', description: 'Engineering' },
]

export function ChatInput() {
  const { state, composer } = useComposer({
    placeholder: 'Ask anything, @ to mention…',
    mentionSource: TEAM,
    onSubmit: async (message) => {
      // message.text       → plain text with @mentions inlined
      // message.mentions   → [{ id, label }]
      // message.codeBlocks → [{ language, code }]
      // message.images     → [{ file, mimeType }]
      // message.files      → [{ file, name }]
      await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify(message),
      })
    },
  })

  return (
    <div>
      <div
        contentEditable
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            composer.submit()
          }
        }}
      />
      <button onClick={() => composer.submit()} disabled={state.isEmpty}>
        Send
      </button>
    </div>
  )
}
```

---

## Quick start (Vue 3)

```vue
<script setup lang="ts">
import { useComposer } from '@chat-composer/vue'

const { state, composer } = useComposer({
  mentionSource: [
    { id: '1', label: 'Alice' },
    { id: '2', label: 'Bob' },
  ],
  onSubmit: async (message) => {
    await sendToAI(message)
  },
})
</script>

<template>
  <div contenteditable="true" @keydown.enter.exact.prevent="composer.submit()" />
  <button :disabled="state.isEmpty" @click="composer.submit()">Send</button>
</template>
```

---

## Core API (framework-agnostic)

```ts
import { createComposer } from '@chat-composer/core'

const composer = createComposer({
  mentionSource: async (query) => fetchUsers(query),
  attachments: {
    accept: ['image/*', 'application/pdf'],
    maxFileSizeBytes: 5 * 1024 * 1024,
  },
  onSubmit: (message) => console.log(message),
})

// Programmatic control
composer.insertText('Hello')
composer.insertMention({ id: '1', label: 'Alice' })
composer.insertCodeBlock('console.log("hi")', 'javascript')
composer.attachFile(file)
composer.submit()
composer.clear()

// Subscribe to state changes
const unsubscribe = composer.subscribe((state) => {
  console.log(state.isEmpty, state.parts)
})
```

---

## Output format

```ts
type ComposedMessage = {
  // Structured parts — use this for full control
  parts: MessagePart[]

  // Convenience fields
  text: string // plain text, mentions inlined as "@Label"
  mentions: MentionPart[]
  codeBlocks: CodeBlockPart[]
  images: ImagePart[] // includes File + object URL
  files: FilePart[]
}
```

---

## Plugin system

```ts
import type { ComposerPlugin } from '@chat-composer/core'

const wordCountPlugin: ComposerPlugin = {
  name: 'word-count',
  onBeforeSubmit(message) {
    if (message.text.split(' ').length > 500) {
      alert('Message too long')
      return false // cancel submission
    }
    return message
  },
}

composer.use(wordCountPlugin)
```

---

## Packages

| Package                | Description                   | Size    |
| ---------------------- | ----------------------------- | ------- |
| `@chat-composer/core`  | Framework-agnostic controller | ~5KB gz |
| `@chat-composer/react` | React 18+ hooks               | ~2KB gz |
| `@chat-composer/vue`   | Vue 3 composable              | ~1KB gz |

---

## Roadmap

- [ ] Slash commands (`/` trigger)
- [ ] Drag-and-drop file upload
- [ ] Voice input (Web Speech API)
- [ ] `@chat-composer/solid` — SolidJS wrapper
- [ ] `@chat-composer/svelte` — Svelte wrapper

---

## License

MIT
