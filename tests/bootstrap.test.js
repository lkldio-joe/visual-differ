import { describe, it, expect, vi } from 'vitest'
import { createNotesIo } from '../server/bootstrap.js'

describe('createNotesIo', () => {
  it('reads {} when missing and persists writes per project', () => {
    const files = new Map()
    const fs = {
      existsSync: (p) => files.has(p),
      readFileSync: (p) => files.get(p),
      writeFileSync: (p, d) => files.set(p, d),
      mkdirSync: vi.fn(),
    }
    const store = { notesPath: (id) => `/p/${id}/notes.json` }
    const io = createNotesIo({ store, fs })
    expect(io.read('demo')).toEqual({})
    io.write('demo', { 'home::desktop': 'x' })
    expect(JSON.parse(files.get('/p/demo/notes.json'))).toEqual({ 'home::desktop': 'x' })
    expect(io.read('demo')).toEqual({ 'home::desktop': 'x' })
  })
})
