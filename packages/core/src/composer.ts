import type { ComposerConfig, ComposerController, ComposerPlugin } from './types'
import { createComposerEngine } from './engine'

export function createComposer(
  element: HTMLElement,
  config: ComposerConfig = {},
): ComposerController {
  const engine = createComposerEngine(element, config)
  const plugins: ComposerPlugin[] = []

  function use(plugin: ComposerPlugin) {
    plugins.push(plugin)
    plugin.onInit?.(controller)
  }

  // Wrap submit to run plugin hooks
  async function submit() {
    const state = engine.getState()
    if (state.isSubmitting) return
    await engine.submit()
  }

  function destroy() {
    plugins.forEach((p) => p.onDestroy?.())
    engine.destroy()
  }

  const controller: ComposerController = {
    getState: engine.getState,
    subscribe: engine.subscribe,
    insertText: engine.insertText,
    insertMention: engine.insertMention,
    insertCodeBlock: engine.insertCodeBlock,
    attachFile: engine.attachFile,
    removeAttachment: engine.removeAttachment,
    uploadAttachment: engine.uploadAttachment,
    clear: engine.clear,
    submit,
    openMention: engine.openMention,
    closeMention: engine.closeMention,
    updateMentionQuery: engine.updateMentionQuery,
    use,
    destroy,
  }

  return controller
}
