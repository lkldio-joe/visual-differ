import { describe, it, expect } from 'vitest'
import { parseInventory } from '../server/inventory.js'

const SAMPLE = `# Visual Differ Project

name: Curious Jane Website Refresh

## Home
url: https://curious-jane.local/
desktop: https://figma.com/design/KEY/F?node-id=592-6187
tablet:  https://figma.com/design/KEY/F?node-id=592-7039
mobile:  https://figma.com/design/KEY/F?node-id=617-3148

## Services - Creative
url: https://curious-jane.local/creative/
desktop: https://figma.com/design/KEY/F?node-id=798-5126   # only desktop + mobile
mobile:  https://figma.com/design/KEY/F?node-id=704-3765

# Notes:
# - omit a size line if there's no design`

describe('parseInventory', () => {
  const result = parseInventory(SAMPLE)

  it('reads the project name', () => {
    expect(result.name).toBe('Curious Jane Website Refresh')
  })

  it('parses every page with a derived slug', () => {
    expect(result.pages).toHaveLength(2)
    expect(result.pages[0]).toMatchObject({ id: 'home', name: 'Home', url: 'https://curious-jane.local/' })
    expect(result.pages[1].id).toBe('services-creative')
  })

  it('captures figma url per size and tolerates inline comments', () => {
    expect(result.pages[0].sizes.desktop).toBe('https://figma.com/design/KEY/F?node-id=592-6187')
    expect(result.pages[1].sizes.desktop).toBe('https://figma.com/design/KEY/F?node-id=798-5126')
  })

  it('treats omitted size lines as null', () => {
    expect(result.pages[1].sizes.tablet).toBeNull()
  })

  it('ignores single-# comment lines', () => {
    expect(result.pages.some((p) => p.name.startsWith('Notes'))).toBe(false)
  })
})
