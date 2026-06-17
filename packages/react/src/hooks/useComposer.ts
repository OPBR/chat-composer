import { useEffect, useRef, useState } from 'react'
import { createComposer } from '@chat-composer/core'
import type { ComposerConfig, ComposerController, ComposerState } from '@chat-composer/core'

export type UseComposerReturn = {
  state: ComposerState
  composer: ComposerController
  inputRef: React.RefObject<HTMLDivElement | null>
}

export function useComposer(config: ComposerConfig = {}): UseComposerReturn {
  const inputRef = useRef<HTMLDivElement | null>(null)
  const composerRef = useRef<ComposerController | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  if (!composerRef.current && inputRef.current) {
    composerRef.current = createComposer(inputRef.current, {
      ...config,
      onSubmit: (msg) => configRef.current.onSubmit?.(msg),
      onChange: (state) => configRef.current.onChange?.(state),
    })
  }

  const [state, setState] = useState<ComposerState>(() =>
    composerRef.current
      ? composerRef.current.getState()
      : {
          parts: [],
          attachments: [],
          isComposing: false,
          isMentionOpen: false,
          mentionQuery: '',
          mentionItems: [],
          mentionActiveIndex: 0,
          isSubmitting: false,
          isEmpty: true,
        },
  )

  useEffect(() => {
    if (!inputRef.current) return
    const composer = createComposer(inputRef.current, {
      ...configRef.current,
      onSubmit: (msg) => configRef.current.onSubmit?.(msg),
      onChange: (state) => configRef.current.onChange?.(state),
    })
    composerRef.current = composer
    setState(composer.getState())

    const unsubscribe = composer.subscribe(setState)
    return () => {
      unsubscribe()
      composer.destroy()
      composerRef.current = null
    }
  }, [])

  return {
    state,
    composer: composerRef.current!,
    inputRef,
  }
}
