// client/src/components/ProjectBar.jsx
import React, { useRef, useState } from 'react'
import { createProject, templateUrl } from '../api.js'

export default function ProjectBar({ projects, activeId, onSelect, onCreated, onEdit, onOpenSettings }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError(null)
    try {
      const text = await file.text()
      const config = await createProject(text)
      onCreated(config)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, background: '#f4f4f4', borderBottom: '1px solid #ccc' }}>
      <strong>Project:</strong>
      <select value={activeId || ''} onChange={(e) => onSelect(e.target.value)}>
        {projects.length === 0 && <option value="">— none —</option>}
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <button onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? 'Adding…' : 'Add Project'}
      </button>
      <input ref={fileRef} type="file" accept=".md,text/markdown" style={{ display: 'none' }} onChange={onFile} />

      <button onClick={onEdit} disabled={busy || !onEdit}>Edit Mappings</button>

      <a href={templateUrl()} download="page-inventory.md"><button>Download Template</button></a>
      <button onClick={onOpenSettings}>Settings</button>
      {error && <span style={{ color: 'crimson' }}>{error}</span>}
    </div>
  )
}
