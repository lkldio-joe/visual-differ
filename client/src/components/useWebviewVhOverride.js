import { useEffect } from 'react'

// Remaps viewport-height units in the LIVE page to a fixed px value without
// touching the real viewport — so the page still fills the pane and scrolls
// naturally. 100vh -> `vh` px, 50vh -> vh/2, etc. Pass null to restore.
//
// Why injection instead of resizing the viewport: `vh` is by definition the
// viewport height, so any viewport-based method (zoom/element-height/device
// emulation) clips the live view to that height. Rewriting the height-ish
// declarations that use vh leaves the viewport (and scrolling) alone.
function buildScript(vh) {
  const target = vh == null ? 'null' : String(Number(vh))
  return `(() => {
  const TARGET = ${target};
  const PROPS = ['height','min-height','max-height'];
  const conv = (val) => val.replace(/(-?[0-9.]+)vh/g, (_, n) => ((parseFloat(n) / 100) * TARGET) + 'px');

  // 1) Same-origin stylesheet rules -> one override <style> (recurse @media etc.)
  const out = [];
  const walk = (rules) => {
    for (const r of Array.from(rules || [])) {
      if (r.cssRules && !r.style) { walk(r.cssRules); continue; }
      if (!r.style || !r.selectorText) continue;
      for (const p of PROPS) {
        const v = r.style.getPropertyValue(p);
        if (v && v.indexOf('vh') !== -1) out.push(r.selectorText + '{' + p + ':' + conv(v) + ' !important;}');
      }
    }
  };
  for (const s of Array.from(document.styleSheets)) { try { walk(s.cssRules); } catch (e) { /* cross-origin */ } }
  let tag = document.getElementById('__vdiff_vh');
  if (TARGET == null) { if (tag) tag.remove(); }
  else {
    if (!tag) { tag = document.createElement('style'); tag.id = '__vdiff_vh'; document.documentElement.appendChild(tag); }
    tag.textContent = out.join('\\n');
  }

  // 2) Inline styles -> rewrite in place, remembering the original to restore.
  document.querySelectorAll('[style*="vh"], [data-vdiffvh]').forEach((el) => {
    let orig = null;
    try { orig = JSON.parse(el.dataset.vdiffvh || 'null'); } catch (e) {}
    if (!orig) {
      orig = {};
      for (const p of PROPS) { const v = el.style.getPropertyValue(p); if (v && v.indexOf('vh') !== -1) orig[p] = v; }
      if (Object.keys(orig).length) el.dataset.vdiffvh = JSON.stringify(orig);
    }
    for (const p of PROPS) {
      if (!(p in orig)) continue;
      if (TARGET == null) el.style.setProperty(p, orig[p]);
      else el.style.setProperty(p, conv(orig[p]), 'important');
    }
    if (TARGET == null) delete el.dataset.vdiffvh;
  });
})();`
}

export function useWebviewVhOverride(webviewRef, vh) {
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const apply = () => { try { wv.executeJavaScript(buildScript(vh)) } catch { /* not ready */ } }
    wv.addEventListener('dom-ready', apply)
    wv.addEventListener('did-stop-loading', apply) // catch late-loaded stylesheets
    apply()
    return () => {
      wv.removeEventListener('dom-ready', apply)
      wv.removeEventListener('did-stop-loading', apply)
    }
  }, [webviewRef, vh])
}
