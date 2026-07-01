// client/src/components/EditMappingsModal.jsx
import React, { useEffect, useRef, useState } from 'react'
import { getInventory, updateProject } from '../api.js'

// Rendering happens server-side in one request, so we can't get real progress.
// Cycle through reassuring messages so a slow Figma render looks alive, not hung.
const SAVE_MESSAGES = [
  'Reading page mappings…',
  'Fetching designs from Figma…',
  'Rendering new screens…',
  'Downloading images…',
  'Almost there…',
]

export default function EditMappingsModal({ open, projectId, onClose, onSaved }) {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (!open || !projectId) return
    setError(null)
    setLoading(true)
    getInventory(projectId)
      .then((md) => setMarkdown(md))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [open, projectId])

  // Drive the elapsed timer and cycle the status message while saving.
  useEffect(() => {
    if (!saving) return
    setElapsed(0)
    setMsgIndex(0)
    const started = Date.now()
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250)
    const cycle = setInterval(() => setMsgIndex((i) => Math.min(i + 1, SAVE_MESSAGES.length - 1)), 2500)
    return () => { clearInterval(tick); clearInterval(cycle) }
  }, [saving])

  if (!open) return null

  async function save() {
    setSaving(true); setError(null)
    try {
      const config = await updateProject(projectId, markdown)
      onSaved(config)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 640, maxWidth: '90vw' }}>
        <h3 style={{ marginTop: 0 }}>Edit page mappings</h3>
        <p style={{ fontSize: 12, color: '#666', marginTop: 0 }}>
          Add or change <code>desktop:</code> / <code>tablet:</code> / <code>mobile:</code> Figma links under each
          <code> ## </code> page. New screens are rendered on save; unchanged ones stay cached.
        </p>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          disabled={loading || saving}
          spellCheck={false}
          style={{ width: '100%', height: 320, fontFamily: 'monospace', fontSize: 12, boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: 'crimson', fontSize: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          {saving && (
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#444' }}>
              <span className="vdiff-spinner" />
              <span>{SAVE_MESSAGES[msgIndex]}</span>
              <span style={{ color: '#999' }}>({elapsed}s)</span>
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={onClose} disabled={saving}>Cancel</button>
            <button onClick={save} disabled={loading || saving || !markdown.trim()}>
              {saving ? 'Syncing…' : 'Save & sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
