import { useEffect, useRef, useState, useCallback } from 'react'
import { createComposer } from '@chat-composer/core'
import type { ComposerConfig, ComposerController, ComposerState } from '@chat-composer/core'

export type UseComposerReturn = {
  state: ComposerState
  composer: ComposerController
}

/**
 * Primary hook for chat-composer in React.
 *
 * @example
 * const { state, composer } = useComposer({
 *   mentionSource: myUsers,
 *   onSubmit: async (msg) => await sendToAI(msg),
 * })
 */
export function useComposer(config: ComposerConfig = {}): UseComposerReturn {
  // Stable ref — recreate composer only on mount/unmount
  const composerRef = useRef<ComposerController | null>(null)
  // Keep config in a ref so callbacks always see latest values
  const configRef = useRef(config)
  configRef.current = config

  if (!composerRef.current) {
    composerRef.current = createComposer({
      ...config,
      // Wrap callbacks so they always call the latest version
      onSubmit: (msg) => configRef.current.onSubmit?.(msg),
      onChange: (state) => configRef.current.onChange?.(state),
    })
  }

  const [state, setState] = useState<ComposerState>(() => composerRef.current!.getState())

  useEffect(() => {
    const composer = composerRef.current!
    const unsubscribe = composer.subscribe(setState)
    return () => {
      unsubscribe()
      composer.destroy()
      composerRef.current = null
    }
  }, [])

  return {
    state,
    composer: composerRef.current,
  }
}

/**
 * Convenience hook that wires up keyboard and paste handlers
 * for a contentEditable element.
 */
export function useComposerInput(composer: ComposerController) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const state = composer.getState()

      // Mention navigation
      if (state.isMentionOpen) {
        if (e.key === 'Escape') {
          e.preventDefault()
          composer.closeMention()
        }
        return
      }

      // Submit on Enter (not Shift+Enter)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        composer.submit()
      }
    },
    [composer],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      // Cast to native ClipboardEvent — compatible
      ;(composer as any).handlePaste(e.nativeEvent)
    },
    [composer],
  )

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const text = (e.currentTarget as HTMLDivElement).innerText
      // Check for mention trigger
      const triggerIdx = text.lastIndexOf('@')
      if (triggerIdx !== -1) {
        const query = text.slice(triggerIdx + 1)
        if (!query.includes(' ')) {
          composer.openMention(query)
          return
        }
      }
      composer.closeMention()
    },
    [composer],
  )

  return { handleKeyDown, handlePaste, handleInput }
}
