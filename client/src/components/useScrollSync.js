// client/src/components/useScrollSync.js
import { useEffect } from 'react'

export function useScrollSync({ webviewRef, imgScrollRef, enabled }) {
  useEffect(() => {
    if (!enabled) return
    const img = imgScrollRef.current
    const webview = webviewRef.current
    if (!img || !webview) return
    let lock = false

    function setWebviewScroll(top) {
      webview.executeJavaScript(`window.scrollTo(0, ${Number(top)})`).catch(() => {})
    }
    function onImgScroll() {
      if (lock) return
      lock = true
      setWebviewScroll(img.scrollTop)
      requestAnimationFrame(() => { lock = false })
    }
    async function onWebviewScroll() {
      if (lock) return
      lock = true
      try { img.scrollTop = await webview.executeJavaScript('window.scrollY') } catch {}
      requestAnimationFrame(() => { lock = false })
    }

    img.addEventListener('scroll', onImgScroll)
    const poll = setInterval(onWebviewScroll, 100) // webview has no DOM scroll event to listen to
    return () => { img.removeEventListener('scroll', onImgScroll); clearInterval(poll) }
  }, [enabled, webviewRef, imgScrollRef])
}
