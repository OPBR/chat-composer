/*
 * @Author: zhangy
 * @Date: 2026-06-08 21:40:09
 */
import { createComposer } from '@chat-composer/core'

const inputEl = document.getElementById('input') as HTMLElement
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement
const attachBtn = document.getElementById('attach-btn') as HTMLButtonElement
const fileInput = document.getElementById('file-input') as HTMLInputElement
const outputEl = document.getElementById('output') as HTMLElement

const composer = createComposer(inputEl, {
  onSubmit: async (message) => {
    outputEl.textContent = JSON.stringify(message, null, 2)
    console.log('Submitted:', message)
  },
  onChange: (state) => {
    sendBtn.disabled = state.isEmpty || state.isSubmitting
    sendBtn.textContent = state.isSubmitting ? 'Sending…' : 'Send'
  },
})

// Send
sendBtn.addEventListener('click', () => composer.submit())

// Extract (show current state without submitting)
extractBtn.addEventListener('click', () => {
  const state = composer.getState()
  outputEl.textContent = JSON.stringify(state, null, 2)
})

// Clear
clearBtn.addEventListener('click', () => composer.clear())

// Attach file
attachBtn.addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', () => {
  for (const file of Array.from(fileInput.files ?? [])) {
    composer.attachFile(file)
  }
  fileInput.value = ''
})
