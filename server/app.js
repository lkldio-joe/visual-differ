// server/app.js
import express from 'express'
import path from 'node:path'
import { upsertNote, exportMarkdown } from './notes.js'
import { TEMPLATE_MD } from './template.js'

export function createApp({ store, notesIo, settings, clientDir }) {
  const app = express()
  app.use(express.json({ limit: '2mb' }))

  app.get('/api/template', (req, res) => {
    res.type('text/markdown')
      .set('Content-Disposition', 'attachment; filename="page-inventory.md"')
      .send(TEMPLATE_MD)
  })

  app.get('/api/projects', (req, res) => res.json(store.list()))

  app.post('/api/projects', async (req, res) => {
    const { markdown } = req.body || {}
    if (!markdown) return res.status(400).json({ error: 'markdown is required' })
    try {
      const config = await store.create({ markdown })
      res.status(201).json(config)
    } catch (err) {
      res.status(400).json({ error: err.message })
    }
  })

  app.get('/api/projects/:id', (req, res) => {
    try { res.json(store.get(req.params.id)) }
    catch { res.status(404).json({ error: 'project not found' }) }
  })

  app.delete('/api/projects/:id', (req, res) => {
    store.remove(req.params.id)
    res.status(204).end()
  })

  app.get('/api/projects/:id/screenshot/:slug/:size', (req, res) => {
    const { id, slug, size } = req.params
    const base = path.resolve(store.screenshotsDir(id))
    const file = path.resolve(base, slug, `${size}.png`)
    if (file !== base && !file.startsWith(base + path.sep)) return res.status(404).end()
    res.sendFile(file, (err) => { if (err) res.status(404).end() })
  })

  app.get('/api/projects/:id/notes', (req, res) => {
    try { store.get(req.params.id) }
    catch { return res.status(404).json({ error: 'project not found' }) }
    res.json(notesIo.read(req.params.id))
  })

  app.post('/api/projects/:id/notes', (req, res) => {
    const { pageId, size, text } = req.body || {}
    if (!pageId || !size) return res.status(400).json({ error: 'pageId and size required' })
    try { store.get(req.params.id) }
    catch { return res.status(404).json({ error: 'project not found' }) }
    const next = upsertNote(notesIo.read(req.params.id), pageId, size, text)
    notesIo.write(req.params.id, next)
    res.json(next)
  })

  app.get('/api/projects/:id/notes/export', (req, res) => {
    let config
    try { config = store.get(req.params.id) }
    catch { return res.status(404).json({ error: 'project not found' }) }
    const md = exportMarkdown(notesIo.read(req.params.id), config.pages)
    res.type('text/markdown').send(md)
  })

  app.get('/api/settings', (req, res) => {
    res.json({ hasToken: settings.hasToken() })
  })

  app.put('/api/settings', (req, res) => {
    const { figmaToken } = req.body || {}
    settings.setToken(figmaToken)
    res.json({ hasToken: settings.hasToken() })
  })

  if (clientDir) app.use(express.static(clientDir))
  return app
}
