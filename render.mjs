#!/usr/bin/env node
// mdopen — render a Markdown file to a self-contained, beautifully-styled HTML
// file in the temp dir and open it in the default browser.
//
// Usage: node render.mjs <file.md> [--no-open] [--out <path>]
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename, dirname, resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const { Marked } = require("marked");
const { markedHighlight } = require("marked-highlight");
const { gfmHeadingId } = require("marked-gfm-heading-id");
const hljs = require("highlight.js");
import { CSS } from "./styles.mjs";
import { ANNOTATE_CSS, ANNOTATE_JS } from "./annotate.mjs";

const args = process.argv.slice(2);
const noOpen = args.includes("--no-open");
const noAnnotate = args.includes("--no-annotate");
const outIdx = args.indexOf("--out");
const outPath = outIdx !== -1 ? args[outIdx + 1] : null;
const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--out");

if (!file) {
  console.error("usage: md <file.md|file.html> [--no-open] [--no-annotate] [--out <path>]");
  process.exit(1);
}

const isHtml = /\.html?$/i.test(file);

let src;
try {
  src = readFileSync(resolve(file), "utf8");
} catch (e) {
  console.error(`md: cannot read ${file}: ${e.code || e.message}`);
  process.exit(1);
}

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The HTML lands in a temp dir, so relative image paths in the markdown would
// dangle. Inline local images as data: URIs to keep the page self-contained.
const MIME = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", avif: "image/avif", bmp: "image/bmp",
};
const mdDir = dirname(resolve(file));

function inlineSrc(href) {
  if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(href)) return href; // http:, data:, //cdn
  const clean = href.replace(/[?#].*$/, "");
  const mime = MIME[clean.slice(clean.lastIndexOf(".") + 1).toLowerCase()];
  if (!mime) return href;
  let buf;
  try {
    buf = readFileSync(resolve(mdDir, decodeURIComponent(clean)));
  } catch (e) {
    console.error(`md: image not found, leaving path as-is: ${clean}`);
    return href;
  }
  if (buf.length > 20 * 1024 * 1024) {
    console.error(`md: image too large to inline (>20MB): ${clean}`);
    return href;
  }
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const marked = new Marked(
  gfmHeadingId(),
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);
marked.setOptions({ gfm: true, breaks: false });
marked.use({
  renderer: {
    image({ href, title, text }) {
      return `<img src="${esc(inlineSrc(href || ""))}" alt="${esc(text || "")}"${
        title ? ` title="${esc(title)}"` : ""}>`;
    },
  },
});

const name = basename(file);
const title = name.replace(/\.[^.]+$/, "");

// The copy output opens with this path, so make it one the agent can act on:
// relative to the invocation cwd when the file is under it, absolute otherwise.
const rel = relative(process.cwd(), resolve(file));
const displayPath = rel && !rel.startsWith("..") ? rel : resolve(file);

// Notes are restored only against a byte-identical document, so the source hash
// is the storage key: edit the doc and the old notes are stale by definition and
// simply don't come back.
const hash = createHash("sha256").update(src).digest("hex").slice(0, 16);

let html;
if (isHtml) {
  // Open the page as-is, with the annotation layer injected via plain string
  // surgery — no HTML parser, so nothing else about the document changes.
  html = src;
  if (!noAnnotate) {
    // The copy lives in a temp dir, so keep the page's relative assets
    // resolving against its original directory. (The client compensates for
    // the side effect on same-page #links.) The source was read as utf-8, so
    // pages that never declare a charset get one — otherwise the browser
    // falls back to Latin-1 and mangles the injected layer's §/⌘/✓ glyphs.
    let head = /<base\b/i.test(html) ? "" : `<base href="${esc(pathToFileURL(mdDir).href + "/")}">`;
    if (!/<meta[^>]+charset/i.test(html)) head = `<meta charset="utf-8">` + head;
    if (head) {
      html = /<head\b[^>]*>/i.test(html)
        ? html.replace(/<head\b[^>]*>/i, (m) => m + head)
        : head + html;
    }
    // <-escape so a hostile path can't smuggle a </script> in.
    const fileJs = JSON.stringify(displayPath).replace(/</g, "\\u003c");
    const inject =
      `\n<style>${ANNOTATE_CSS}</style>\n` +
      `<script>Object.assign(document.body.dataset,{mdFile:${fileJs},mdHash:"${hash}"});</script>\n` +
      `<script>${ANNOTATE_JS}</script>\n`;
    const i = html.toLowerCase().lastIndexOf("</body>");
    html = i === -1 ? html + inject : html.slice(0, i) + inject + html.slice(i);
  }
} else {
  const body = marked.parse(src);
  html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}${noAnnotate ? "" : ANNOTATE_CSS}</style>
</head>
<body data-md-file="${esc(displayPath)}" data-md-hash="${hash}">
<article class="markdown-body">
${body}
</article>
${noAnnotate ? "" : `<script>${ANNOTATE_JS}</script>`}
</body>
</html>`;
}

let dest;
if (isHtml && noAnnotate && !outPath) {
  dest = resolve(file); // nothing to inject — open the original in place
} else {
  dest =
    outPath ||
    join(mkdtempSync(join(tmpdir(), "md-")), `${title || "preview"}.html`);
  writeFileSync(dest, html, "utf8");
}

if (noOpen) {
  console.log(dest);
} else {
  const opener =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
      ? "cmd"
      : "xdg-open";
  const openArgs = process.platform === "win32" ? ["/c", "start", "", dest] : [dest];
  execFile(opener, openArgs, (err) => {
    if (err) {
      console.error(`md: could not open browser: ${err.message}`);
      console.log(dest);
    }
  });
}
