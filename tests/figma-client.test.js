import { describe, it, expect } from 'vitest'
import { createFigmaClient } from '../server/figma.js'

function jsonResponse(body) {
  return { ok: true, json: async () => body, arrayBuffer: async () => new ArrayBuffer(0) }
}

describe('createFigmaClient', () => {
  it('getNodeWidth reads the bounding box width', async () => {
    const fetchFn = async (url, opts) => {
      expect(url).toContain('/v1/files/KEY/nodes?ids=1:2')
      expect(opts.headers['X-Figma-Token']).toBe('tok')
      return jsonResponse({ nodes: { '1:2': { document: { absoluteBoundingBox: { width: 1440 } } } } })
    }
    const client = createFigmaClient({ token: 'tok', fetchFn })
    expect(await client.getNodeWidth('KEY', '1:2')).toBe(1440)
  })

  it('renderPng resolves the image url then downloads bytes', async () => {
    const calls = []
    const fetchFn = async (url) => {
      calls.push(url)
      if (url.includes('/v1/images/')) return jsonResponse({ images: { '1:2': 'https://cdn.figma/img.png' } })
      return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }
    }
    const client = createFigmaClient({ token: 'tok', fetchFn })
    const buf = await client.renderPng('KEY', '1:2')
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(Array.from(buf)).toEqual([1, 2, 3])
    expect(calls[0]).toContain('/v1/images/KEY?ids=1:2&format=png&scale=2')
    expect(calls[1]).toBe('https://cdn.figma/img.png')
  })

  it('throws a clear error on non-ok response', async () => {
    const fetchFn = async () => ({ ok: false, status: 403, json: async () => ({}) })
    const client = createFigmaClient({ token: 'tok', fetchFn })
    await expect(client.getNodeWidth('KEY', '1:2')).rejects.toThrow(/403/)
  })
})
