import { describe, it, expect, beforeEach } from 'vitest'
import {
  normalizeDOM,
  createImageNode,
  createFileNode,
  createMentionNode,
  extractPartsFromDOM,
  isComposerNode,
} from '../dom'
import type { AttachmentPart, MentionPart } from '../types'

function createElement(tag: string, attrs?: Record<string, string>, text?: string): HTMLElement {
  const el = document.createElement(tag)
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
  if (text) el.textContent = text
  return el
}

describe('normalizeDOM', () => {
  let editor: HTMLElement

  beforeEach(() => {
    editor = document.createElement('div')
  })

  it('merges adjacent text nodes', () => {
    editor.appendChild(document.createTextNode('hel'))
    editor.appendChild(document.createTextNode('lo'))
    normalizeDOM(editor)
    expect(editor.childNodes.length).toBe(1)
    expect(editor.textContent).toBe('hello')
  })

  it('converts Chrome-style <div><br></div> to <br>', () => {
    const div = createElement('div')
    div.appendChild(createElement('br'))
    editor.appendChild(div)
    normalizeDOM(editor)
    expect(editor.innerHTML).toBe('<br>')
  })

  it('removes empty <span> elements', () => {
    editor.appendChild(createElement('span'))
    normalizeDOM(editor)
    expect(editor.childNodes.length).toBe(0)
  })

  it('keeps non-empty nodes intact', () => {
    editor.appendChild(createElement('span', {}, 'text'))
    normalizeDOM(editor)
    expect(editor.textContent).toBe('text')
  })

  it('preserves composer nodes (data-cc-type) even if empty-looking', () => {
    editor.appendChild(createElement('span', { 'data-cc-type': 'mention', 'data-cc-id': 'u1' }))
    normalizeDOM(editor)
    expect(editor.childNodes.length).toBe(1)
    expect((editor.firstChild as HTMLElement).getAttribute('data-cc-type')).toBe('mention')
  })
})

describe('createImageNode', () => {
  it('creates a span with correct attributes', () => {
    const node = createImageNode('img1', 'blob:http://example.com/x', 'photo.png')
    expect(node.tagName).toBe('SPAN')
    expect(node.getAttribute('contenteditable')).toBe('false')
    expect(node.getAttribute('data-cc-type')).toBe('image')
    expect(node.getAttribute('data-cc-id')).toBe('img1')
  })

  it('contains an img element with the src', () => {
    const node = createImageNode('img1', 'blob:http://example.com/x', 'photo.png')
    const img = node.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe('blob:http://example.com/x')
  })

  it('contains fileName display', () => {
    const node = createImageNode('img1', 'blob:http://example.com/x', 'photo.png')
    expect(node.textContent).toContain('photo.png')
  })
})

describe('createFileNode', () => {
  it('creates a span with correct attributes', () => {
    const node = createFileNode('f1', 'doc.pdf', 1024)
    expect(node.tagName).toBe('SPAN')
    expect(node.getAttribute('contenteditable')).toBe('false')
    expect(node.getAttribute('data-cc-type')).toBe('file')
    expect(node.getAttribute('data-cc-id')).toBe('f1')
  })

  it('contains file info display', () => {
    const node = createFileNode('f1', 'doc.pdf', 1024)
    expect(node.textContent).toContain('doc.pdf')
  })
})

describe('createMentionNode', () => {
  it('creates a span with correct attributes', () => {
    const node = createMentionNode('u1', '@Alice')
    expect(node.tagName).toBe('SPAN')
    expect(node.getAttribute('contenteditable')).toBe('false')
    expect(node.getAttribute('data-cc-type')).toBe('mention')
    expect(node.getAttribute('data-cc-id')).toBe('u1')
  })

  it('displays the label text', () => {
    const node = createMentionNode('u1', '@Alice')
    expect(node.textContent).toBe('@Alice')
  })
})

describe('isComposerNode', () => {
  it('returns true for nodes with data-cc-type', () => {
    const el = createElement('span', { 'data-cc-type': 'mention' })
    expect(isComposerNode(el)).toBe(true)
  })

  it('returns false for regular nodes', () => {
    const el = createElement('span')
    expect(isComposerNode(el)).toBe(false)
  })

  it('returns false for text nodes', () => {
    const text = document.createTextNode('hello')
    expect(isComposerNode(text)).toBe(false)
  })
})

describe('extractPartsFromDOM', () => {
  let editor: HTMLElement
  let attachmentsMap: Map<string, AttachmentPart>
  let mentionsMap: Map<string, MentionPart>

  beforeEach(() => {
    editor = document.createElement('div')
    attachmentsMap = new Map()
    mentionsMap = new Map()
  })

  it('extracts text from plain text nodes', () => {
    editor.textContent = 'hello world'
    normalizeDOM(editor)
    const parts = extractPartsFromDOM(editor, attachmentsMap, mentionsMap)
    expect(parts).toEqual([{ type: 'text', content: 'hello world' }])
  })

  it('extracts mention from composer node using mentionsMap', () => {
    mentionsMap.set('u1', { type: 'mention', id: 'u1', label: '@Alice' })
    editor.appendChild(
      createElement('span', { 'data-cc-type': 'mention', 'data-cc-id': 'u1' }, '@Alice'),
    )
    normalizeDOM(editor)
    const parts = extractPartsFromDOM(editor, attachmentsMap, mentionsMap)
    expect(parts).toEqual([{ type: 'mention', id: 'u1', label: '@Alice' }])
  })

  it('extracts attachment placeholder from composer node using attachmentsMap', () => {
    const imgPart: AttachmentPart = {
      type: 'image',
      id: 'img1',
      file: new File([], 'photo.png', { type: 'image/png' }),
      localUrl: 'blob:x',
      uploadStatus: 'local',
      fileName: 'photo.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
    }
    attachmentsMap.set('img1', imgPart)
    editor.appendChild(createElement('span', { 'data-cc-type': 'image', 'data-cc-id': 'img1' }))
    normalizeDOM(editor)
    const parts = extractPartsFromDOM(editor, attachmentsMap, mentionsMap)
    expect(parts).toEqual([imgPart])
  })

  it('combines text + mention + text', () => {
    mentionsMap.set('u1', { type: 'mention', id: 'u1', label: '@Alice' })
    editor.appendChild(document.createTextNode('hello '))
    editor.appendChild(
      createElement('span', { 'data-cc-type': 'mention', 'data-cc-id': 'u1' }, '@Alice'),
    )
    editor.appendChild(document.createTextNode(' world'))
    normalizeDOM(editor)
    const parts = extractPartsFromDOM(editor, attachmentsMap, mentionsMap)
    expect(parts).toEqual([
      { type: 'text', content: 'hello ' },
      { type: 'mention', id: 'u1', label: '@Alice' },
      { type: 'text', content: ' world' },
    ])
  })

  it('skips unknown composer nodes (not in maps)', () => {
    editor.appendChild(createElement('span', { 'data-cc-type': 'mention', 'data-cc-id': 'u99' }))
    normalizeDOM(editor)
    const parts = extractPartsFromDOM(editor, attachmentsMap, mentionsMap)
    expect(parts).toEqual([])
  })

  it('handles <br> as line breaks in text', () => {
    editor.appendChild(document.createTextNode('hello'))
    editor.appendChild(createElement('br'))
    editor.appendChild(document.createTextNode('world'))
    normalizeDOM(editor)
    const parts = extractPartsFromDOM(editor, attachmentsMap, mentionsMap)
    expect(parts).toEqual([{ type: 'text', content: 'hello\nworld' }])
  })
})
