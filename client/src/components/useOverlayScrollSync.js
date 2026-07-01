import { useEffect } from 'react'

// In overlay mode the live page scrolls inside the webview (window scroll), while
// the design image is an absolutely-positioned overlay. Keep them aligned by
// translating the image up by the live page's scroll offset (in screen px, so
// scaled by the zoom factor). The live page drives; the image follows.
export function useOverlayScrollSync({ webviewRef, imgRef, scale = 1, enabled }) {
  useEffect(() => {
    if (!enabled) return
    const wv = webviewRef.current
    const img = imgRef.current
    if (!wv || !img) return

    let lastY = null
    const poll = setInterval(async () => {
      try {
        const y = await wv.executeJavaScript('window.scrollY')
        if (y === lastY) return
        lastY = y
        img.style.transform = `translateY(${-Math.round(y * scale)}px)`
      } catch { /* webview not ready */ }
    }, 100) // webview has no DOM scroll event to listen to

    return () => { clearInterval(poll); img.style.transform = '' }
  }, [webviewRef, imgRef, scale, enabled])
}
