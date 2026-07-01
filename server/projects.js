// server/projects.js
import path from 'node:path'
import realFs from 'node:fs'
import { parseInventory } from './inventory.js'
import { slugify } from './slug.js'
import { syncPages } from './sync.js'

const SIZES = ['desktop', 'tablet', 'mobile']

export function createProjectsStore({ projectsRoot, fs = realFs, makeClient }) {
  function dir(id) { return path.join(projectsRoot, id) }
  function projectJson(id) { return path.join(dir(id), 'project.json') }
  function configJson(id) { return path.join(dir(id), 'config.generated.json') }
  function inventoryPath(id) { return path.join(dir(id), 'inventory.md') }
  function screenshotsDir(id) { return path.join(dir(id), 'screenshots') }
  function notesPath(id) { return path.join(dir(id), 'notes.json') }
  function screenshotPath(id, pageId, size) { return path.join(screenshotsDir(id), pageId, `${size}.png`) }

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

  // Raw inventory markdown — the editable source of truth for a project's mappings.
  function getInventory(id) {
    return fs.readFileSync(inventoryPath(id), 'utf8')
  }

  async function create({ markdown }) {
    const { name, pages } = parseInventory(markdown)
    if (!pages.length) throw new Error('Invalid inventory: no pages found. Use the template.')
    const id = uniqueId(slugify(name) || 'project')

    fs.mkdirSync(dir(id), { recursive: true })
    fs.writeFileSync(inventoryPath(id), markdown)
    fs.writeFileSync(projectJson(id), JSON.stringify({ id, name }, null, 2))

    const client = makeClient()
    const configPages = await syncPages({ pages, client, fs, screenshotsDir: screenshotsDir(id) })
    const config = { id, name, pages: configPages }
    fs.writeFileSync(configJson(id), JSON.stringify(config, null, 2))
    return config
  }

  // Re-parse edited inventory markdown for an existing project and re-sync.
  // syncPages only renders screenshots that are missing, so newly added screens
  // (e.g. a mobile view) are fetched while unchanged ones stay cached. Any cached
  // screenshot whose Figma mapping changed or was removed is pruned first so it
  // is re-rendered from the new URL instead of serving a stale image.
  async function update({ id, markdown }) {
    if (!fs.existsSync(projectJson(id))) throw new Error('project not found')
    const { name, pages } = parseInventory(markdown)
    if (!pages.length) throw new Error('Invalid inventory: no pages found. Use the template.')

    let prev = null
    try { prev = get(id) } catch {}
    if (prev) {
      const nextUrl = new Map()
      for (const p of pages) for (const size of SIZES) nextUrl.set(`${p.id}/${size}`, p.sizes[size] || null)
      for (const p of prev.pages) {
        for (const size of SIZES) {
          const oldUrl = p.sizes?.[size]?.figmaUrl || null
          if (oldUrl && nextUrl.get(`${p.id}/${size}`) !== oldUrl) {
            const png = screenshotPath(id, p.id, size)
            if (fs.existsSync(png)) fs.rmSync(png, { force: true })
          }
        }
      }
    }

    fs.writeFileSync(inventoryPath(id), markdown)
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

  return { list, get, getInventory, create, update, remove, screenshotsDir, notesPath }
}
