import { describe, it, expect, vi } from 'vitest'
import { createSettingsStore } from '../server/settings.js'

function memFs() {
  const files = new Map()
  return {
    files,
    existsSync: (p) => files.has(p),
    readFileSync: (p) => files.get(p),
    writeFileSync: (p, d) => files.set(p, d),
    mkdirSync: vi.fn(),
  }
}

describe('settings store', () => {
  it('reports no token and returns null when unset', () => {
    const s = createSettingsStore({ settingsPath: '/u/settings.json', fs: memFs() })
    expect(s.hasToken()).toBe(false)
    expect(s.getToken()).toBeNull()
  })
  it('persists and reads back a token', () => {
    const fs = memFs()
    const s = createSettingsStore({ settingsPath: '/u/settings.json', fs })
    s.setToken('figd_abc')
    expect(s.hasToken()).toBe(true)
    expect(s.getToken()).toBe('figd_abc')
    expect(JSON.parse(fs.files.get('/u/settings.json')).figmaToken).toBe('figd_abc')
  })
  it('clears the token on empty/whitespace', () => {
    const s = createSettingsStore({ settingsPath: '/u/settings.json', fs: memFs() })
    s.setToken('figd_abc')
    s.setToken('   ')
    expect(s.hasToken()).toBe(false)
    expect(s.getToken()).toBeNull()
  })
})
