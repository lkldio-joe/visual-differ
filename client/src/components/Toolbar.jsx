// client/src/components/Toolbar.jsx
import React from 'react'
const SIZES = ['desktop', 'tablet', 'mobile']

export default function Toolbar({ config, selection, onChange, onRefresh }) {
  const page = config.pages.find((p) => p.id === selection.pageId)
  const set = (patch) => onChange({ ...selection, ...patch })
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, borderBottom: '1px solid #ccc' }}>
      <select value={selection.pageId} onChange={(e) => set({ pageId: e.target.value })}>
        {config.pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button onClick={() => onRefresh?.()} title="Reload the live page">↻ Refresh</button>
      <select value={selection.size} onChange={(e) => set({ size: e.target.value })}>
        {SIZES.map((s) => (
          <option key={s} value={s} disabled={!page?.sizes?.[s]}>{s}{page?.sizes?.[s] ? '' : ' (no design)'}</option>
        ))}
      </select>
      <label>Zoom
        <select value={selection.scale ?? 1} onChange={(e) => set({ scale: Number(e.target.value) })}>
          <option value={1}>100%</option>
          <option value={0.75}>75%</option>
          <option value={0.5}>50%</option>
          <option value={0.25}>25%</option>
        </select>
      </label>
      <label title="Rewrite vh units in the live page (100vh -> this many px). Blank = leave vh as-is. Viewport & scrolling are untouched.">100vh =
        <input type="number" min="0" step="10" placeholder="off" style={{ width: 64 }}
          value={selection.vh ?? ''}
          onChange={(e) => set({ vh: e.target.value === '' ? null : Number(e.target.value) })} />px
      </label>
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
      {selection.mode === 'side' && (
        <>
          <button onClick={() => set({ gridOn: !selection.gridOn })}>
            Grid: {selection.gridOn ? 'On' : 'Off'}
          </button>
          {selection.gridOn && (
            <label title="Grid cell size in design px (scaled to the current zoom)">Grid
              <input type="number" min="1" step="1" style={{ width: 56 }} value={selection.grid ?? 8}
                onChange={(e) => set({ grid: Math.max(1, Number(e.target.value) || 1) })} />px
            </label>
          )}
        </>
      )}
    </div>
  )
}
