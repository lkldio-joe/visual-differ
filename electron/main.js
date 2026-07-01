// electron/main.js
import { app, BrowserWindow, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { startServer } from '../server/bootstrap.js'

dotenv.config()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 4317
const isDev = !!process.env.VDIFF_DEV

function stripFramingHeaders() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders || {}
    for (const name of Object.keys(headers)) {
      const lower = name.toLowerCase()
      if (lower === 'x-frame-options') delete headers[name]
      else if (lower === 'content-security-policy') {
        headers[name] = headers[name].map((v) => v.replace(/frame-ancestors[^;]*;?/gi, ''))
      }
    }
    callback({ responseHeaders: headers })
  })
}

async function createWindow() {
  const projectsRoot = path.join(app.getPath('userData'), 'projects')
  // clientDir used only in packaged/prod builds; dev uses Vite + /api proxy
  const clientDir = path.join(app.getAppPath(), 'client', 'dist')
  await startServer({ port: PORT, projectsRoot, clientDir })

  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadURL(`http://localhost:${PORT}`)
  }
}

// Local dev sites (e.g. Local by Flywheel *.local) use self-signed certs that
// Electron's webview rejects by default, leaving a white screen. Trust them for
// loopback / .local hosts only.
function allowLocalSelfSignedCerts() {
  app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
    let host = ''
    try { host = new URL(url).hostname } catch { /* ignore */ }
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')
    if (isLocal) { event.preventDefault(); callback(true) }
    else callback(false)
  })
}

app.whenReady().then(() => {
  allowLocalSelfSignedCerts()
  stripFramingHeaders()
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
