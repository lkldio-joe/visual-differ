// client/src/components/ComparePane.jsx
import React from 'react'
import { screenshotUrl } from '../api.js'
import { useWebviewZoom } from './useWebviewZoom.js'
import { useWebviewVhOverride } from './useWebviewVhOverride.js'

const GRID_LINE = 'rgba(0, 120, 255, 0.45)'

export default function ComparePane({ projectId, page, size, sizeData, scale = 1, vh = null, gridOn = false, grid = 8, webviewRef, imgScrollRef }) {
  useWebviewZoom(webviewRef, scale)
  useWebviewVhOverride(webviewRef, vh)
  // On-screen footprint = design width * scale. The webview renders its layout at
  // the full design width (via zoom), so responsive breakpoints don't change.
  const w = Math.round(sizeData.width * scale)
  // Grid cell is specified in design px; scale it to screen px to match the zoom.
  const cell = Math.max(2, grid * scale)
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* text-align:center centers the inline-flex pair in the window, while
          overflow:auto keeps it scrollable (from both edges) when it's wider. */}
      <div style={{ height: '100%', overflow: 'auto', textAlign: 'center', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'row', height: '100%', verticalAlign: 'top' }}>
          <div style={{ width: w, flex: '0 0 auto', height: '100%' }}>
            <webview ref={webviewRef} src={page.url} style={{ width: '100%', height: '100%' }} />
          </div>
          <div ref={imgScrollRef} className="vdiff-noscrollbar" style={{ width: w, flex: '0 0 auto', height: '100%', overflowY: 'auto', borderLeft: '1px solid #bbb' }}>
            <img src={screenshotUrl(projectId, page.id, size)} style={{ width: '100%', display: 'block' }}
              alt={`${page.name} ${size} design`} />
          </div>
        </div>
      </div>
      {gridOn && grid > 0 && (
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
        }} />
      )}
    </div>
  )
}
