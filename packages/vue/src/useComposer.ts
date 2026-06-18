import { shallowRef, onUnmounted, type Ref } from 'vue'
import { createComposer } from '@chat-composer/core'
import type { ComposerConfig, ComposerController, ComposerState } from '@chat-composer/core'

export type UseComposerReturn = {
  state: Ref<ComposerState>
  composer: ComposerController
  inputRef: Ref<HTMLElement | null>
  initComposer: (el: HTMLElement) => void
}

export function useComposer(config: ComposerConfig = {}): UseComposerReturn {
  const inputRef = shallowRef<HTMLElement | null>(null)
  const composerRef = shallowRef<ComposerController | null>(null)
  const state = shallowRef<ComposerState>({
    parts: [],
    attachments: [],
    isComposing: false,
    isMentionOpen: false,
    mentionQuery: '',
    mentionItems: [],
    mentionActiveIndex: 0,
    isSubmitting: false,
    isEmpty: true,
  })

  function initComposer(el: HTMLElement) {
    if (composerRef.value) return
    inputRef.value = el
    const composer = createComposer(el, config)
    composerRef.value = composer
    state.value = composer.getState()
    composer.subscribe((newState) => {
      state.value = newState
    })
  }

  onUnmounted(() => {
    if (composerRef.value) {
      composerRef.value.destroy()
      composerRef.value = null
    }
  })

  return {
    state,
    composer: composerRef.value!,
    inputRef,
    initComposer,
  }
}
