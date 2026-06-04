import { ref, readonly, onUnmounted, type Ref } from 'vue'
import { createComposer } from '@chat-composer/core'
import type { ComposerConfig, ComposerController, ComposerState } from '@chat-composer/core'

export type UseComposerReturn = {
  state: Readonly<Ref<ComposerState>>
  composer: ComposerController
}

/**
 * Primary composable for chat-composer in Vue 3.
 *
 * @example
 * const { state, composer } = useComposer({
 *   mentionSource: myUsers,
 *   onSubmit: async (msg) => await sendToAI(msg),
 * })
 */
export function useComposer(config: ComposerConfig = {}): UseComposerReturn {
  const composer = createComposer(config)
  const state = ref<ComposerState>(composer.getState())

  const unsubscribe = composer.subscribe((newState) => {
    state.value = newState
  })

  onUnmounted(() => {
    unsubscribe()
    composer.destroy()
  })

  return {
    state: readonly(state),
    composer,
  }
}
