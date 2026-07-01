// client/src/components/NotesPanel.jsx
import React, { useEffect, useRef, useState } from 'react'
import { getNotes, saveNote, exportNotesUrl } from '../api.js'

const key = (pageId, size) => `${pageId}::${size}`

export default function NotesPanel({ projectId, pageId, size }) {
  const [text, setText] = useState('')
  // Held in a ref (not state) so autosave round-trips never re-render and clobber
  // the textarea you're typing in. We only reload text when the page/size changes.
  const notesRef = useRef({})
  const timer = useRef(null)

  useEffect(() => {
    let cancelled = false
    getNotes(projectId).then((n) => {
      if (cancelled) return
      notesRef.current = n
      setText(n[key(pageId, size)] || '')
    }).catch(() => { notesRef.current = {} })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => { setText(notesRef.current[key(pageId, size)] || '') }, [pageId, size])

  function onChange(value) {
    setText(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        notesRef.current = await saveNote(projectId, pageId, size, value)
      } catch (err) {
        console.warn('autosave failed', err)
      }
    }, 500)
  }

  return (
    <div style={{ borderTop: '1px solid #ccc', padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Notes — {pageId} / {size}</strong>
        <a href={exportNotesUrl(projectId)} target="_blank" rel="noreferrer"><button>Export Markdown</button></a>
      </div>
      <textarea value={text} onChange={(e) => onChange(e.target.value)}
        placeholder="Notes for this page + size…" style={{ width: '100%', height: 80, marginTop: 6 }} />
    </div>
  )
}
