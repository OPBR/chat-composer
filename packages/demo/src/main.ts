import { createComposer, type MentionItem } from '@chat-composer/core'

const inputEl = document.getElementById('input') as HTMLElement
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement
const attachBtn = document.getElementById('attach-btn') as HTMLButtonElement
const fileInput = document.getElementById('file-input') as HTMLInputElement
const outputEl = document.getElementById('output') as HTMLElement
const mentionDropdown = document.getElementById('mention-dropdown') as HTMLElement

const MOCK_USERS: MentionItem[] = [
  { id: 'u1', label: '@Alice', description: 'Frontend Dev' },
  { id: 'u2', label: '@Bob', description: 'Backend Dev' },
  { id: 'u3', label: '@Charlie', description: 'Designer' },
  { id: 'u4', label: '@Diana', description: 'PM' },
]

function positionDropdown() {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) {
    mentionDropdown.style.display = 'none'
    return
  }
  const range = sel.getRangeAt(0).cloneRange()
  range.collapse(true)
  const rect = range.getBoundingClientRect()
  const inputRect = inputEl.getBoundingClientRect()
  mentionDropdown.style.display = 'block'
  mentionDropdown.style.position = 'absolute'
  mentionDropdown.style.left = `${rect.left}px`
  mentionDropdown.style.top = `${rect.bottom + 4}px`
}

function renderMentionDropdown(state: {
  isMentionOpen: boolean
  mentionItems: MentionItem[]
  mentionActiveIndex: number
}) {
  if (!state.isMentionOpen || state.mentionItems.length === 0) {
    mentionDropdown.style.display = 'none'
    return
  }

  positionDropdown()
  mentionDropdown.innerHTML = ''
  state.mentionItems.forEach((item, i) => {
    const div = document.createElement('div')
    div.className = 'mention-item' + (i === state.mentionActiveIndex ? ' mention-item-active' : '')
    div.innerHTML = `<span class="mention-item-label">${item.label}</span><span class="mention-item-desc">${item.description ?? ''}</span>`
    div.addEventListener('mousedown', (e) => {
      e.preventDefault()
      composer.insertMention(item)
      mentionDropdown.style.display = 'none'
    })
    mentionDropdown.appendChild(div)
  })
}

const composer = createComposer(inputEl, {
  mentionSource: MOCK_USERS,
  onSubmit: async (message) => {
    outputEl.textContent = JSON.stringify(message, null, 2)
    console.log('Submitted:', message)
  },
  onChange: (state) => {
    sendBtn.disabled = state.isEmpty || state.isSubmitting
    sendBtn.textContent = state.isSubmitting ? 'Sending…' : 'Send'
    renderMentionDropdown(state)
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

// Click image thumbnail → lightbox
inputEl.addEventListener('click', (e) => {
  const img = (e.target as HTMLElement).closest('.cc-node-image img') as HTMLImageElement | null
  if (!img) return
  e.preventDefault()

  const overlay = document.createElement('div')
  overlay.className = 'cc-lightbox'
  const fullImg = document.createElement('img')
  fullImg.src = img.src
  overlay.appendChild(fullImg)
  overlay.addEventListener('click', () => overlay.remove())
  document.body.appendChild(overlay)
})
