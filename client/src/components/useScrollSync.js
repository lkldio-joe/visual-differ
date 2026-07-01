// client/src/components/useScrollSync.js
import { useEffect } from 'react'

export function useScrollSync({ webviewRef, imgScrollRef, enabled, scale = 1 }) {
  useEffect(() => {
    if (!enabled) return
    const img = imgScrollRef.current
    const webview = webviewRef.current
    if (!img || !webview) return
    let lock = false

    // img.scrollTop is in on-screen px; the webview scrolls in CSS px (layout
    // viewport), which renders at `scale` on screen. Convert between the two so
    // both panes move together visually at any zoom level.
    function setWebviewScroll(top) {
      webview.executeJavaScript(`window.scrollTo(0, ${Number(top)})`).catch(() => {})
    }
    function onImgScroll() {
      if (lock) return
      lock = true
      setWebviewScroll(img.scrollTop / scale)
      requestAnimationFrame(() => { lock = false })
    }
    async function onWebviewScroll() {
      if (lock) return
      lock = true
      try { img.scrollTop = (await webview.executeJavaScript('window.scrollY')) * scale } catch {}
      requestAnimationFrame(() => { lock = false })
    }

    img.addEventListener('scroll', onImgScroll)
    const poll = setInterval(onWebviewScroll, 100) // webview has no DOM scroll event to listen to
    return () => { img.removeEventListener('scroll', onImgScroll); clearInterval(poll) }
  }, [enabled, webviewRef, imgScrollRef, scale])
}
