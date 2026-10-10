// Uploads the MOBIQ Confluence pages (mobiq-docs/confluence, state 26.3) to a real Confluence Cloud site:
// 4 spaces, the page tree, labels and placeholder images for the attachments. Running it again updates the pages
// (new version) instead of creating duplicates.
//   node --use-system-ca upload-confluence.mjs [--env ../../secrets/.env] [--check] [--dry-run]
// --check only tests the login, --dry-run prints what would be sent without any request.
// .env: CONFLUENCE_URL=https://<site>.atlassian.net, CONFLUENCE_EMAIL=…, CONFLUENCE_TOKEN=… (API token)
// Writes the mapping dataset id → live id to confluence-live.json (no secrets in it).
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const arg = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback
const dry = process.argv.includes('--dry-run'), checkOnly = process.argv.includes('--check')
const DOCS = path.join(HERE, '..', 'mobiq-docs', 'confluence')

const env = {}
const envFile = path.resolve(HERE, arg('--env', '../../secrets/.env'))
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const site = (env.CONFLUENCE_URL || '').replace(/\/+$/, '').replace(/\/wiki$/, '')
if (!dry && (!site || !env.CONFLUENCE_EMAIL || !env.CONFLUENCE_TOKEN)) {
  console.error(`CONFLUENCE_URL, CONFLUENCE_EMAIL und CONFLUENCE_TOKEN fehlen in ${envFile}`)
  process.exit(1)
}
const auth = 'Basic ' + Buffer.from(`${env.CONFLUENCE_EMAIL}:${env.CONFLUENCE_TOKEN}`).toString('base64')

async function api(method, url, body, { form = false, ok = [] } = {}) {
  if (dry) { console.log(`[dry] ${method} ${url}${body && !form ? ' ' + JSON.stringify(body).slice(0, 160) : ''}`); return { id: `dry-${Math.random().toString(36).slice(2, 8)}`, homepageId: 'dry-home', results: [], version: { number: 1 } } }
  for (let attempt = 0; ; attempt++) {
    const headers = { Authorization: auth, Accept: 'application/json', ...(form ? { 'X-Atlassian-Token': 'no-check' } : body ? { 'Content-Type': 'application/json' } : {}) }
    const res = await fetch(`${site}/wiki${url}`, { method, headers, body: form ? body : body ? JSON.stringify(body) : undefined })
    if (res.status === 429 && attempt < 5) { await new Promise((r) => setTimeout(r, 1000 * Number(res.headers.get('retry-after') || 2 ** attempt))); continue }
    const text = await res.text()
    if (!res.ok && !ok.includes(res.status)) { const e = new Error(`${method} ${url} → ${res.status} ${text.slice(0, 300)}`); e.status = res.status; throw e }
    return text ? JSON.parse(text) : {}
  }
}

/* ---------- Placeholder images: a light gray PNG with a dark frame ---------- */
function png(width = 480, height = 300) {
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1 } return ~c >>> 0 }
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2
  const rows = []
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3)
    for (let x = 0; x < width; x++) { const edge = x < 3 || y < 3 || x >= width - 3 || y >= height - 3 || y === 40; row.fill(edge ? 120 : 235, 1 + x * 3, 4 + x * 3) }
    rows.push(row)
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))])
}
const attachmentBytes = (title) => title.endsWith('.drawio') ? Buffer.from('<mxfile host="neuraldoc"><diagram name="MOBIQ Gesamtsystem"><mxGraphModel><root><mxCell id="0"/></root></mxGraphModel></diagram></mxfile>') : png()

/* ---------- Upload ---------- */
const read = (rel) => JSON.parse(fs.readFileSync(path.join(DOCS, rel), 'utf8'))
const spaces = read('spaces.json').results, pages = read('pages.json').results
// Macros a fresh site may not have (draw.io is a Marketplace app): replaced by a note when Confluence rejects the page.
const withoutAppMacros = (xml) => xml.replace(/<ac:structured-macro ac:name="drawio"[\s\S]*?<\/ac:structured-macro>/g, '<p><em>[draw.io-Diagramm: mobiq-gesamtsystem.drawio, siehe Anhang]</em></p>')

if (!dry) {
  const me = await api('GET', '/rest/api/user/current')
  console.log(`Angemeldet als ${me.displayName ?? me.publicName ?? me.email ?? me.accountId} auf ${site}`)
  if (checkOnly) process.exit(0)
}

const live = { site, spaces: {}, pages: {}, uploadedAt: new Date().toISOString() }
const failed = []
for (const s of spaces) {
  let found = dry ? null : (await api('GET', `/api/v2/spaces?keys=${s.key}`)).results?.[0]
  if (!found) {
    const description = s.description?.plain?.value ?? ''
    try { await api('POST', '/api/v2/spaces', { key: s.key, name: s.name, description: { value: description, representation: 'plain' } }) }
    catch (e) { if (![400, 404, 405].includes(e.status)) throw e; await api('POST', '/rest/api/space', { key: s.key, name: s.name, description: { plain: { value: description, representation: 'plain' } } }) }
    found = dry ? { id: `dry-${s.key}`, homepageId: `dry-home-${s.key}` } : (await api('GET', `/api/v2/spaces?keys=${s.key}`)).results[0]
    console.log(`Bereich ${s.key} angelegt`)
  } else console.log(`Bereich ${s.key} gibt es schon`)
  live.spaces[s.id] = { key: s.key, id: found.id, homepageId: found.homepageId }
}

async function putPage(id, title, value, message) {
  const current = await api('GET', `/api/v2/pages/${id}`)
  return api('PUT', `/api/v2/pages/${id}`, { id, status: 'current', title, body: { representation: 'storage', value }, version: { number: (current.version?.number ?? 1) + 1, message } })
}

const ordered = [...pages].sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0))
const done = new Set()
while (done.size + failed.length < ordered.length) {
  const next = ordered.find((p) => !done.has(p.id) && !failed.some((f) => f.id === p.id) && (!p.parentId || live.pages[p.parentId]))
  if (!next) { for (const p of ordered.filter((p) => !done.has(p.id) && !failed.some((f) => f.id === p.id))) failed.push({ id: p.id, title: p.title, error: 'Elternseite fehlt' }); break }
  const space = live.spaces[next.spaceId], message = next.version?.message || 'Stand 26.3'
  let value = next.body.storage.value
  try {
    let id
    const write = async (v) => {
      if (!next.parentId) { await putPage(space.homepageId, next.title, v, message); return space.homepageId }
      const existing = dry ? null : (await api('GET', `/api/v2/pages?space-id=${space.id}&title=${encodeURIComponent(next.title)}`)).results?.[0]
      if (existing) { await putPage(existing.id, next.title, v, message); return existing.id }
      return (await api('POST', '/api/v2/pages', { spaceId: space.id, status: 'current', title: next.title, parentId: live.pages[next.parentId].id, body: { representation: 'storage', value: v } })).id
    }
    try { id = await write(value) } catch (e) { if (e.status !== 400 || withoutAppMacros(value) === value) throw e; value = withoutAppMacros(value); id = await write(value); console.log(`  ${next.title}: draw.io-Makro durch Hinweis ersetzt`) }
    const labels = read(`pages/${next.id}/labels.json`).results.map((l) => ({ prefix: 'global', name: l.name }))
    if (labels.length) await api('POST', `/rest/api/content/${id}/label`, labels)
    for (const a of read(`pages/${next.id}/attachments.json`).results) {
      const form = new FormData()
      form.append('file', new Blob([attachmentBytes(a.title)], { type: a.mediaType || 'application/octet-stream' }), a.title)
      form.append('minorEdit', 'true')
      await api('PUT', `/rest/api/content/${id}/child/attachment`, form, { form: true })
    }
    live.pages[next.id] = { id, title: next.title, space: space.key }
    done.add(next.id)
    console.log(`Seite ${space.key} › ${next.title} (${id})`)
  } catch (e) { failed.push({ id: next.id, title: next.title, error: e.message }); console.error(`FEHLER ${next.title}: ${e.message}`) }
}

if (!dry) fs.writeFileSync(path.join(HERE, 'confluence-live.json'), JSON.stringify(live, null, 2) + '\n')
console.log(`\n${done.size} von ${pages.length} Seiten hochgeladen${failed.length ? `, ${failed.length} Fehler` : ''}.${dry ? ' (Probelauf)' : ` Zuordnung: ${path.join(HERE, 'confluence-live.json')}`}`)
if (failed.length) process.exit(1)
