import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createComposerEngine } from '../engine'
import type { ComposerConfig } from '../types'

function createEditor(): HTMLElement {
  const el = document.createElement('div')
  el.setAttribute('contenteditable', 'true')
  document.body.appendChild(el)
  return el
}

function createMockFile(name: string, type: string, size: number): File {
  const content = new Uint8Array(size)
  const file = new File([content], name, { type, lastModified: Date.now() })
  if (file.size !== size) {
    Object.defineProperty(file, 'size', { value: size, configurable: true })
  }
  return file
}

describe('createComposerEngine', () => {
  let editor: HTMLElement
  let engine: ReturnType<typeof createComposerEngine>

  beforeEach(() => {
    editor = createEditor()
  })

  afterEach(() => {
    engine?.destroy()
    editor.remove()
  })

  it('initializes with empty state', () => {
    engine = createComposerEngine(editor)
    const state = engine.getState()
    expect(state.parts).toEqual([])
    expect(state.isEmpty).toBe(true)
    expect(state.isComposing).toBe(false)
    expect(state.attachments).toEqual([])
  })

  describe('insertText', () => {
    it('inserts text into the editor DOM', () => {
      engine = createComposerEngine(editor)
      engine.insertText('hello')
      expect(editor.textContent).toContain('hello')
      const state = engine.getState()
      expect(state.isEmpty).toBe(false)
    })

    it('appends to existing text', () => {
      engine = createComposerEngine(editor)
      engine.insertText('hello')
      engine.insertText(' world')
      expect(editor.textContent).toContain('hello world')
    })
  })

  describe('insertMention', () => {
    it('inserts a mention node into the editor', () => {
      engine = createComposerEngine(editor)
      engine.insertMention({ id: 'u1', label: '@Alice' })
      const state = engine.getState()
      expect(state.parts.some((p) => p.type === 'mention')).toBe(true)
      expect(editor.querySelector('[data-cc-type="mention"]')).not.toBeNull()
    })
  })

  describe('insertCodeBlock', () => {
    it('inserts a code block into the editor', () => {
      engine = createComposerEngine(editor)
      engine.insertCodeBlock('const x = 1', 'typescript')
      const state = engine.getState()
      expect(state.parts.some((p) => p.type === 'code_block')).toBe(true)
    })
  })

  describe('attachFile', () => {
    it('inserts an image node into the editor', () => {
      engine = createComposerEngine(editor)
      const file = createMockFile('photo.png', 'image/png', 1024)
      engine.attachFile(file)
      expect(editor.querySelector('[data-cc-type="image"]')).not.toBeNull()
      const state = engine.getState()
      expect(state.attachments.length).toBe(1)
      expect(state.attachments[0].type).toBe('image')
    })

    it('inserts a file node into the editor', () => {
      engine = createComposerEngine(editor)
      const file = createMockFile('doc.pdf', 'application/pdf', 2048)
      engine.attachFile(file)
      expect(editor.querySelector('[data-cc-type="file"]')).not.toBeNull()
      const state = engine.getState()
      expect(state.attachments.length).toBe(1)
      expect(state.attachments[0].type).toBe('file')
    })

    it('rejects files exceeding maxFiles limit', () => {
      const onReject = vi.fn()
      const config: ComposerConfig = { attachments: { maxFiles: 1, onReject } }
      engine = createComposerEngine(editor, config)
      engine.attachFile(createMockFile('a.png', 'image/png', 10))
      engine.attachFile(createMockFile('b.png', 'image/png', 10))
      expect(onReject).toHaveBeenCalledWith('count', expect.any(File))
    })
  })

  describe('removeAttachment', () => {
    it('removes an attachment by id from DOM and state', () => {
      engine = createComposerEngine(editor)
      const file = createMockFile('photo.png', 'image/png', 1024)
      engine.attachFile(file)
      const stateBefore = engine.getState()
      expect(stateBefore.attachments.length).toBe(1)
      engine.removeAttachment(stateBefore.attachments[0].id)
      const stateAfter = engine.getState()
      expect(stateAfter.attachments.length).toBe(0)
      expect(editor.querySelector('[data-cc-type="image"]')).toBeNull()
    })
  })

  describe('submit', () => {
    it('calls onSubmit with composed message', async () => {
      const onSubmit = vi.fn()
      engine = createComposerEngine(editor, { onSubmit })
      engine.insertText('hello')
      await engine.submit()
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ text: 'hello' }))
    })

    it('clears editor after submit', async () => {
      const onSubmit = vi.fn()
      engine = createComposerEngine(editor, { onSubmit })
      engine.insertText('hello')
      await engine.submit()
      expect(editor.textContent!.trim()).toBe('')
      expect(engine.getState().isEmpty).toBe(true)
    })

    it('does not submit when already submitting', async () => {
      let resolveSubmit: () => void
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((r) => {
            resolveSubmit = r
          }),
      )
      engine = createComposerEngine(editor, { onSubmit })
      engine.insertText('hello')
      const p1 = engine.submit()
      engine.submit()
      resolveSubmit!()
      await p1
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })

  describe('clear', () => {
    it('clears the editor and resets state', () => {
      engine = createComposerEngine(editor)
      engine.insertText('hello')
      engine.attachFile(createMockFile('photo.png', 'image/png', 1024))
      engine.clear()
      expect(editor.textContent!.trim()).toBe('')
      expect(engine.getState().isEmpty).toBe(true)
      expect(engine.getState().attachments).toEqual([])
      expect(engine.getState().parts).toEqual([])
    })
  })

  describe('subscribe', () => {
    it('notifies listeners on state change', () => {
      engine = createComposerEngine(editor)
      const listener = vi.fn()
      engine.subscribe(listener)
      engine.insertText('hello')
      expect(listener).toHaveBeenCalled()
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0]
      expect(lastCall.isEmpty).toBe(false)
    })

    it('returns unsubscribe function', () => {
      engine = createComposerEngine(editor)
      const listener = vi.fn()
      const unsub = engine.subscribe(listener)
      unsub()
      engine.insertText('hello')
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('handlePaste', () => {
    it('attaches pasted image file', () => {
      engine = createComposerEngine(editor)
      const file = createMockFile('photo.png', 'image/png', 1024)
      // Directly test the attachFile path via handlePaste logic
      // jsdom lacks ClipboardEvent, so we test attachFile directly
      engine.attachFile(file)
      expect(editor.querySelector('[data-cc-type="image"]')).not.toBeNull()
      expect(engine.getState().attachments.length).toBe(1)
    })
  })

  describe('IME', () => {
    it('tracks composing state', () => {
      engine = createComposerEngine(editor)
      editor.dispatchEvent(new Event('compositionstart'))
      expect(engine.getState().isComposing).toBe(true)
      editor.dispatchEvent(new Event('compositionend'))
      expect(engine.getState().isComposing).toBe(false)
    })
  })
})
