import path from 'node:path'
import realFs from 'node:fs'
import { createApp } from './app.js'
import { createProjectsStore } from './projects.js'
import { createFigmaClient } from './figma.js'
import { createSettingsStore } from './settings.js'

export function createNotesIo({ store, fs = realFs }) {
  return {
    read(id) {
      const p = store.notesPath(id)
      if (!fs.existsSync(p)) return {}
      try { return JSON.parse(fs.readFileSync(p, 'utf8') || '{}') } catch { return {} }
    },
    write(id, notes) {
      const p = store.notesPath(id)
      fs.mkdirSync(path.dirname(p), { recursive: true })
      fs.writeFileSync(p, JSON.stringify(notes, null, 2))
    },
  }
}

export async function startServer({
  port = 4317,
  projectsRoot,
  fs = realFs,
  fetchFn = fetch,
  env = process.env,
  clientDir,
} = {}) {
  fs.mkdirSync(projectsRoot, { recursive: true })

  const settingsPath = path.join(path.dirname(projectsRoot), 'settings.json')
  const settings = createSettingsStore({ settingsPath, fs })

  const makeClient = () => {
    const token = settings.getToken() || env.FIGMA_TOKEN
    if (!token) throw new Error('No Figma token. Add one in Settings.')
    return createFigmaClient({ token, fetchFn })
  }

  const store = createProjectsStore({ projectsRoot, fs, makeClient })
  const notesIo = createNotesIo({ store, fs })
  const app = createApp({ store, notesIo, settings, clientDir })

  const server = await new Promise((resolve) => {
    const s = app.listen(port, () => resolve(s))
  })
  return { app, server, port }
}
