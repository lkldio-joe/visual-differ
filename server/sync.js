import path from 'node:path'
import { extractFileKey, extractNodeId } from './figma.js'

const SIZES = ['desktop', 'tablet', 'mobile']

export async function syncPages({ pages, client, fs, screenshotsDir }) {
  const out = []
  for (const page of pages) {
    const sizes = {}
    for (const size of SIZES) {
      const figmaUrl = page.sizes[size]
      if (!figmaUrl) { sizes[size] = null; continue }

      const fileKey = extractFileKey(figmaUrl)
      const nodeId = extractNodeId(figmaUrl)
      if (!fileKey || !nodeId) { sizes[size] = null; continue }

      const relImage = `${page.id}/${size}.png`
      const absImage = path.join(screenshotsDir, page.id, `${size}.png`)
      const width = await client.getNodeWidth(fileKey, nodeId)

      if (!fs.existsSync(absImage)) {
        fs.mkdirSync(path.dirname(absImage), { recursive: true })
        const buf = await client.renderPng(fileKey, nodeId)
        fs.writeFileSync(absImage, buf)
      }
      sizes[size] = { figmaUrl, width, image: relImage }
    }
    out.push({ id: page.id, name: page.name, url: page.url, sizes })
  }
  return out
}
