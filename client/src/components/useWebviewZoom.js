import { useEffect } from 'react'

// Applies a zoom factor to the Electron <webview> so the live page is rendered
// smaller on screen while keeping its CSS layout viewport at the full design
// width. The webview element is sized to width*scale (see panes), so the layout
// viewport = elementWidth / zoomFactor = full width — desktop media queries stay
// desktop even at 50%.
//
// It also hides the live page's vertical scrollbar: with "always show scrollbars"
// the gutter renders as a ~15px gap between the live pane and the design pane, and
// removing it lets the live content reflow to the same width as the design render.
const HIDE_SCROLLBAR_CSS = '::-webkit-scrollbar{width:0 !important;height:0 !important;background:transparent !important}'

export function useWebviewZoom(webviewRef, scale) {
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const apply = () => {
      try { wv.setZoomFactor(scale) } catch { /* not dom-ready yet */ }
      try { wv.insertCSS(HIDE_SCROLLBAR_CSS) } catch { /* not dom-ready yet */ }
      // The <iframe> inside the webview's shadow DOM falls back to its default
      // 150px height in some layouts; force it to fill so the live view isn't tiny.
      try {
        const iframe = wv.shadowRoot && wv.shadowRoot.querySelector('iframe')
        if (iframe) { iframe.style.width = '100%'; iframe.style.height = '100%' }
      } catch { /* shadow root not ready */ }
    }
    wv.addEventListener('dom-ready', apply)
    apply() // covers the case where the webview is already loaded (scale changed alone)
    return () => wv.removeEventListener('dom-ready', apply)
  }, [webviewRef, scale])
}
