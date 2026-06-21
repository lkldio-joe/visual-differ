export function extractFileKey(url) {
  const m = String(url).match(/\/design\/([A-Za-z0-9]+)/)
  return m ? m[1] : null
}

export function extractNodeId(url) {
  const m = String(url).match(/[?&]node-id=([^&]+)/)
  if (!m) return null
  return decodeURIComponent(m[1]).replace('-', ':')
}

const API_BASE = 'https://api.figma.com'

export function createFigmaClient({ token, fetchFn = fetch }) {
  if (!token) throw new Error('FIGMA_TOKEN is required to create a Figma client')

  async function apiJson(path) {
    const res = await fetchFn(`${API_BASE}${path}`, { headers: { 'X-Figma-Token': token } })
    if (!res.ok) throw new Error(`Figma API ${path} failed: ${res.status}`)
    return res.json()
  }

  async function getNodeWidth(fileKey, nodeId) {
    const data = await apiJson(`/v1/files/${fileKey}/nodes?ids=${nodeId}`)
    const width = data?.nodes?.[nodeId]?.document?.absoluteBoundingBox?.width
    if (width == null) throw new Error(`No bounding box width for node ${nodeId}`)
    return Math.round(width)
  }

  async function renderPng(fileKey, nodeId) {
    const data = await apiJson(`/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=2`)
    const imageUrl = data?.images?.[nodeId]
    if (!imageUrl) throw new Error(`No rendered image for node ${nodeId}`)
    const res = await fetchFn(imageUrl)
    if (!res.ok) throw new Error(`Image download failed: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }

  return { getNodeWidth, renderPng }
}
