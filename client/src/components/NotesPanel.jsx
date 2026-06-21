// client/src/components/NotesPanel.jsx
import React, { useEffect, useRef, useState } from 'react'
import { getNotes, saveNote, exportNotesUrl } from '../api.js'

const key = (pageId, size) => `${pageId}::${size}`

export default function NotesPanel({ projectId, pageId, size }) {
  const [notes, setNotes] = useState({})
  const [text, setText] = useState('')
  const timer = useRef(null)

  useEffect(() => { getNotes(projectId).then(setNotes).catch(() => setNotes({})) }, [projectId])
  useEffect(() => { setText(notes[key(pageId, size)] || '') }, [pageId, size, notes])

  function onChange(value) {
    setText(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const updated = await saveNote(projectId, pageId, size, value)
        setNotes(updated)
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
