// client/src/components/Toolbar.jsx
import React from 'react'
const SIZES = ['desktop', 'tablet', 'mobile']

export default function Toolbar({ config, selection, onChange }) {
  const page = config.pages.find((p) => p.id === selection.pageId)
  const set = (patch) => onChange({ ...selection, ...patch })
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, borderBottom: '1px solid #ccc' }}>
      <select value={selection.pageId} onChange={(e) => set({ pageId: e.target.value })}>
        {config.pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={selection.size} onChange={(e) => set({ size: e.target.value })}>
        {SIZES.map((s) => (
          <option key={s} value={s} disabled={!page?.sizes?.[s]}>{s}{page?.sizes?.[s] ? '' : ' (no design)'}</option>
        ))}
      </select>
      <button onClick={() => set({ mode: selection.mode === 'side' ? 'overlay' : 'side' })}>
        Mode: {selection.mode === 'side' ? 'Side-by-side' : 'Overlay'}
      </button>
      <button onClick={() => set({ scrollSync: !selection.scrollSync })}>
        Scroll sync: {selection.scrollSync ? 'On' : 'Off'}
      </button>
      {selection.mode === 'overlay' && (
        <label>Opacity
          <input type="range" min="0" max="1" step="0.05" value={selection.opacity}
            onChange={(e) => set({ opacity: Number(e.target.value) })} />
        </label>
      )}
    </div>
  )
}
