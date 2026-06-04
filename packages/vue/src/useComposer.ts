import { shallowRef, onUnmounted, type Ref } from 'vue'
import { createComposer } from '@chat-composer/core'
import type { ComposerConfig, ComposerController, ComposerState } from '@chat-composer/core'

export type UseComposerReturn = {
  state: Ref<ComposerState>
  composer: ComposerController
}

export function useComposer(config: ComposerConfig = {}): UseComposerReturn {
  const composer = createComposer(config)
  const state = shallowRef<ComposerState>(composer.getState())

  const unsubscribe = composer.subscribe((newState) => {
    state.value = newState
  })

  onUnmounted(() => {
    unsubscribe()
    composer.destroy()
  })

  return {
    state,
    composer,
  }
}
