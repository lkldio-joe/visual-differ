// client/src/App.jsx
import React, { useEffect, useRef, useState } from 'react'
import { listProjects, getProject } from './api.js'
import ProjectBar from './components/ProjectBar.jsx'
import Toolbar from './components/Toolbar.jsx'
import ComparePane from './components/ComparePane.jsx'
import { useScrollSync } from './components/useScrollSync.js'
import OverlayView from './components/OverlayView.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'

const SIZES = ['desktop', 'tablet', 'mobile']
const firstAvailable = (page) => SIZES.find((s) => page?.sizes?.[s]) || 'desktop'

export default function App() {
  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [config, setConfig] = useState(null)
  const [selection, setSelection] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const webviewRef = useRef(null)
  const imgScrollRef = useRef(null)
  const page = config?.pages.find((p) => p.id === selection?.pageId)
  const sizeData = page?.sizes?.[selection?.size]

  useScrollSync({
    webviewRef, imgScrollRef,
    enabled: !!(selection?.scrollSync && selection?.mode === 'side' && sizeData),
  })

  useEffect(() => { listProjects().then((ps) => {
    setProjects(ps)
    if (ps[0]) setActiveId(ps[0].id)
  }).catch(() => {}) }, [])

  useEffect(() => {
    if (!activeId) { setConfig(null); return }
    getProject(activeId).then(setConfig).catch(() => setConfig(null))
  }, [activeId])

  useEffect(() => {
    if (!config) { setSelection(null); return }
    const page = config.pages[0]
    setSelection({ pageId: page.id, size: firstAvailable(page), mode: 'side', scrollSync: true, opacity: 0.5 })
  }, [config])

  function onCreated(cfg) {
    setProjects((prev) => prev.some((p) => p.id === cfg.id) ? prev : [...prev, { id: cfg.id, name: cfg.name }])
    setActiveId(cfg.id)
    setConfig(cfg)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <ProjectBar projects={projects} activeId={activeId} onSelect={setActiveId} onCreated={onCreated} onOpenSettings={() => setShowSettings(true)} />
      {config && selection && <Toolbar config={config} selection={selection} onChange={setSelection} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        {!config || !selection ? <div style={{ padding: 8 }}>Add or select a project to begin.</div>
          : !sizeData ? <div style={{ padding: 8 }}>No design available for this size.</div>
          : selection.mode === 'side'
            ? <ComparePane projectId={config.id} page={page} size={selection.size} sizeData={sizeData}
                webviewRef={webviewRef} imgScrollRef={imgScrollRef} />
            : <OverlayView projectId={config.id} page={page} size={selection.size} sizeData={sizeData}
                opacity={selection.opacity} webviewRef={webviewRef} />}
      </div>
      {config && selection && <NotesPanel projectId={config.id} pageId={selection.pageId} size={selection.size} />}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
