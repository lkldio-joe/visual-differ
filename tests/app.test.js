// tests/app.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app.js'

const config = {
  id: 'demo', name: 'Demo',
  pages: [{ id: 'home', name: 'Home', url: 'https://demo.local/', sizes: { desktop: { width: 1440, image: 'home/desktop.png' }, tablet: null, mobile: null } }],
}

function makeApp() {
  const notesByProject = new Map()
  const store = {
    list: () => [{ id: 'demo', name: 'Demo' }],
    get: (id) => { if (id !== 'demo') throw new Error('project not found'); return config },
    getInventory: (id) => { if (id !== 'demo') throw new Error('project not found'); return 'name: Demo\n## Home\nurl: https://demo.local/' },
    create: async () => config,
    update: async ({ markdown }) => ({ ...config, updatedFrom: markdown }),
    remove: () => {},
    screenshotsDir: () => '/tmp/shots',
  }
  const notesIo = {
    read: (pid) => notesByProject.get(pid) || {},
    write: (pid, n) => notesByProject.set(pid, n),
  }
  let token = null
  const settings = {
    getToken: () => token,
    setToken: (t) => { token = (t || '').trim() || null },
    hasToken: () => !!token,
  }
  return createApp({ store, notesIo, settings, clientDir: null })
}

describe('api', () => {
  it('GET /api/template returns markdown', async () => {
    const res = await request(makeApp()).get('/api/template')
    expect(res.headers['content-type']).toContain('text/markdown')
    expect(res.text).toContain('name:')
  })
  it('GET /api/projects lists projects', async () => {
    const res = await request(makeApp()).get('/api/projects')
    expect(res.body).toEqual([{ id: 'demo', name: 'Demo' }])
  })
  it('GET /api/projects/:id returns config', async () => {
    const res = await request(makeApp()).get('/api/projects/demo')
    expect(res.body.pages[0].sizes.desktop.width).toBe(1440)
  })
  it('POST /api/projects creates from markdown', async () => {
    const res = await request(makeApp()).post('/api/projects').send({ markdown: 'name: Demo\n## Home\nurl: https://x/' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('demo')
  })
  it('GET /api/projects/:id/inventory returns the raw markdown', async () => {
    const res = await request(makeApp()).get('/api/projects/demo/inventory')
    expect(res.headers['content-type']).toContain('text/markdown')
    expect(res.text).toContain('## Home')
  })
  it('GET /api/projects/:id/inventory returns 404 for unknown project', async () => {
    const res = await request(makeApp()).get('/api/projects/nope/inventory')
    expect(res.status).toBe(404)
  })
  it('PUT /api/projects/:id updates mappings from markdown', async () => {
    const res = await request(makeApp()).put('/api/projects/demo').send({ markdown: 'name: Demo\n## Home\nmobile: https://x/' })
    expect(res.status).toBe(200)
    expect(res.body.updatedFrom).toContain('mobile:')
  })
  it('PUT /api/projects/:id requires markdown', async () => {
    const res = await request(makeApp()).put('/api/projects/demo').send({})
    expect(res.status).toBe(400)
  })
  it('PUT /api/projects/:id returns 404 for unknown project', async () => {
    const res = await request(makeApp()).put('/api/projects/nope').send({ markdown: 'name: X\n## Home' })
    expect(res.status).toBe(404)
  })
  it('notes round-trip and export', async () => {
    const app = makeApp()
    await request(app).post('/api/projects/demo/notes').send({ pageId: 'home', size: 'desktop', text: 'off by 8px' })
    const got = await request(app).get('/api/projects/demo/notes')
    expect(got.body['home::desktop']).toBe('off by 8px')
    const md = await request(app).get('/api/projects/demo/notes/export')
    expect(md.text).toContain('## Home')
  })
  it('GET /api/projects/:id/notes/export returns 404 for unknown project', async () => {
    const res = await request(makeApp()).get('/api/projects/nope/notes/export')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('project not found')
  })
  it('screenshot path traversal returns 404', async () => {
    const res = await request(makeApp()).get('/api/projects/demo/screenshot/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd')
    expect(res.status).toBe(404)
  })
  it('GET /api/settings reports token presence without leaking it', async () => {
    const app = makeApp()
    const before = await request(app).get('/api/settings')
    expect(before.body).toEqual({ hasToken: false })
    await request(app).put('/api/settings').send({ figmaToken: 'figd_secret' })
    const after = await request(app).get('/api/settings')
    expect(after.body).toEqual({ hasToken: true })
    // the raw token must never appear in any settings response body
    expect(JSON.stringify(after.body)).not.toContain('figd_secret')
  })
})
