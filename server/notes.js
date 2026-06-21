const SIZES = ['desktop', 'tablet', 'mobile']

export function noteKey(pageId, size) {
  return `${pageId}::${size}`
}

export function upsertNote(notes, pageId, size, text) {
  const next = { ...notes }
  const key = noteKey(pageId, size)
  const clean = (text || '').trim()
  if (clean) next[key] = clean
  else delete next[key]
  return next
}

function titleCase(size) {
  return size.charAt(0).toUpperCase() + size.slice(1)
}

export function exportMarkdown(notes, pages) {
  const lines = ['# Visual Diff Notes', '']
  for (const page of pages) {
    const blocks = []
    for (const size of SIZES) {
      const text = notes[noteKey(page.id, size)]
      if (!text) continue
      const body = text.split(/\r?\n/).filter((l) => l.trim()).map((l) => `- ${l.trim()}`).join('\n')
      blocks.push(`### ${titleCase(size)}\n${body}`)
    }
    if (blocks.length) lines.push(`## ${page.name}`, ...blocks, '')
  }
  return lines.join('\n').trimEnd() + '\n'
}
