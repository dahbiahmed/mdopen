// Notion-inspired markdown styling, light + dark via prefers-color-scheme.
// Self-contained: variables drive both themes and the highlight.js token colors.
export const CSS = `
:root {
  --bg:#ffffff; --fg:#37352f; --muted:#787066; --faint:#9b9689;
  --border:#37352f1a; --border-strong:#37352f2e; --link:#2383e2;
  --code-fg:#eb5757; --code-bg:#37352f0f; --block-bg:#f7f6f3;
  --quote-bar:#37352f; --mark:#fdecc8; --tbl-head:#37352f08;
  --sel:#2383e240; --shadow:0 1px 2px #37352f14, 0 6px 24px #37352f0f;
  --hl-comment:#9b9689; --hl-keyword:#eb5757; --hl-string:#448361;
  --hl-number:#d9730d; --hl-title:#9065b0; --hl-attr:#2383e2;
  --hl-builtin:#d9730d; --hl-symbol:#448361; --hl-deletion:#c4554d;
  --hl-deletion-bg:#fbecec; --hl-addition:#448361; --hl-addition-bg:#eaf3ec;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg:#191919; --fg:#d4d4d2; --muted:#9b9b98; --faint:#6f6f6c;
    --border:#ffffff17; --border-strong:#ffffff26; --link:#529cca;
    --code-fg:#ff7369; --code-bg:#ffffff12; --block-bg:#252525;
    --quote-bar:#d4d4d2; --mark:#56452766; --tbl-head:#ffffff08;
    --sel:#529cca40; --shadow:0 1px 2px #0000004d, 0 6px 24px #00000040;
    --hl-comment:#6f6f6c; --hl-keyword:#ff7369; --hl-string:#4dab9a;
    --hl-number:#ffa344; --hl-title:#b58fd8; --hl-attr:#529cca;
    --hl-builtin:#ffa344; --hl-symbol:#4dab9a; --hl-deletion:#ff7369;
    --hl-deletion-bg:#3a2323; --hl-addition:#4dab9a; --hl-addition-bg:#233a2e;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Helvetica Neue", Helvetica, Arial, sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji";
  font-size: 16px; line-height: 1.65; letter-spacing: -0.003em;
  -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
}
::selection { background: var(--sel); }
.markdown-body {
  max-width: 720px; margin: 0 auto; padding: 72px 60px 140px;
}
@media (max-width: 680px) { .markdown-body { padding: 40px 24px 80px; } }
.markdown-body > *:first-child { margin-top: 0; }
h1,h2,h3,h4,h5,h6 {
  margin: 1.6em 0 .35em; font-weight: 700; line-height: 1.25;
  letter-spacing: -0.01em;
}
h1 { font-size: 2.35em; font-weight: 800; margin: .2em 0 .55em; letter-spacing: -0.02em; }
h2 { font-size: 1.55em; }
h3 { font-size: 1.22em; }
h4 { font-size: 1.05em; }
h5 { font-size: .95em; }
h6 { font-size: .85em; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
h1 .anchor, h2 .anchor, h3 .anchor, h4 .anchor { display: none; }
p, ul, ol, dl, table, pre, details, blockquote { margin: 0 0 .75em; }
p { line-height: 1.7; }
a { color: var(--link); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .12s; }
a:hover { border-bottom-color: currentColor; }
strong { font-weight: 700; }
em { font-style: italic; }
hr { height: 1px; margin: 2.4em 0; background: var(--border-strong); border: 0; }
blockquote {
  margin-left: 0; padding: .2em 0 .2em 1em; color: var(--fg);
  border-left: 3px solid var(--quote-bar); font-size: 1.05em;
}
blockquote > :first-child { margin-top: 0; } blockquote > :last-child { margin-bottom: 0; }
ul, ol { padding-left: 1.6em; }
li { margin: .2em 0; padding-left: .15em; }
li::marker { color: var(--faint); }
li > p { margin: 0 0 .4em; }
ul ul, ul ol, ol ul, ol ol { margin: .2em 0; }
input[type=checkbox] { margin: 0 .5em 0 -1.4em; vertical-align: middle; accent-color: var(--link); }
code, kbd, samp {
  font-family: "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas,
    "Liberation Mono", monospace; font-size: .86em;
}
:not(pre) > code {
  color: var(--code-fg); background: var(--code-bg);
  padding: .16em .38em; border-radius: 4px;
  white-space: break-spaces; font-weight: 500;
}
kbd {
  color: var(--fg); background: var(--block-bg); border: 1px solid var(--border-strong);
  border-radius: 5px; box-shadow: 0 1px 0 var(--border-strong);
  padding: .15em .5em; font-size: .8em; line-height: 1.4;
}
pre {
  background: var(--block-bg); padding: 20px 22px; overflow: auto;
  border-radius: 10px; line-height: 1.55; font-size: .85em;
  border: 1px solid var(--border);
}
pre code { color: var(--fg); background: none; padding: 0; white-space: pre; word-break: normal; font-weight: 400; }
table {
  border-collapse: collapse; display: block; overflow: auto;
  width: max-content; max-width: 100%; font-size: .94em;
}
th, td { border: 1px solid var(--border-strong); padding: 8px 14px; text-align: left; }
th { font-weight: 600; background: var(--tbl-head); }
img { max-width: 100%; border-radius: 8px; }
mark { background: var(--mark); color: inherit; padding: .05em .15em; border-radius: 3px; }
details {
  background: var(--block-bg); border: 1px solid var(--border);
  border-radius: 10px; padding: .6em 1em;
}
details > summary { cursor: pointer; font-weight: 600; }
details[open] > summary { margin-bottom: .5em; }
/* highlight.js tokens */
.hljs-comment,.hljs-quote { color: var(--hl-comment); font-style: italic; }
.hljs-keyword,.hljs-selector-tag,.hljs-literal,.hljs-type { color: var(--hl-keyword); }
.hljs-string,.hljs-meta .hljs-string,.hljs-regexp { color: var(--hl-string); }
.hljs-number,.hljs-selector-attr,.hljs-selector-pseudo { color: var(--hl-number); }
.hljs-title,.hljs-title.class_,.hljs-title.function_,.hljs-section { color: var(--hl-title); }
.hljs-attr,.hljs-attribute,.hljs-variable,.hljs-template-variable { color: var(--hl-attr); }
.hljs-built_in,.hljs-name,.hljs-selector-class,.hljs-params { color: var(--hl-builtin); }
.hljs-symbol,.hljs-bullet,.hljs-link,.hljs-meta { color: var(--hl-symbol); }
.hljs-deletion { color: var(--hl-deletion); background: var(--hl-deletion-bg); }
.hljs-addition { color: var(--hl-addition); background: var(--hl-addition-bg); }
.hljs-emphasis { font-style: italic; } .hljs-strong { font-weight: 700; }
`;
