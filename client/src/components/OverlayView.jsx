// client/src/components/OverlayView.jsx
import React from 'react'
import { screenshotUrl } from '../api.js'

export default function OverlayView({ projectId, page, size, sizeData, opacity, webviewRef }) {
  const width = sizeData.width
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ position: 'relative', width }}>
        <webview ref={webviewRef} src={page.url} style={{ width: '100%', height: '100vh', display: 'block' }} />
        <img src={screenshotUrl(projectId, page.id, size)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', opacity, pointerEvents: 'none' }}
          alt={`${page.name} ${size} design overlay`} />
      </div>
    </div>
  )
}
