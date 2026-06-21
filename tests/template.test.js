import { describe, it, expect } from 'vitest'
import { TEMPLATE_MD } from '../server/template.js'
import { parseInventory } from '../server/inventory.js'

describe('template', () => {
  it('is non-empty markdown', () => {
    expect(TEMPLATE_MD).toContain('## ')
    expect(TEMPLATE_MD).toMatch(/name:/)
  })
  it('parses cleanly with the inventory parser', () => {
    const { name, pages } = parseInventory(TEMPLATE_MD)
    expect(name.length).toBeGreaterThan(0)
    expect(pages.length).toBeGreaterThanOrEqual(1)
    expect(pages[0].url).toMatch(/^https?:\/\//)
  })
})
