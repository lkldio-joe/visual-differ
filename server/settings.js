import path from 'node:path'
import realFs from 'node:fs'

export function createSettingsStore({ settingsPath, fs = realFs }) {
  function read() {
    if (!fs.existsSync(settingsPath)) return {}
    try { return JSON.parse(fs.readFileSync(settingsPath, 'utf8') || '{}') } catch { return {} }
  }
  function write(settings) {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  }
  return {
    getToken() { return read().figmaToken || null },
    setToken(token) {
      const settings = read()
      const clean = (token || '').trim()
      if (clean) settings.figmaToken = clean
      else delete settings.figmaToken
      write(settings)
    },
    hasToken() { return !!read().figmaToken },
  }
}
