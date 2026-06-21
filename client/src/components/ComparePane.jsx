// client/src/components/ComparePane.jsx
import React from 'react'
import { screenshotUrl } from '../api.js'

export default function ComparePane({ projectId, page, size, sizeData, webviewRef, imgScrollRef }) {
  const width = sizeData.width
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', overflowX: 'auto' }}>
      <div style={{ width, flex: '0 0 auto', height: '100%', borderRight: '2px solid #888' }}>
        <webview ref={webviewRef} src={page.url} style={{ width: '100%', height: '100%' }} />
      </div>
      <div ref={imgScrollRef} style={{ width, flex: '0 0 auto', height: '100%', overflowY: 'auto' }}>
        <img src={screenshotUrl(projectId, page.id, size)} style={{ width: '100%', display: 'block' }}
          alt={`${page.name} ${size} design`} />
      </div>
    </div>
  )
}
