// Reads the live MOBIQ pages from Confluence and matches them to the dataset pages by space and title.
// Writes confluence-live.json (dataset id → live id, version) and, with --out <dir>, every live storage body as
// <dir>/<dataset id>.xml. Read-only.
//   node --use-system-ca pull-confluence.mjs [--env ../../secrets/.env] [--out <dir>]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const arg = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback
const env = Object.fromEntries(fs.readFileSync(path.resolve(HERE, arg('--env', '../../secrets/.env')), 'utf8').split(/\r?\n/).map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]))
const site = env.CONFLUENCE_URL.replace(/\/+$/, ''), auth = 'Basic ' + Buffer.from(`${env.CONFLUENCE_EMAIL}:${env.CONFLUENCE_TOKEN}`).toString('base64')
const get = async (url) => { const r = await fetch(`${site}/wiki${url}`, { headers: { Authorization: auth, Accept: 'application/json' } }); if (!r.ok) throw new Error(`${url} → ${r.status}`); return r.json() }

const DOCS = path.join(HERE, '..', 'mobiq-docs', 'confluence')
const spaces = JSON.parse(fs.readFileSync(path.join(DOCS, 'spaces.json'), 'utf8')).results, pages = JSON.parse(fs.readFileSync(path.join(DOCS, 'pages.json'), 'utf8')).results
const out = arg('--out', null)
if (out) fs.mkdirSync(out, { recursive: true })
const live = { site, spaces: {}, pages: {}, pulledAt: new Date().toISOString() }
for (const s of spaces) {
  const found = (await get(`/api/v2/spaces?keys=${s.key}`)).results[0]
  live.spaces[s.id] = { key: s.key, id: found.id, homepageId: found.homepageId }
  const livePages = []
  for (let next = `/api/v2/spaces/${found.id}/pages?limit=250&body-format=storage`; next; ) { const r = await get(next); livePages.push(...r.results); next = r._links?.next?.replace(/^\/wiki/, '') }
  for (const p of pages.filter((x) => x.spaceId === s.id)) {
    const match = !p.parentId ? livePages.find((x) => x.id === found.homepageId) : livePages.find((x) => x.title === p.title)
    if (!match) { console.error(`fehlt in Confluence: ${s.key} › ${p.title}`); continue }
    live.pages[p.id] = { id: match.id, title: match.title, space: s.key, version: match.version.number }
    if (out) fs.writeFileSync(path.join(out, `${p.id}.xml`), match.body.storage.value)
  }
  for (const x of livePages.filter((x) => !Object.values(live.pages).some((m) => m.id === x.id))) live.extra = [...(live.extra ?? []), { id: x.id, title: x.title, space: s.key }]
}
fs.writeFileSync(path.join(HERE, 'confluence-live.json'), JSON.stringify(live, null, 2) + '\n')
console.log(`${Object.keys(live.pages).length} von ${pages.length} Seiten zugeordnet${live.extra ? `, ${live.extra.length} zusätzliche Seiten in Confluence` : ''}.`)
