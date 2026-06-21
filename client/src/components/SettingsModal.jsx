// client/src/components/SettingsModal.jsx
import React, { useEffect, useState } from 'react'
import { getSettings, saveSettings } from '../api.js'

export default function SettingsModal({ open, onClose }) {
  const [hasToken, setHasToken] = useState(false)
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setToken('')
    getSettings().then((s) => setHasToken(s.hasToken)).catch(() => setHasToken(false))
  }, [open])

  if (!open) return null

  async function save() {
    setSaving(true)
    try {
      const s = await saveSettings(token)
      setHasToken(s.hasToken)
      setToken('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 380 }}>
        <h3 style={{ marginTop: 0 }}>Settings</h3>
        <p>Figma token: {hasToken ? 'set ✓' : 'not set'}</p>
        <label style={{ display: 'block', marginBottom: 8 }}>
          {hasToken ? 'Replace token' : 'Enter token'}
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="figd_…" style={{ width: '100%', marginTop: 4 }} />
        </label>
        <p style={{ fontSize: 12, color: '#666' }}>Stored locally on this machine; never shown again after saving.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Close</button>
          <button onClick={save} disabled={saving || !token.trim()}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
