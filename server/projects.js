// server/projects.js
import path from 'node:path'
import realFs from 'node:fs'
import { parseInventory } from './inventory.js'
import { slugify } from './slug.js'
import { syncPages } from './sync.js'

export function createProjectsStore({ projectsRoot, fs = realFs, makeClient }) {
  function dir(id) { return path.join(projectsRoot, id) }
  function projectJson(id) { return path.join(dir(id), 'project.json') }
  function configJson(id) { return path.join(dir(id), 'config.generated.json') }
  function screenshotsDir(id) { return path.join(dir(id), 'screenshots') }
  function notesPath(id) { return path.join(dir(id), 'notes.json') }

  function uniqueId(base) {
    let id = base || 'project'
    let n = 1
    while (fs.existsSync(dir(id))) { n += 1; id = `${base}-${n}` }
    return id
  }

  function list() {
    if (!fs.existsSync(projectsRoot)) return []
    return fs.readdirSync(projectsRoot)
      .filter((name) => fs.existsSync(projectJson(name)))
      .map((name) => JSON.parse(fs.readFileSync(projectJson(name), 'utf8')))
      .map(({ id, name }) => ({ id, name }))
  }

  function get(id) {
    return JSON.parse(fs.readFileSync(configJson(id), 'utf8'))
  }

  async function create({ markdown }) {
    const { name, pages } = parseInventory(markdown)
    if (!pages.length) throw new Error('Invalid inventory: no pages found. Use the template.')
    const id = uniqueId(slugify(name) || 'project')

    fs.mkdirSync(dir(id), { recursive: true })
    fs.writeFileSync(path.join(dir(id), 'inventory.md'), markdown)
    fs.writeFileSync(projectJson(id), JSON.stringify({ id, name }, null, 2))

    const client = makeClient()
    const configPages = await syncPages({ pages, client, fs, screenshotsDir: screenshotsDir(id) })
    const config = { id, name, pages: configPages }
    fs.writeFileSync(configJson(id), JSON.stringify(config, null, 2))
    return config
  }

  function remove(id) {
    fs.rmSync(dir(id), { recursive: true, force: true })
  }

  return { list, get, create, remove, screenshotsDir, notesPath }
}
