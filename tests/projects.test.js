// tests/projects.test.js
import { describe, it, expect, vi } from 'vitest'
import { createProjectsStore } from '../server/projects.js'

// In-memory fs covering the calls the store makes.
function memFs() {
  const files = new Map()
  const dirs = new Set(['/root'])
  return {
    files,
    existsSync: (p) => files.has(p) || dirs.has(p),
    mkdirSync: (p) => { dirs.add(p) },
    writeFileSync: (p, d) => files.set(p, d),
    readFileSync: (p) => files.get(p),
    readdirSync: (p) => {
      const prefix = p.endsWith('/') ? p : p + '/'
      const names = new Set()
      for (const d of dirs) {
        if (d.startsWith(prefix)) names.add(d.slice(prefix.length).split('/')[0])
      }
      return [...names].filter(Boolean)
    },
    rmSync: (p) => {
      for (const k of [...files.keys()]) if (k.startsWith(p)) files.delete(k)
      for (const d of [...dirs]) if (d.startsWith(p)) dirs.delete(d)
    },
  }
}

const MD = `name: Demo Site

## Home
url: https://demo.local/
desktop: https://figma.com/design/KEY/F?node-id=1-2`

describe('projects store', () => {
  it('creates a project, syncs, and lists it', async () => {
    const fs = memFs()
    const makeClient = () => ({ getNodeWidth: async () => 1440, renderPng: async () => Buffer.from([1]) })
    const store = createProjectsStore({ projectsRoot: '/root', fs, makeClient })

    const config = await store.create({ markdown: MD })
    expect(config.id).toBe('demo-site')
    expect(config.pages[0].sizes.desktop.width).toBe(1440)

    expect(store.list()).toEqual([{ id: 'demo-site', name: 'Demo Site' }])
    expect(store.get('demo-site').name).toBe('Demo Site')
  })

  it('de-duplicates project ids on collision', async () => {
    const fs = memFs()
    const makeClient = () => ({ getNodeWidth: async () => 1440, renderPng: async () => Buffer.from([1]) })
    const store = createProjectsStore({ projectsRoot: '/root', fs, makeClient })
    await store.create({ markdown: MD })
    const second = await store.create({ markdown: MD })
    expect(second.id).toBe('demo-site-2')
  })

  it('rejects markdown with no pages', async () => {
    const fs = memFs()
    const store = createProjectsStore({ projectsRoot: '/root', fs, makeClient: () => ({}) })
    await expect(store.create({ markdown: 'name: Empty' })).rejects.toThrow(/no pages/i)
  })

  it('update adds a newly-mapped size and only renders the new screen', async () => {
    const fs = memFs()
    const renderPng = vi.fn(async () => Buffer.from([1]))
    const makeClient = () => ({ getNodeWidth: async () => 1440, renderPng })
    const store = createProjectsStore({ projectsRoot: '/root', fs, makeClient })

    await store.create({ markdown: MD })
    expect(renderPng).toHaveBeenCalledTimes(1) // desktop only

    const withMobile = `${MD}\nmobile: https://figma.com/design/KEY/F?node-id=5-6`
    const config = await store.update({ id: 'demo-site', markdown: withMobile })

    expect(config.pages[0].sizes.mobile).toMatchObject({ width: 1440, image: 'home/mobile.png' })
    expect(renderPng).toHaveBeenCalledTimes(2) // cached desktop skipped, mobile rendered
    expect(store.getInventory('demo-site')).toBe(withMobile)
  })

  it('update re-renders a size whose figma mapping changed', async () => {
    const fs = memFs()
    const renderPng = vi.fn(async () => Buffer.from([1]))
    const makeClient = () => ({ getNodeWidth: async () => 1440, renderPng })
    const store = createProjectsStore({ projectsRoot: '/root', fs, makeClient })

    await store.create({ markdown: MD })
    const changed = MD.replace('node-id=1-2', 'node-id=9-9')
    await store.update({ id: 'demo-site', markdown: changed })

    expect(renderPng).toHaveBeenCalledTimes(2) // stale desktop pruned and re-rendered
  })

  it('update rejects an unknown project', async () => {
    const fs = memFs()
    const store = createProjectsStore({ projectsRoot: '/root', fs, makeClient: () => ({}) })
    await expect(store.update({ id: 'nope', markdown: MD })).rejects.toThrow(/not found/i)
  })
})
