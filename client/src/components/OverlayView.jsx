// client/src/components/OverlayView.jsx
import React, { useRef } from 'react'
import { screenshotUrl } from '../api.js'
import { useWebviewZoom } from './useWebviewZoom.js'
import { useWebviewVhOverride } from './useWebviewVhOverride.js'
import { useOverlayScrollSync } from './useOverlayScrollSync.js'

export default function OverlayView({ projectId, page, size, sizeData, opacity, scale = 1, vh = null, scrollSync = false, webviewRef }) {
  const imgRef = useRef(null)
  useWebviewZoom(webviewRef, scale)
  useWebviewVhOverride(webviewRef, vh)
  useOverlayScrollSync({ webviewRef, imgRef, scale, enabled: scrollSync })
  const w = Math.round(sizeData.width * scale)
  return (
    // Mirror ComparePane's inline-flex layout: the flex child stretches to full
    // height (a plain height:100% chain collapses here), and the design image is
    // absolutely overlaid on top of the webview.
    <div style={{ height: '100%', overflow: 'hidden', textAlign: 'center', whiteSpace: 'nowrap' }}>
      <div style={{ display: 'inline-flex', height: '100%', verticalAlign: 'top' }}>
        <div style={{ position: 'relative', width: w, flex: '0 0 auto', height: '100%', overflow: 'hidden' }}>
          <webview ref={webviewRef} src={page.url} style={{ width: '100%', height: '100%', display: 'block' }} />
          <img ref={imgRef} src={screenshotUrl(projectId, page.id, size)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', opacity, pointerEvents: 'none' }}
            alt={`${page.name} ${size} design overlay`} />
        </div>
      </div>
    </div>
  )
}
