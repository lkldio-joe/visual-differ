import { describe, it, expect } from 'vitest'
import { slugify } from '../server/slug.js'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Services - Creative')).toBe('services-creative')
  })
  it('trims and collapses separators', () => {
    expect(slugify('  About / Our Agency!! ')).toBe('about-our-agency')
  })
  it('handles a bare slash root', () => {
    expect(slugify('Home')).toBe('home')
  })
})
