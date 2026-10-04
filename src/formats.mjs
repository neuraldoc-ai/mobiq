// Builders for the two Atlassian body formats.
//  - ADF (Atlassian Document Format): Jira Cloud REST v3 descriptions and comments.
//  - Storage format (XHTML + ac:/ri: macros): Confluence REST v2 body-format=storage.

/* ---------- ADF ---------- */

const text = (t) => {
  // `code` spans: `TEILLIEF_ERLAUBT` → text node with code mark
  const parts = t.split(/(`[^`]+`)/g).filter(Boolean)
  return parts.map((s) => (s.startsWith('`') ? { type: 'text', text: s.slice(1, -1), marks: [{ type: 'code' }] } : { type: 'text', text: s }))
}

export const adf = {
  doc: (...content) => ({ type: 'doc', version: 1, content }),
  p: (t) => ({ type: 'paragraph', content: text(t) }),
  h: (level, t) => ({ type: 'heading', attrs: { level }, content: text(t) }),
  ul: (items) => ({ type: 'bulletList', content: items.map((i) => ({ type: 'listItem', content: [adf.p(i)] })) }),
  ol: (items) => ({ type: 'orderedList', attrs: { order: 1 }, content: items.map((i) => ({ type: 'listItem', content: [adf.p(i)] })) }),
  code: (t, language = 'text') => ({ type: 'codeBlock', attrs: { language }, content: [{ type: 'text', text: t }] }),
  panel: (panelType, ...content) => ({ type: 'panel', attrs: { panelType }, content }),
  tasks: (items) => ({
    type: 'taskList',
    attrs: { localId: 'tl-' + items.length },
    content: items.map(([done, t], i) => ({ type: 'taskItem', attrs: { localId: `ti-${i}`, state: done ? 'DONE' : 'TODO' }, content: text(t) })),
  }),
}

/* ---------- Confluence storage format ---------- */

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Inline: `code` → <code>, **bold** → <strong>, keep the rest escaped.
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

let macroSeq = 0
const macroId = () => {
  macroSeq++
  return `a1b2c3d4-${String(macroSeq).padStart(4, '0')}-4e5f-9a0b-${String(1000000 + macroSeq * 7919).padStart(12, '0')}`
}

export const st = {
  h: (level, t) => `<h${level}>${inline(t)}</h${level}>`,
  p: (t) => `<p>${inline(t)}</p>`,
  ul: (items) => `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`,
  ol: (items) => `<ol>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`,
  table: (head, rows) =>
    `<table data-layout="default"><colgroup>${head.map(() => '<col />').join('')}</colgroup><tbody>` +
    `<tr>${head.map((h) => `<th><p><strong>${inline(h)}</strong></p></th>`).join('')}</tr>` +
    rows.map((r) => `<tr>${r.map((c) => `<td><p>${inline(c)}</p></td>`).join('')}</tr>`).join('') +
    `</tbody></table>`,
  macro: (name, params = {}, body) =>
    `<ac:structured-macro ac:name="${name}" ac:schema-version="1" ac:macro-id="${macroId()}">` +
    Object.entries(params)
      .map(([k, v]) => `<ac:parameter ac:name="${k}">${esc(v)}</ac:parameter>`)
      .join('') +
    (body === undefined ? '' : `<ac:rich-text-body>${body}</ac:rich-text-body>`) +
    `</ac:structured-macro>`,
  info: (body, title) => st.macro('info', title ? { title } : {}, body),
  note: (body, title) => st.macro('note', title ? { title } : {}, body),
  tip: (body) => st.macro('tip', {}, body),
  expand: (title, body) => st.macro('expand', { title }, body),
  toc: () => st.macro('toc', { maxLevel: '3' }),
  children: () => st.macro('children', { all: 'true' }),
  jira: (key) => st.macro('jira', { server: 'System Jira', serverId: '3f0c9a1e-7a2b-3c5d-8e9f-0a1b2c3d4e5f', key }),
  image: (filename, width = 760) => `<ac:image ac:align="center" ac:layout="center" ac:width="${width}"><ri:attachment ri:filename="${esc(filename)}" /></ac:image>`,
  drawio: (diagramName) =>
    st.macro('drawio', { diagramName, simpleViewer: 'false', width: '', zoom: '1', pageSize: 'false', lbox: 'true', diagramWidth: '1081', revision: '7' }),
  pageLink: (title, spaceKey) =>
    `<ac:link><ri:page ri:content-title="${esc(title)}"${spaceKey ? ` ri:space-key="${spaceKey}"` : ''} /><ac:plain-text-link-body><![CDATA[${title}]]></ac:plain-text-link-body></ac:link>`,
  status: (title, colour = 'Grey') => st.macro('status', { colour, title }),
}

export const join = (...parts) => parts.flat().join('')
