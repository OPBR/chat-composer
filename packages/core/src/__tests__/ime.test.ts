import { describe, it, expect } from 'vitest'
import { createIMETracker } from '../ime'

describe('createIMETracker', () => {
  it('starts with isComposing false', () => {
    const ime = createIMETracker()
    expect(ime.isComposing()).toBe(false)
  })

  it('sets isComposing to true on start', () => {
    const ime = createIMETracker()
    ime.start()
    expect(ime.isComposing()).toBe(true)
  })

  it('sets isComposing to false on end', () => {
    const ime = createIMETracker()
    ime.start()
    ime.end()
    expect(ime.isComposing()).toBe(false)
  })

  it('handles multiple start/end cycles', () => {
    const ime = createIMETracker()
    ime.start()
    ime.end()
    ime.start()
    expect(ime.isComposing()).toBe(true)
    ime.end()
    expect(ime.isComposing()).toBe(false)
  })
})
