// tests/api.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screenshotUrl, listProjects, templateUrl } from '../client/src/api.js'

beforeEach(() => { globalThis.window = { vdiff: { apiBase: 'http://localhost:4317' } } })

describe('client api', () => {
  it('builds a project screenshot url', () => {
    expect(screenshotUrl('demo', 'home', 'desktop'))
      .toBe('http://localhost:4317/api/projects/demo/screenshot/home/desktop')
  })
  it('builds the template url', () => {
    expect(templateUrl()).toBe('http://localhost:4317/api/template')
  })
  it('listProjects fetches', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => [{ id: 'demo', name: 'Demo' }] }))
    expect(await listProjects()).toEqual([{ id: 'demo', name: 'Demo' }])
    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:4317/api/projects')
  })
  it('apiBase falls back to same-origin empty string when unset', async () => {
    globalThis.window = {}
    vi.resetModules()
    const mod = await import('../client/src/api.js')
    expect(mod.apiBase()).toBe('')
  })
  it('saveSettings PUTs the token', async () => {
    globalThis.window = { vdiff: { apiBase: 'http://localhost:4317' } }
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ hasToken: true }) }))
    const { saveSettings } = await import('../client/src/api.js')
    const res = await saveSettings('figd_x')
    expect(res).toEqual({ hasToken: true })
    const [url, opts] = globalThis.fetch.mock.calls[0]
    expect(url).toBe('http://localhost:4317/api/settings')
    expect(opts.method).toBe('PUT')
    expect(JSON.parse(opts.body)).toEqual({ figmaToken: 'figd_x' })
  })
})
