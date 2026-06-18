export function createIMETracker() {
  let composing = false

  return {
    isComposing: () => composing,
    start: () => {
      composing = true
    },
    end: () => {
      composing = false
    },
  }
}
