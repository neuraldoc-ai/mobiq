// Brings the live MOBIQ documentation to the state after release 26.4 (stand-26.4/): builds the Word, Excel and PDF
// files and, with --push, writes the pages to Confluence (one new version each, comment "Stand 26.4"), creates the
// two new pages and replaces the files in Google Drive (same file ids, new names). Running it again changes nothing.
//   node --use-system-ca stand-26.4.mjs [--push] [--env ../../secrets/.env]
// Needs confluence-live.json (pull-confluence.mjs). The Drive service account must be editor of the folder.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import * as writers from './src/writers.mjs'
import { people } from './src/people.mjs'
import { pages, newPages } from './stand-26.4/pages.mjs'
import { files } from './stand-26.4/files.mjs'
import { files as before } from './src/files.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const arg = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback
const OUT = path.join(HERE, 'stand-26.4', 'dokumente')

/* ---------- 1. Files ---------- */
fs.rmSync(OUT, { recursive: true, force: true })
const built = []
for (const f of files) {
  const meta = { title: f.title, author: people[f.author].name, modifiedBy: people[f.modifiedBy].name, created: f.created, modified: f.modified }
  const buf = f.kind === 'docx' ? writers.docx(f.blocks, meta) : f.kind === 'xlsx' ? writers.xlsx(f.sheets, meta) : writers.pdf(f.pages, meta)
  const target = path.join(OUT, f.folder, f.name)
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, buf)
  const old = before.find((b) => b.slug === f.slug)
  built.push({ ...f, bytes: buf, oldName: old.name, oldFolder: old.folder })
}
console.log(`${built.length} Dateien gebaut in ${OUT}`)
if (!process.argv.includes('--push')) process.exit(0)

const env = Object.fromEntries(fs.readFileSync(path.resolve(HERE, arg('--env', '../../secrets/.env')), 'utf8').split(/\r?\n/).map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]))

/* ---------- 2. Confluence ---------- */
const live = JSON.parse(fs.readFileSync(path.join(HERE, 'confluence-live.json'), 'utf8'))
const site = env.CONFLUENCE_URL.replace(/\/+$/, '')
if (live.site !== site) throw new Error(`confluence-live.json gehört zu ${live.site}, .env zeigt auf ${site}. Erst pull-confluence.mjs laufen lassen.`)
const auth = 'Basic ' + Buffer.from(`${env.CONFLUENCE_EMAIL}:${env.CONFLUENCE_TOKEN}`).toString('base64')
async function wiki(method, url, body) {
  const r = await fetch(`${site}/wiki${url}`, { method, headers: { Authorization: auth, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const text = await r.text()
  if (!r.ok) throw new Error(`${method} ${url} → ${r.status} ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : {}
}
// Confluence normalizes what it stores (entities, attributes, macro ids): compare the text only.
const plain = (xml) => xml.replace(/<[^>]+>/g, ' ').replace(/&(\w+);/g, (m, n) => ({ auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', amp: '&', lt: '<', gt: '>', nbsp: ' ', bdquo: '„', ldquo: '“', ndash: '–', rarr: '→', rsaquo: '›', sup3: '³', hellip: '…' })[n] ?? m).replace(/\s+/g, ' ').trim()
let written = 0, unchanged = 0
for (const [datasetId, body] of Object.entries(pages)) {
  const target = live.pages[datasetId]
  if (!target) throw new Error(`Seite ${datasetId} fehlt in confluence-live.json`)
  const current = await wiki('GET', `/api/v2/pages/${target.id}?body-format=storage`)
  if (plain(current.body.storage.value) === plain(body)) { unchanged++; continue }
  await wiki('PUT', `/api/v2/pages/${target.id}`, { id: target.id, status: 'current', title: current.title, body: { representation: 'storage', value: body }, version: { number: current.version.number + 1, message: 'Stand 26.4' } })
  written++; console.log(`Confluence ${target.space} › ${current.title}: Version ${current.version.number + 1}`)
}
for (const page of newPages) {
  const space = Object.values(live.spaces).find((s) => s.key === page.space), parent = live.pages[page.parent]
  const existing = (await wiki('GET', `/api/v2/pages?space-id=${space.id}&title=${encodeURIComponent(page.title)}&body-format=storage`)).results?.[0]
  let id = existing?.id
  if (!existing) { id = (await wiki('POST', '/api/v2/pages', { spaceId: space.id, status: 'current', title: page.title, parentId: parent.id, body: { representation: 'storage', value: page.body } })).id; written++; console.log(`Confluence ${page.space} › ${page.title}: neu angelegt`) }
  else if (plain(existing.body.storage.value) !== plain(page.body)) { await wiki('PUT', `/api/v2/pages/${id}`, { id, status: 'current', title: page.title, body: { representation: 'storage', value: page.body }, version: { number: existing.version.number + 1, message: 'Stand 26.4' } }); written++ }
  else unchanged++
  await wiki('POST', `/rest/api/content/${id}/label`, page.labels.map((name) => ({ prefix: 'global', name })))
  live.added = { ...(live.added ?? {}), [page.title]: { id, space: page.space } }
}
fs.writeFileSync(path.join(HERE, 'confluence-live.json'), JSON.stringify(live, null, 2) + '\n')
console.log(`Confluence: ${written} geschrieben, ${unchanged} schon auf Stand 26.4.`)

/* ---------- 3. Google Drive ---------- */
const key = JSON.parse(fs.readFileSync(env.GOOGLE_SA_KEY, 'utf8'))
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'), now = Math.floor(Date.now() / 1000)
const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', iat: now - 30, exp: now + 3000 })}`
const jwt = `${unsigned}.${crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url')}`
const token = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}` })).json()).access_token
if (!token) throw new Error('Google lehnt das Dienstkonto ab.')
async function drive(method, url, body, headers = {}) {
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, ...headers }, body })
  const text = await r.text()
  if (!r.ok) throw new Error(`Drive ${method} ${url.split('?')[0]} → ${r.status} ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : {}
}
const root = env.GOOGLE_DRIVE_FOLDER.match(/folders\/([\w-]+)/)[1]
const tree = new Map() // "Ordner/Unterordner/Name" → { id, mimeType, md5Checksum }
async function walk(id, prefix) {
  const q = encodeURIComponent(`'${id}' in parents and trashed=false`)
  for (const f of (await drive('GET', `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,md5Checksum)&pageSize=200`)).files) {
    tree.set(prefix + f.name, f)
    if (f.mimeType === 'application/vnd.google-apps.folder') await walk(f.id, `${prefix}${f.name}/`)
  }
}
await walk(root, '')
// Auslieferung/26.3 → Auslieferung/26.4: the folder is renamed, its file keeps its id.
for (const f of built.filter((x) => x.folder !== x.oldFolder)) {
  const folder = tree.get(f.oldFolder)
  if (folder && !tree.has(f.folder)) { await drive('PATCH', `https://www.googleapis.com/drive/v3/files/${folder.id}`, JSON.stringify({ name: f.folder.split('/').pop() }), { 'Content-Type': 'application/json' }); console.log(`Drive: Ordner ${f.oldFolder} → ${f.folder}`) }
}
tree.clear(); await walk(root, '')
let replaced = 0
for (const f of built) {
  const file = tree.get(`${f.folder}/${f.name}`) ?? tree.get(`${f.folder}/${f.oldName}`)
  if (!file) { console.error(`Drive: ${f.folder}/${f.oldName} nicht gefunden`); continue }
  if (file.md5Checksum === crypto.createHash('md5').update(f.bytes).digest('hex') && tree.has(`${f.folder}/${f.name}`)) continue
  const boundary = `nd${crypto.randomBytes(8).toString('hex')}`, mime = { docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pdf: 'application/pdf' }[f.kind]
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: f.name })}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`), f.bytes, Buffer.from(`\r\n--${boundary}--`)])
  await drive('PATCH', `https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=multipart`, body, { 'Content-Type': `multipart/related; boundary=${boundary}` })
  replaced++; console.log(`Drive: ${f.folder}/${f.oldName === f.name ? f.name : `${f.oldName} → ${f.name}`}`)
}
console.log(`Drive: ${replaced} Dateien ersetzt.`)
