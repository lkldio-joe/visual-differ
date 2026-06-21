// electron/preload.js
const { contextBridge } = require('electron')
contextBridge.exposeInMainWorld('vdiff', {
  apiBase: process.env.VDIFF_API_BASE || '',
})
