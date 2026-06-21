import { describe, it, expect, vi } from 'vitest'
import { syncPages } from '../server/sync.js'

const PAGES = [
  {
    id: 'home', name: 'Home', url: 'https://curious-jane.local/',
    sizes: {
      desktop: 'https://figma.com/design/KEY/F?node-id=1-2',
      tablet: null,
      mobile: 'https://figma.com/design/KEY/F?node-id=3-4',
    },
  },
]

function fakeFs(existing = new Set()) {
  const written = new Map()
  return {
    written,
    existsSync: (p) => existing.has(p) || written.has(p),
    mkdirSync: vi.fn(),
    writeFileSync: (p, data) => written.set(p, data),
  }
}

describe('syncPages', () => {
  it('renders missing pngs, records width, skips null sizes', async () => {
    const client = { getNodeWidth: vi.fn(async () => 1440), renderPng: vi.fn(async () => Buffer.from([9])) }
    const fs = fakeFs()
    const pages = await syncPages({ pages: PAGES, client, fs, screenshotsDir: '/shots' })
    expect(pages[0].sizes.tablet).toBeNull()
    expect(pages[0].sizes.desktop).toMatchObject({ width: 1440, image: 'home/desktop.png' })
    expect(client.renderPng).toHaveBeenCalledTimes(2)
    expect(fs.written.has('/shots/home/desktop.png')).toBe(true)
  })

  it('does not re-render cached pngs', async () => {
    const client = { getNodeWidth: vi.fn(async () => 1440), renderPng: vi.fn(async () => Buffer.from([9])) }
    const fs = fakeFs(new Set(['/shots/home/desktop.png', '/shots/home/mobile.png']))
    await syncPages({ pages: PAGES, client, fs, screenshotsDir: '/shots' })
    expect(client.renderPng).not.toHaveBeenCalled()
  })
})
