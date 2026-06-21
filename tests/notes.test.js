import { describe, it, expect } from 'vitest'
import { noteKey, upsertNote, exportMarkdown } from '../server/notes.js'

const PAGES = [{ id: 'home', name: 'Home' }, { id: 'creative', name: 'Services - Creative' }]

describe('notes', () => {
  it('builds a stable key', () => {
    expect(noteKey('home', 'desktop')).toBe('home::desktop')
  })
  it('upserts and clears notes', () => {
    let notes = {}
    notes = upsertNote(notes, 'home', 'desktop', 'hero off by 8px')
    expect(notes['home::desktop']).toBe('hero off by 8px')
    notes = upsertNote(notes, 'home', 'desktop', '   ')
    expect(notes['home::desktop']).toBeUndefined()
  })
  it('exports markdown grouped by page then size, omitting empties', () => {
    const notes = { 'home::desktop': 'hero off by 8px', 'home::mobile': 'nav overlaps logo' }
    const md = exportMarkdown(notes, PAGES)
    expect(md).toContain('# Visual Diff Notes')
    expect(md).toContain('## Home')
    expect(md).toContain('### Desktop')
    expect(md).toContain('- hero off by 8px')
    expect(md).not.toContain('Services - Creative')
  })
})
