// Annotation layer — select text, attach a note, copy it all back out as
// markdown that Claude can act on. Notes persist in localStorage keyed by a
// hash of the markdown source, so they survive reloads and tab discard but
// correctly stay gone once the doc itself changes.
export const ANNOTATE_CSS = `
:root {
  --anno-w: 340px;
  --anno-accent: #d9730d;
  --anno-accent-soft: #d9730d1f;
  --anno-ease: cubic-bezier(.2,.8,.2,1);
  --anno-pending: #fdecc8;
  /* Own copy of the styles.mjs palette (same values, --anno-* names) so the
     layer renders identically when injected into an arbitrary HTML page and
     never collides with host CSS variables. Update both when theming. */
  --anno-bg:#ffffff; --anno-fg:#37352f; --anno-muted:#787066; --anno-faint:#9b9689;
  --anno-border:#37352f1a; --anno-border-strong:#37352f2e; --anno-link:#2383e2;
  --anno-code-fg:#eb5757; --anno-code-bg:#37352f0f; --anno-block-bg:#f7f6f3;
  --anno-mark:#fdecc8; --anno-sel:#2383e240; --anno-ok:#448361;
  --anno-shadow:0 1px 2px #37352f14, 0 6px 24px #37352f0f;
}
@media (prefers-color-scheme: dark) {
  :root {
    --anno-accent: #ffa344; --anno-accent-soft: #ffa3441f;
    --anno-pending: #56452766;
    --anno-bg:#191919; --anno-fg:#d4d4d2; --anno-muted:#9b9b98; --anno-faint:#6f6f6c;
    --anno-border:#ffffff17; --anno-border-strong:#ffffff26; --anno-link:#529cca;
    --anno-code-fg:#ff7369; --anno-code-bg:#ffffff12; --anno-block-bg:#252525;
    --anno-mark:#56452766; --anno-sel:#529cca40; --anno-ok:#4dab9a;
    --anno-shadow:0 1px 2px #0000004d, 0 6px 24px #00000040;
  }
}
body { transition: padding-right .24s var(--anno-ease); }
@media (min-width: 1060px) {
  body.anno-open { padding-right: var(--anno-w); }
}
/* Highlights */
mark.anno, mark.anno-pending {
  background: var(--anno-mark); border-radius: 2px; padding: .05em 0;
  box-shadow: inset 0 -2px 0 transparent;
  transition: background .14s, box-shadow .14s;
}
mark.anno { cursor: pointer; }
mark.anno:hover { box-shadow: inset 0 -2px 0 var(--anno-accent); }
mark.anno.anno-active {
  background: var(--anno-accent-soft); box-shadow: inset 0 -2px 0 var(--anno-accent);
}
mark.anno-pending { background: var(--anno-pending); box-shadow: inset 0 -2px 0 var(--anno-accent); }
/* Inline code has its own padding, which a mark around the text alone can't
   reach — tint the code element itself so the highlight reads as continuous. */
:not(pre) > code:has(mark.anno) { background: var(--anno-mark); }
:not(pre) > code:has(mark.anno.anno-active) { background: var(--anno-accent-soft); }
:not(pre) > code:has(mark.anno-pending) { background: var(--anno-pending); }
/* Selection pill */
.anno-pill {
  position: absolute; z-index: 45; display: flex; align-items: center; gap: 6px;
  padding: .42em .7em .42em .6em; color: var(--anno-fg); background: var(--anno-bg);
  border: 1px solid var(--anno-border-strong); border-radius: 8px;
  box-shadow: var(--anno-shadow); font: inherit; font-size: .78em; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  animation: anno-pop .13s var(--anno-ease);
}
.anno-pill:hover { background: var(--anno-block-bg); }
.anno-pill svg { width: 13px; height: 13px; opacity: .75; }
.anno-pill .anno-kbd { color: var(--anno-faint); font-size: .9em; font-weight: 500; }
/* Composer */
.anno-composer {
  position: absolute; z-index: 46; width: 328px; padding: 12px;
  background: var(--anno-bg); border: 1px solid var(--anno-border-strong);
  border-radius: 12px; box-shadow: var(--anno-shadow);
  animation: anno-pop .16s var(--anno-ease);
}
.anno-composer-quote {
  margin: 0 0 9px; padding-left: 8px; color: var(--anno-muted);
  border-left: 2px solid var(--anno-accent); font-size: .78em; line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.anno-composer textarea {
  display: block; width: 100%; min-height: 68px; resize: vertical;
  padding: 9px 10px; color: var(--anno-fg); background: var(--anno-block-bg);
  border: 1px solid var(--anno-border); border-radius: 8px;
  font: inherit; font-size: .88em; line-height: 1.55;
  transition: border-color .12s, box-shadow .12s;
}
.anno-composer textarea::placeholder { color: var(--anno-faint); }
.anno-composer textarea:focus {
  outline: 0; border-color: var(--anno-link); box-shadow: 0 0 0 3px var(--anno-sel);
}
.anno-composer-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px;
}
.anno-hint { color: var(--anno-faint); font-size: .72em; }
.anno-btn {
  padding: .34em .8em; color: var(--anno-fg); background: transparent;
  border: 1px solid transparent; border-radius: 6px;
  font: inherit; font-size: .8em; font-weight: 600; cursor: pointer;
  transition: background .12s, opacity .12s;
}
.anno-btn:hover { background: var(--anno-code-bg); }
.anno-btn-primary { color: #fff; background: var(--anno-link); }
.anno-btn-primary:hover { background: var(--anno-link); filter: brightness(1.08); }
.anno-btn-primary:disabled { opacity: .4; cursor: default; filter: none; }
/* Sidebar */
.anno-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 30;
  display: flex; flex-direction: column; width: var(--anno-w);
  background: var(--anno-bg); border-left: 1px solid var(--anno-border);
  visibility: hidden; transform: translateX(100%);
  transition: transform .24s var(--anno-ease), visibility .24s;
}
body.anno-open .anno-panel { visibility: visible; transform: none; }
.anno-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 15px 12px 15px 16px; border-bottom: 1px solid var(--anno-border);
}
.anno-title {
  display: flex; align-items: baseline; gap: 7px;
  font-size: .78em; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; color: var(--anno-muted);
}
.anno-title span { color: var(--anno-faint); font-weight: 600; letter-spacing: 0; }
.anno-icon {
  display: grid; place-items: center; width: 26px; height: 26px; padding: 0;
  color: var(--anno-muted); background: none; border: 0; border-radius: 6px;
  font-size: 1.1em; line-height: 1; cursor: pointer; transition: background .12s, color .12s;
}
.anno-icon:hover { color: var(--anno-fg); background: var(--anno-code-bg); }
.anno-list { flex: 1; overflow-y: auto; padding: 10px; scroll-behavior: smooth; }
.anno-empty { padding: 30px 20px; color: var(--anno-muted); font-size: .84em; line-height: 1.7; }
.anno-empty kbd { font-size: .85em; }
.anno-card {
  position: relative; padding: 11px 12px; margin-bottom: 8px; cursor: pointer;
  background: var(--anno-block-bg); border: 1px solid var(--anno-border);
  border-radius: 10px;
  transition: border-color .14s, box-shadow .14s, transform .14s var(--anno-ease);
}
.anno-card:hover { border-color: var(--anno-border-strong); transform: translateX(-2px); }
.anno-card.anno-active {
  border-color: var(--anno-accent); box-shadow: 0 0 0 1px var(--anno-accent), var(--anno-shadow);
}
.anno-card.anno-new { animation: anno-slide .26s var(--anno-ease); }
.anno-sec {
  display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--anno-muted); font-size: .68em; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; margin-bottom: 6px; padding-right: 46px;
}
.anno-quote {
  color: var(--anno-muted); font-size: .77em; line-height: 1.45; margin-bottom: 7px;
  padding-left: 8px; border-left: 2px solid var(--anno-border-strong);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  transition: border-color .14s;
}
.anno-card:hover .anno-quote, .anno-card.anno-active .anno-quote { border-left-color: var(--anno-accent); }
.anno-text { font-size: .85em; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
.anno-del, .anno-edit {
  position: absolute; top: 7px; display: grid; place-items: center;
  width: 22px; height: 22px; padding: 0; opacity: 0;
  color: var(--anno-muted); background: none; border: 0; border-radius: 5px;
  font-size: 1.05em; line-height: 1; cursor: pointer;
  transition: opacity .12s, color .12s, background .12s;
}
.anno-del { right: 7px; }
.anno-edit { right: 31px; font-size: .85em; }
.anno-card:hover .anno-del, .anno-del:focus-visible,
.anno-card:hover .anno-edit, .anno-edit:focus-visible { opacity: 1; }
.anno-del:hover, .anno-edit:hover { color: var(--anno-code-fg); background: var(--anno-code-bg); }
.anno-edit-ta {
  display: block; width: 100%; min-height: 54px; resize: vertical;
  padding: 7px 8px; color: var(--anno-fg); background: var(--anno-bg);
  border: 1px solid var(--anno-link); border-radius: 6px;
  font: inherit; font-size: .85em; line-height: 1.55;
}
.anno-edit-ta:focus { outline: 0; box-shadow: 0 0 0 3px var(--anno-sel); }
.anno-foot { padding: 10px; border-top: 1px solid var(--anno-border); }
.anno-copy {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; padding: .65em; color: #fff; background: var(--anno-link);
  border: 0; border-radius: 8px; font: inherit; font-size: .85em;
  font-weight: 600; cursor: pointer; transition: background .14s, opacity .14s;
}
.anno-copy:hover:not(:disabled) { filter: brightness(1.08); }
.anno-copy:disabled { opacity: .4; cursor: default; }
.anno-copy.anno-done { background: var(--anno-ok); }
/* Floating toggle */
.anno-fab {
  position: fixed; right: 20px; bottom: 20px; z-index: 30;
  display: flex; align-items: center; gap: 8px; padding: .58em .95em;
  color: var(--anno-fg); background: var(--anno-bg);
  border: 1px solid var(--anno-border-strong); border-radius: 999px;
  box-shadow: var(--anno-shadow); font: inherit; font-size: .82em;
  font-weight: 600; cursor: pointer;
  transition: transform .2s var(--anno-ease), opacity .2s, border-color .12s;
}
.anno-fab:hover { border-color: var(--anno-fg); }
.anno-fab svg { width: 14px; height: 14px; opacity: .7; }
body.anno-open .anno-fab { opacity: 0; transform: scale(.9) translateY(6px); pointer-events: none; }
.anno-count {
  min-width: 17px; padding: 1px 5px; color: #fff; background: var(--anno-accent);
  border-radius: 999px; font-size: .82em; line-height: 1.5; text-align: center;
}
.anno-toast {
  position: fixed; left: 50%; bottom: 26px; z-index: 50;
  transform: translate(-50%, 10px); opacity: 0; pointer-events: none;
  padding: .55em 1.05em; color: var(--anno-bg); background: var(--anno-fg);
  border-radius: 999px; font-size: .8em; font-weight: 600;
  transition: opacity .18s var(--anno-ease), transform .18s var(--anno-ease);
}
.anno-toast.anno-show { opacity: 1; transform: translate(-50%, 0); }
@keyframes anno-pop {
  from { opacity: 0; transform: translateY(4px) scale(.97); }
  to { opacity: 1; transform: none; }
}
@keyframes anno-slide {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, .anno-panel, .anno-card, .anno-fab, body { transition: none !important; animation: none !important; }
}
@media print {
  .anno-panel, .anno-fab, .anno-composer, .anno-toast, .anno-pill { display: none !important; }
  body.anno-open { padding-right: 0; }
  mark.anno { background: none; box-shadow: none; }
}
/* Last so the font-family beats the earlier font:inherit shorthands: the UI
   must not depend on the host page's font or text color when injected into
   arbitrary HTML. Values mirror the styles.mjs body rule. */
.anno-pill, .anno-composer, .anno-panel, .anno-fab, .anno-toast {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--anno-fg);
}
`;

// Written as a real function and stringified on export: keeps the client code
// syntax-highlightable and free of template-literal escaping.
function client() {
  const notes = [];
  const isMac = navigator.platform.indexOf("Mac") === 0;
  const mod = isMac ? "⌘" : "Ctrl-";
  const BUBBLE =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linejoin="round"><path d="M14 9.5a2 2 0 0 1-2 2H6l-3.5 3v-3h-.5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';

  let seq = 0;
  let active = null;
  let composer = null;
  let pill = null;
  let pending = [];

  const body = document.body;
  const file = body.dataset.mdFile || "document";
  // Rendered markdown wraps content in .markdown-body; an arbitrary HTML page
  // (html mode) has no such wrapper, so the whole body is the article. The UI
  // is appended to body too — everything that reads text must skip it (inUI).
  const article = document.querySelector(".markdown-body") || body;
  const PREFIX = "mdopen:v1:";
  const KEY = PREFIX + (body.dataset.mdHash || "nohash");
  const MAX_AGE = 30 * 864e5;
  const MAX_DOCS = 40;

  // Safari and some embedded webviews throw on storage access rather than
  // returning null, so probe once and degrade to in-memory notes if absent.
  const store = (function () {
    try {
      localStorage.setItem(PREFIX + "probe", "1");
      localStorage.removeItem(PREFIX + "probe");
      return localStorage;
    } catch (e) {
      return null;
    }
  })();

  const panel = document.createElement("aside");
  panel.className = "anno-panel";
  panel.innerHTML =
    '<div class="anno-head"><span class="anno-title">Notes <span data-count></span></span>' +
    '<button class="anno-icon" data-close title="Hide panel">›</button></div>' +
    '<div class="anno-list"></div>' +
    '<div class="anno-foot"><button class="anno-copy" disabled>Copy for Claude</button></div>';
  const list = panel.querySelector(".anno-list");
  const copyBtn = panel.querySelector(".anno-copy");
  const countEl = panel.querySelector("[data-count]");

  const fab = document.createElement("button");
  fab.className = "anno-fab";
  fab.title = "Show notes";

  const toast = document.createElement("div");
  toast.className = "anno-toast";

  document.body.append(panel, fab, toast);

  function flash(msg) {
    toast.textContent = msg;
    toast.classList.add("anno-show");
    clearTimeout(flash.t);
    flash.t = setTimeout(function () {
      toast.classList.remove("anno-show");
    }, 1700);
  }

  function inUI(node) {
    if (!node) return false;
    const el = node.nodeType === 1 ? node : node.parentElement;
    return !!el && !!el.closest(".anno-panel, .anno-composer, .anno-pill, .anno-fab, .anno-toast");
  }

  // --- anchoring -----------------------------------------------------------

  // Split the boundary text nodes so the range lands exactly on node edges;
  // every node it then covers can be wrapped whole.
  function splitBoundaries(range) {
    const sc = range.startContainer;
    if (sc.nodeType === 3 && range.startOffset > 0 && range.startOffset < sc.nodeValue.length) {
      const sameNode = range.endContainer === sc;
      const endOff = range.endOffset;
      const cut = range.startOffset;
      const tail = sc.splitText(cut);
      range.setStart(tail, 0);
      if (sameNode) range.setEnd(tail, endOff - cut);
    }
    const ec = range.endContainer;
    if (ec.nodeType === 3 && range.endOffset > 0 && range.endOffset < ec.nodeValue.length) {
      ec.splitText(range.endOffset);
      range.setEnd(ec, ec.nodeValue.length);
    }
  }

  function textNodesIn(range) {
    const root = range.commonAncestorContainer;
    const walker = document.createTreeWalker(
      root.nodeType === 3 ? root.parentNode : root,
      NodeFilter.SHOW_TEXT
    );
    const out = [];
    let n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      if (range.comparePoint(n, 0) >= 0 && range.comparePoint(n, n.nodeValue.length) <= 0) {
        out.push(n);
      }
    }
    return out;
  }

  function wrapRange(range, cls, id) {
    splitBoundaries(range);
    return textNodesIn(range).map(function (n) {
      const m = document.createElement("mark");
      m.className = cls;
      if (id) m.dataset.anno = id;
      n.parentNode.insertBefore(m, n);
      m.appendChild(n);
      return m;
    });
  }

  function unwrap(marks) {
    marks.forEach(function (m) {
      const parent = m.parentNode;
      if (!parent) return;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
  }

  // --- character offsets --------------------------------------------------
  //
  // Wrapping text in <mark> splits text nodes but never changes the characters
  // themselves, so an offset into the article's text stays valid no matter how
  // many highlights already exist — which makes it a stable anchor to store.

  function charOffset(container, offset) {
    const r = document.createRange();
    r.setStart(article, 0);
    r.setEnd(container, offset);
    return r.toString().length;
  }

  function textIndex() {
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    const idx = [];
    let total = 0;
    let n;
    while ((n = walker.nextNode())) {
      if (inUI(n)) continue; // when article === body, the panel's text is inside it
      idx.push({ node: n, start: total });
      total += n.nodeValue.length;
    }
    return idx;
  }

  function pointAt(idx, target, isEnd) {
    for (let i = 0; i < idx.length; i++) {
      const e = idx[i];
      const end = e.start + e.node.nodeValue.length;
      const hit = isEnd ? target > e.start && target <= end : target >= e.start && target < end;
      if (hit) return { node: e.node, off: target - e.start };
    }
    return null;
  }

  // Rebuilt per note: each wrapRange re-splits nodes and invalidates the index.
  function rangeFromOffsets(start, end) {
    const idx = textIndex();
    const s = pointAt(idx, start, false);
    const e = pointAt(idx, end, true);
    if (!s || !e) return null;
    const r = document.createRange();
    r.setStart(s.node, s.off);
    r.setEnd(e.node, e.off);
    return r;
  }

  // Nearest heading at or above the anchor, in document order.
  function sectionOf(el) {
    const own = el.closest("h1,h2,h3,h4,h5,h6");
    if (own) return own.textContent.trim();
    let n = el;
    while (n && n !== document.body) {
      let p = n.previousElementSibling;
      while (p) {
        if (/^H[1-6]$/.test(p.tagName)) return p.textContent.trim();
        const nested = p.querySelectorAll("h1,h2,h3,h4,h5,h6");
        if (nested.length) return nested[nested.length - 1].textContent.trim();
        p = p.previousElementSibling;
      }
      n = n.parentElement;
    }
    return null;
  }

  // --- notes ---------------------------------------------------------------

  // Takes the marks the composer already placed rather than a Range: by save
  // time the range has been invalidated by wrapping and normalize().
  function addNote(marks, quote, anchor, text, silent) {
    const id = "n" + ++seq;
    marks.forEach(function (m) {
      m.className = "anno";
      m.dataset.anno = id;
    });
    const note = {
      id: id, text: text, marks: marks, fresh: !silent,
      quote: marks.length ? quote : null,
      anchor: marks.length ? anchor : null,
      section: marks.length ? sectionOf(marks[0]) : null,
    };
    notes.push(note);
    body.classList.add("anno-open");
    render();
    note.fresh = false;
    if (!silent) {
      setActive(id, false);
      persist();
    }
  }

  // Swap the card's text for a textarea in place. Blur commits (so clicking
  // anywhere else just saves); Esc reverts. Empty text keeps the old note
  // rather than silently deleting it — delete is its own button.
  function startEdit(note) {
    const card = list.querySelector('[data-anno="' + note.id + '"]');
    if (!card || card.querySelector("textarea")) return;
    const t = card.querySelector(".anno-text");
    const ta = document.createElement("textarea");
    ta.className = "anno-edit-ta";
    ta.value = note.text;
    t.replaceWith(ta);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    ta.onclick = function (e) { e.stopPropagation(); };
    let done = false;
    function finish(saveIt) {
      if (done) return;
      done = true;
      const v = ta.value.trim();
      if (saveIt && v && v !== note.text) {
        note.text = v;
        persist();
      }
      render();
    }
    ta.onblur = function () { finish(true); };
    ta.onkeydown = function (e) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.stopPropagation();
        finish(false);
      }
    };
  }

  function removeNote(id) {
    const i = notes.findIndex(function (n) { return n.id === id; });
    if (i === -1) return;
    unwrap(notes[i].marks);
    notes.splice(i, 1);
    if (active === id) active = null;
    render();
    persist();
  }

  // --- persistence ---------------------------------------------------------

  function persist() {
    if (!store) return;
    try {
      if (!notes.length) return store.removeItem(KEY);
      store.setItem(KEY, JSON.stringify({
        file: file,
        at: Date.now(),
        notes: notes.map(function (n) {
          return { text: n.text, quote: n.quote, anchor: n.anchor };
        }),
      }));
    } catch (e) {
      flash("Couldn't save notes — storage is full");
    }
  }

  // Drop stale docs so a year of annotating can't fill the origin's quota.
  function prune() {
    if (!store) return;
    const mine = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (!k || k.indexOf(PREFIX) !== 0) continue;
      let at = 0;
      try { at = (JSON.parse(store.getItem(k)) || {}).at || 0; } catch (e) { at = 0; }
      mine.push({ key: k, at: at });
    }
    const dead = mine.filter(function (e) { return Date.now() - e.at > MAX_AGE; });
    const live = mine.filter(function (e) { return Date.now() - e.at <= MAX_AGE; });
    live.sort(function (a, b) { return b.at - a.at; });
    dead.concat(live.slice(MAX_DOCS)).forEach(function (e) {
      if (e.key !== KEY) store.removeItem(e.key);
    });
  }

  function restore() {
    if (!store) return;
    let saved;
    try { saved = JSON.parse(store.getItem(KEY) || "null"); } catch (e) { return; }
    if (!saved || !saved.notes || !saved.notes.length) return;
    let n = 0;
    saved.notes.forEach(function (s) {
      let marks = [];
      if (s.anchor) {
        const r = rangeFromOffsets(s.anchor.start, s.anchor.end);
        // The hash guarantees identical text, so this should always match;
        // if it somehow doesn't, drop the note rather than mis-anchor it.
        if (!r || r.toString().replace(/\s+/g, " ").trim() !== s.quote) return;
        marks = wrapRange(r, "anno", null);
      }
      addNote(marks, s.quote, s.anchor, s.text, true);
      n++;
    });
    if (n) flash("Restored " + n + " note" + (n > 1 ? "s" : ""));
  }

  function ordered() {
    const anchored = notes.filter(function (n) { return n.marks.length; });
    const general = notes.filter(function (n) { return !n.marks.length; });
    anchored.sort(function (a, b) {
      const rel = a.marks[0].compareDocumentPosition(b.marks[0]);
      return rel & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    return anchored.concat(general);
  }

  function setActive(id, scrollDoc) {
    active = id;
    document.querySelectorAll("mark.anno").forEach(function (m) {
      m.classList.toggle("anno-active", m.dataset.anno === id);
    });
    list.querySelectorAll(".anno-card").forEach(function (c) {
      c.classList.toggle("anno-active", c.dataset.anno === id);
    });
    const note = notes.find(function (n) { return n.id === id; });
    if (scrollDoc && note && note.marks.length) {
      note.marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const card = list.querySelector('[data-anno="' + id + '"]');
    if (card) card.scrollIntoView({ block: "nearest" });
  }

  function render() {
    const n = notes.length;
    countEl.textContent = n || "";
    fab.innerHTML = BUBBLE + "<span>Notes</span>" +
      (n ? '<span class="anno-count">' + n + "</span>" : "");
    copyBtn.disabled = !n;
    copyBtn.classList.remove("anno-done");
    copyBtn.textContent = n
      ? "Copy " + n + " note" + (n > 1 ? "s" : "") + " for Claude"
      : "Copy for Claude";
    list.textContent = "";
    if (!n) {
      const empty = document.createElement("div");
      empty.className = "anno-empty";
      empty.innerHTML =
        "Select any text to leave a note on it — or press <kbd>" + mod + "K</kbd>.<br><br>" +
        "With nothing selected, <kbd>" + mod + "K</kbd> leaves a general note on the whole document.<br><br>" +
        "When you're done, copy everything as markdown and paste it straight into Claude.";
      list.append(empty);
      return;
    }
    ordered().forEach(function (note) {
      const card = document.createElement("div");
      card.className = "anno-card" + (note.id === active ? " anno-active" : "") +
        (note.fresh ? " anno-new" : "");
      card.dataset.anno = note.id;
      const del = document.createElement("button");
      del.className = "anno-del";
      del.textContent = "×";
      del.title = "Delete note";
      del.onclick = function (e) {
        e.stopPropagation();
        removeNote(note.id);
      };
      const edit = document.createElement("button");
      edit.className = "anno-edit";
      edit.textContent = "✎";
      edit.title = "Edit note";
      edit.onclick = function (e) {
        e.stopPropagation();
        setActive(note.id, false);
        startEdit(note);
      };
      card.append(edit, del);
      const sec = document.createElement("div");
      sec.className = "anno-sec";
      sec.textContent = note.section || (note.quote ? "Unsectioned" : "General");
      card.append(sec);
      if (note.quote) {
        const q = document.createElement("div");
        q.className = "anno-quote";
        q.textContent = note.quote;
        card.append(q);
      }
      const t = document.createElement("div");
      t.className = "anno-text";
      t.textContent = note.text;
      card.append(t);
      card.onclick = function () { setActive(note.id, true); };
      list.append(card);
    });
  }

  // --- copy ----------------------------------------------------------------

  // Elide the middle of long quotes: enough head and tail for Claude to locate
  // the passage without pasting three paragraphs back at it.
  function trim(q) {
    if (q.length <= 240) return q;
    return q.slice(0, 150).trim() + " … " + q.slice(-70).trim();
  }

  function build() {
    const items = ordered();
    const lines = [
      "Feedback on " + file + " (" + items.length + " note" + (items.length > 1 ? "s" : "") + ")",
      "",
    ];
    items.forEach(function (note, i) {
      const head = i + 1 + ".";
      if (note.quote) {
        lines.push(head + " " + (note.section ? "§ " + note.section : "(no section)"));
        lines.push('   > "' + trim(note.quote) + '"');
      } else {
        lines.push(head + " General");
      }
      note.text.split("\n").forEach(function (l) { lines.push("   " + l); });
      lines.push("");
    });
    return lines.join("\n").trim() + "\n";
  }

  function copied() {
    copyBtn.classList.add("anno-done");
    copyBtn.textContent = "✓ Copied — paste into Claude";
    clearTimeout(copied.t);
    copied.t = setTimeout(render, 2200);
  }

  function copy() {
    const text = build();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      try { document.execCommand("copy"); copied(); }
      catch (e) { flash("Copy failed — check clipboard permissions"); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(copied, fallback);
    } else fallback();
  }

  // --- selection pill ------------------------------------------------------

  function hidePill() {
    if (pill) pill.remove();
    pill = null;
  }

  function showPill(range) {
    hidePill();
    const el = document.createElement("button");
    el.className = "anno-pill";
    el.innerHTML = BUBBLE + "<span>Comment</span><span class=\"anno-kbd\">" + mod + "K</span>";
    const r = range.getBoundingClientRect();
    document.body.append(el);
    const w = el.offsetWidth;
    const top = r.top + scrollY - el.offsetHeight - 8;
    el.style.top = (top < scrollY + 4 ? r.bottom + scrollY + 8 : top) + "px";
    el.style.left = clampLeft(r.left + r.width / 2 + scrollX - w / 2, w) + "px";
    el.onmousedown = function (e) { e.preventDefault(); };
    // Without this the click reaches the document handler, which reads the
    // just-opened composer as an outside click and closes it.
    el.onclick = function (e) {
      e.stopPropagation();
      openComposer(range.cloneRange());
    };
    pill = el;
  }

  function clampLeft(x, w) {
    const gutter = body.classList.contains("anno-open") && innerWidth >= 1060 ? 340 : 0;
    return Math.max(12, Math.min(x, document.documentElement.clientWidth - w - gutter - 12));
  }

  function liveRange() {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed || !sel.toString().trim()) return null;
    if (inUI(sel.anchorNode) || inUI(sel.focusNode)) return null;
    return sel.getRangeAt(0);
  }

  document.addEventListener("mouseup", function () {
    setTimeout(function () {
      if (composer) return;
      const r = liveRange();
      if (r) showPill(r);
      else hidePill();
    }, 0);
  });
  document.addEventListener("mousedown", function (e) {
    if (!pill || !pill.contains(e.target)) hidePill();
  });

  // --- composer ------------------------------------------------------------

  function closeComposer(keepSelection) {
    if (composer) composer.remove();
    composer = null;
    unwrap(pending);
    pending = [];
    if (!keepSelection) getSelection().removeAllRanges();
  }

  function openComposer(range) {
    hidePill();
    closeComposer(true);
    // Read the quote, geometry and anchor before wrapping — wrapping splits the
    // very text nodes the range's boundaries point at.
    const quote = range ? range.toString().replace(/\s+/g, " ").trim() : null;
    const rect = range ? range.getBoundingClientRect() : null;
    let anchor = null;
    if (range) {
      const start = charOffset(range.startContainer, range.startOffset);
      anchor = { start: start, end: start + range.toString().length };
    }

    // Keep the passage visibly highlighted while the note is being written —
    // the selection itself is lost as soon as the textarea takes focus. These
    // same marks get promoted to the real highlight on save.
    if (range) pending = wrapRange(range, "anno-pending", null);
    getSelection().removeAllRanges();

    const el = document.createElement("div");
    el.className = "anno-composer";
    el.innerHTML =
      (quote ? '<p class="anno-composer-quote"></p>' : "") +
      '<textarea rows="3" placeholder="' +
      (quote ? "Add a note…" : "A note about the whole document…") +
      '"></textarea><div class="anno-composer-foot">' +
      '<span class="anno-hint">' + mod + "↵ to save · Esc to cancel</span>" +
      '<span><button class="anno-btn" data-cancel>Cancel</button>' +
      '<button class="anno-btn anno-btn-primary" data-save disabled>Add note</button></span></div>';
    if (quote) el.querySelector(".anno-composer-quote").textContent = quote;

    document.body.append(el);
    const w = el.offsetWidth;
    const below = rect ? rect.bottom + scrollY + 8 : scrollY + innerHeight / 3;
    const fits = !rect || rect.bottom + el.offsetHeight + 16 < innerHeight;
    el.style.top = (fits ? below : Math.max(scrollY + 12, rect.top + scrollY - el.offsetHeight - 8)) + "px";
    el.style.left = clampLeft(rect ? rect.left + scrollX : innerWidth / 2 - w / 2, w) + "px";
    composer = el;

    const ta = el.querySelector("textarea");
    const saveBtn = el.querySelector("[data-save]");
    ta.focus();
    ta.addEventListener("input", function () {
      saveBtn.disabled = !ta.value.trim();
    });

    function save() {
      const text = ta.value.trim();
      if (!text) return ta.focus();
      const marks = pending;
      pending = []; // hand the marks off so closeComposer leaves them in place
      closeComposer();
      addNote(marks, quote, anchor, text);
    }
    saveBtn.onclick = save;
    el.querySelector("[data-cancel]").onclick = function () { closeComposer(); };
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
    });
  }

  // --- wiring --------------------------------------------------------------

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const r = liveRange();
      openComposer(r ? r.cloneRange() : null);
    } else if (e.key === "Escape") {
      if (composer) closeComposer();
      else if (pill) hidePill();
      else if (body.classList.contains("anno-open")) body.classList.remove("anno-open");
    }
  });

  document.addEventListener("click", function (e) {
    const m = e.target.closest("mark.anno");
    if (m) {
      body.classList.add("anno-open");
      return setActive(m.dataset.anno, false);
    }
    if (composer && !composer.contains(e.target)) closeComposer();
  });

  // html mode injects a <base> so the page's relative assets keep resolving
  // against its original directory — which also silently retargets same-page
  // #links there. Restore in-page anchor behavior when a base is present.
  if (document.querySelector("base")) {
    document.addEventListener("click", function (e) {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      const id = a.getAttribute("href").slice(1);
      const t = id && (document.getElementById(id) || document.getElementsByName(id)[0]);
      if (t) t.scrollIntoView();
    });
  }

  fab.onclick = function () { body.classList.add("anno-open"); };
  panel.querySelector("[data-close]").onclick = function () { body.classList.remove("anno-open"); };
  copyBtn.onclick = copy;

  // Only worth nagging about when notes can't be recovered on reload.
  if (!store) {
    addEventListener("beforeunload", function (e) {
      if (notes.length) { e.preventDefault(); e.returnValue = ""; }
    });
  }

  render();
  prune();
  restore();
}

export const ANNOTATE_JS = "(" + client.toString() + ")();";
