import { slugify } from './slug.js'

const NAME_RE = /^name:\s*(.+?)\s*$/i
const PAGE_RE = /^##\s+(.+?)\s*$/
const URL_RE = /^url:\s*(\S+)/i
const SIZE_RE = /^(desktop|tablet|mobile):\s*(\S+)/i

function firstToken(s) {
  return s.trim().split(/\s+/)[0]
}

export function parseInventory(markdown) {
  const lines = String(markdown).split(/\r?\n/)
  let name = ''
  const pages = []
  let page = null

  for (const raw of lines) {
    const line = raw.trim()

    const pageMatch = line.match(PAGE_RE)
    if (pageMatch) {
      page = {
        id: slugify(pageMatch[1]),
        name: pageMatch[1].trim(),
        url: '',
        sizes: { desktop: null, tablet: null, mobile: null },
      }
      pages.push(page)
      continue
    }

    // single-# comment / title (## already handled above)
    if (line.startsWith('#')) continue

    if (!page) {
      const nameMatch = line.match(NAME_RE)
      if (nameMatch) name = nameMatch[1].trim()
      continue
    }

    const urlMatch = line.match(URL_RE)
    if (urlMatch) {
      page.url = firstToken(urlMatch[1])
      continue
    }

    const sizeMatch = line.match(SIZE_RE)
    if (sizeMatch) {
      const size = sizeMatch[1].toLowerCase()
      const value = firstToken(sizeMatch[2])
      page.sizes[size] = value.startsWith('http') ? value : null
      continue
    }
  }

  return { name, pages }
}
