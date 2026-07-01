// client/src/api.js
export function apiBase() {
  return (typeof window !== 'undefined' && window.vdiff?.apiBase != null)
    ? window.vdiff.apiBase
    : ''
}
export function templateUrl() { return `${apiBase()}/api/template` }
export function screenshotUrl(projectId, slug, size) {
  return `${apiBase()}/api/projects/${projectId}/screenshot/${slug}/${size}`
}
export function exportNotesUrl(projectId) { return `${apiBase()}/api/projects/${projectId}/notes/export` }

async function json(res) {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed: ${res.status}`)
  return res.json()
}
export async function listProjects() { return json(await fetch(`${apiBase()}/api/projects`)) }
export async function getProject(id) { return json(await fetch(`${apiBase()}/api/projects/${id}`)) }
export async function deleteProject(id) {
  await fetch(`${apiBase()}/api/projects/${id}`, { method: 'DELETE' })
}
export async function createProject(markdown) {
  return json(await fetch(`${apiBase()}/api/projects`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markdown }),
  }))
}
export async function getInventory(projectId) {
  const res = await fetch(`${apiBase()}/api/projects/${projectId}/inventory`)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed: ${res.status}`)
  return res.text()
}
export async function updateProject(projectId, markdown) {
  return json(await fetch(`${apiBase()}/api/projects/${projectId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markdown }),
  }))
}
export async function getNotes(projectId) { return json(await fetch(`${apiBase()}/api/projects/${projectId}/notes`)) }
export async function saveNote(projectId, pageId, size, text) {
  return json(await fetch(`${apiBase()}/api/projects/${projectId}/notes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId, size, text }),
  }))
}
export async function getSettings() { return json(await fetch(`${apiBase()}/api/settings`)) }
export async function saveSettings(figmaToken) {
  return json(await fetch(`${apiBase()}/api/settings`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ figmaToken }),
  }))
}
