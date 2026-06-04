import { describe, it, expect } from 'vitest'

describe('core', () => {
  it('placeholder - core module exports createComposer', async () => {
    const { createComposer } = await import('../index.js')
    expect(createComposer).toBeDefined()
  })
})
