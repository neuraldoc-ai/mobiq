// Builds the MOBIQ example dataset into ./out:
//   out/repo/                 a real git repository (main, release/26.4, feature branches, merge commits)
//   out/gitlab/               GitLab REST v4 responses derived from that repository
//   out/jira/                 Jira Cloud REST v3 responses
//   out/confluence/           Confluence Cloud REST v2 responses (+ readable storage XML per page)
//   out/ground-truth.json     what the docs must say after release 26.4
// Usage: node generate.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as conf from './src/confluence.mjs'
import * as jira from './src/jira.mjs'
import { GITLAB, PROJECT_ID, PROJECT_PATH, gitlabUser, people } from './src/people.mjs'
import { baseline, changes, releaseBranch } from './src/repo.mjs'
import * as truth from './src/truth.mjs'
import * as filesMod from './src/files.mjs'
import * as writers from './src/writers.mjs'
import { writePostgres } from './src/postgres.mjs'

const docFiles = filesMod.files

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, 'out')
const REPO = path.join(OUT, 'repo')

// Git marks its object files read-only; on Windows rmSync refuses those, so make them writable first.
function clean(dir) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      clean(p)
      // A running dev server may watch (and hold) the folder; an empty folder that stays is harmless.
      try {
        fs.rmdirSync(p)
      } catch {}
    } else {
      fs.chmodSync(p, 0o666)
      fs.rmSync(p, { force: true, maxRetries: 3 })
    }
  }
}
clean(OUT)
fs.mkdirSync(REPO, { recursive: true })

const writeJson = (rel, data) => {
  const f = path.join(OUT, rel)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n')
}

/* ------------------------------------------------------------------ */
/* 1. Git repository                                                   */
/* ------------------------------------------------------------------ */

const git = (args, env = {}) => execFileSync('git', args, { cwd: REPO, env: { ...process.env, ...env }, encoding: 'utf8' }).trim()
// Every dataset commit is authored by the maintainer; the fictional team only appears in Jira, GitLab MRs and documents.
const AUTHOR = { name: 'Delschad Jankir', email: '273245025+djankir@users.noreply.github.com' }
const who = (_key, date) => ({
  GIT_AUTHOR_NAME: AUTHOR.name,
  GIT_AUTHOR_EMAIL: AUTHOR.email,
  GIT_AUTHOR_DATE: date,
  GIT_COMMITTER_NAME: AUTHOR.name,
  GIT_COMMITTER_EMAIL: AUTHOR.email,
  GIT_COMMITTER_DATE: date,
})

function applyOps(ops) {
  for (const op of ops) {
    if (op.write) {
      const f = path.join(REPO, op.write)
      fs.mkdirSync(path.dirname(f), { recursive: true })
      fs.writeFileSync(f, op.content)
    } else if (op.edit) {
      const f = path.join(REPO, op.edit)
      const s = fs.readFileSync(f, 'utf8')
      if (!s.includes(op.from)) throw new Error(`edit ${op.edit}: text not found:\n${op.from}`)
      fs.writeFileSync(f, s.replace(op.from, op.to))
    } else if (op.append) {
      fs.appendFileSync(path.join(REPO, op.append), op.text)
    } else if (op.remove) {
      fs.rmSync(path.join(REPO, op.remove))
    }
  }
}

function commit(c) {
  applyOps(c.ops)
  git(['add', '-A'])
  git(['commit', '-q', '-m', c.message], who(c.author, c.date))
  return git(['rev-parse', 'HEAD'])
}

git(['init', '-q', '-b', 'main'])
git(['config', 'core.autocrlf', 'false'])
git(['config', 'user.name', 'generator'])
git(['config', 'user.email', 'generator@example.invalid'])

applyOps(Object.entries(baseline.files).map(([write, content]) => ({ write, content })))
git(['add', '-A'])
git(['commit', '-q', '-m', baseline.message], who(baseline.author, baseline.date))
git(['tag', '-a', 'v26.3.2', '-m', 'Release 26.3.2'], who(baseline.author, baseline.date))

git(['checkout', '-q', '-b', releaseBranch.name])
const releaseCommit = commit(releaseBranch)

const shaOf = {} // change id → { commits: [sha], merge: sha }
for (const ch of changes) {
  const rec = { commits: [] }
  if (ch.mr) {
    git(['checkout', '-q', '-b', ch.branch, releaseBranch.name])
    for (const c of ch.commits) rec.commits.push(commit(c))
    git(['checkout', '-q', releaseBranch.name])
    const msg = `Merge branch '${ch.branch}' into '${releaseBranch.name}'\n\n${ch.mr.title}\n\n${ch.mr.description.match(/Closes [^\n]+/)?.[0] ?? ''}\n\nSee merge request ${PROJECT_PATH}!${ch.mr.iid}`
    git(['merge', '-q', '--no-ff', ch.branch, '-m', msg], who(ch.mr.mergedBy, ch.mr.merged))
    rec.merge = git(['rev-parse', 'HEAD'])
    rec.head = rec.commits.at(-1)
  } else {
    for (const c of ch.commits) rec.commits.push(commit(c))
  }
  shaOf[ch.id] = rec
}

/* ------------------------------------------------------------------ */
/* 2. GitLab REST v4                                                   */
/* ------------------------------------------------------------------ */

const glTime = (iso) => iso.replace(/([+-]\d\d:\d\d)$/, '.000$1')
const webCommit = (sha) => `${GITLAB}/${PROJECT_PATH}/-/commit/${sha}`

function commitJson(sha, withStats = true) {
  const SEP = '\x1f'
  const raw = git(['show', '-s', `--format=%H${SEP}%P${SEP}%an${SEP}%ae${SEP}%aI${SEP}%cn${SEP}%ce${SEP}%cI${SEP}%B`, sha])
  const [id, parents, an, ae, ad, cn, ce, cd, ...rest] = raw.split(SEP)
  const message = rest.join(SEP).trim() + '\n'
  const json = {
    id,
    short_id: id.slice(0, 11),
    created_at: glTime(cd),
    parent_ids: parents ? parents.split(' ') : [],
    title: message.split('\n')[0],
    message,
    author_name: an,
    author_email: ae,
    authored_date: glTime(ad),
    committer_name: cn,
    committer_email: ce,
    committed_date: glTime(cd),
    trailers: {},
    extended_trailers: {},
    web_url: webCommit(id),
  }
  if (withStats) {
    const numstat = git(['show', '--numstat', '--format=', '--first-parent', sha])
    let additions = 0
    let deletions = 0
    for (const line of numstat.split('\n').filter(Boolean)) {
      const [a, d] = line.split('\t')
      additions += Number(a) || 0
      deletions += Number(d) || 0
    }
    json.stats = { additions, deletions, total: additions + deletions }
  }
  return json
}

function diffJson(sha) {
  const patch = git(['show', '--format=', '--no-color', '--no-renames', '--first-parent', '-p', sha])
  return patch
    .split(/^(?=diff --git )/m)
    .filter((s) => s.startsWith('diff --git'))
    .map((section) => {
      const [, oldPath, newPath] = section.match(/^diff --git a\/(.+?) b\/(.+)$/m)
      const newFile = /^new file mode/m.test(section)
      const deletedFile = /^deleted file mode/m.test(section)
      const mode = section.match(/^(?:new file mode|deleted file mode|index \S+) (\d{6})/m)?.[1] ?? '100644'
      const at = section.indexOf('\n@@')
      return {
        diff: at >= 0 ? section.slice(at + 1).replace(/\n$/, '') + '\n' : '',
        collapsed: false,
        too_large: false,
        new_path: newPath,
        old_path: oldPath,
        a_mode: newFile ? '0' : mode,
        b_mode: deletedFile ? '0' : mode,
        new_file: newFile,
        renamed_file: false,
        deleted_file: deletedFile,
        generated_file: false,
      }
    })
}

// Portable copy of the repository (out/repo itself is a nested .git and stays out of version control).
git(['bundle', 'create', path.join(OUT, 'mobiq-erp.bundle'), '--all'])

const allShas = git(['rev-list', `${releaseBranch.name}`, '^v26.3.2']).split('\n')
writeJson('gitlab/project.json', {
  id: PROJECT_ID,
  name: 'erp',
  name_with_namespace: 'mobiq / erp',
  path_with_namespace: PROJECT_PATH,
  default_branch: 'main',
  web_url: `${GITLAB}/${PROJECT_PATH}`,
  created_at: '2019-02-11T09:00:00.000+01:00',
})
writeJson('gitlab/branches.json', ['main', releaseBranch.name, ...changes.filter((c) => c.mr).map((c) => c.branch)].map((name) => ({ name, merged: name !== 'main' && name !== releaseBranch.name, protected: name === 'main' || name.startsWith('release/'), commit: { id: git(['rev-parse', name]) } })))
writeJson('gitlab/tags.json', [{ name: 'v26.3.2', message: 'Release 26.3.2', target: git(['rev-parse', 'v26.3.2']), commit: commitJson(git(['rev-parse', 'v26.3.2^{commit}']), false) }])
// GET /projects/42/repository/commits?ref_name=release/26.4&since=2026-07-21T00:00:00Z&with_stats=true
writeJson('gitlab/commits.json', allShas.map((s) => commitJson(s)))
for (const sha of allShas) {
  const isMerge = git(['show', '-s', '--format=%P', sha]).split(' ').length > 1
  if (!isMerge) writeJson(`gitlab/commits/${sha}/diff.json`, diffJson(sha))
}

const mrs = changes.filter((c) => c.mr)
writeJson(
  'gitlab/merge_requests.json',
  mrs
    .slice()
    .reverse()
    .map((ch) => {
      const rec = shaOf[ch.id]
      return {
        id: 88000 + ch.mr.iid,
        iid: ch.mr.iid,
        project_id: PROJECT_ID,
        title: ch.mr.title,
        description: ch.mr.description,
        state: 'merged',
        created_at: glTime(ch.mr.created),
        updated_at: glTime(ch.mr.merged),
        merged_by: gitlabUser(ch.mr.mergedBy),
        merge_user: gitlabUser(ch.mr.mergedBy),
        merged_at: glTime(ch.mr.merged),
        closed_by: null,
        closed_at: null,
        target_branch: releaseBranch.name,
        source_branch: ch.branch,
        user_notes_count: 2,
        upvotes: 1,
        downvotes: 0,
        author: gitlabUser(ch.mr.author),
        assignees: [gitlabUser(ch.mr.author)],
        assignee: gitlabUser(ch.mr.author),
        reviewers: [gitlabUser(ch.mr.mergedBy)],
        source_project_id: PROJECT_ID,
        target_project_id: PROJECT_ID,
        labels: ch.mr.labels,
        draft: false,
        work_in_progress: false,
        milestone: { id: 311, iid: 14, project_id: PROJECT_ID, title: '26.4', description: 'Herbst-Release', state: 'active', due_date: '2026-10-27', web_url: `${GITLAB}/${PROJECT_PATH}/-/milestones/14` },
        merge_when_pipeline_succeeds: false,
        detailed_merge_status: 'not_open',
        sha: rec.head,
        merge_commit_sha: rec.merge,
        squash_commit_sha: null,
        squash: false,
        squash_on_merge: false,
        discussion_locked: null,
        should_remove_source_branch: true,
        force_remove_source_branch: true,
        reference: `!${ch.mr.iid}`,
        references: { short: `!${ch.mr.iid}`, relative: `!${ch.mr.iid}`, full: `${PROJECT_PATH}!${ch.mr.iid}` },
        web_url: `${GITLAB}/${PROJECT_PATH}/-/merge_requests/${ch.mr.iid}`,
        time_stats: { time_estimate: 0, total_time_spent: 0, human_time_estimate: null, human_total_time_spent: null },
        has_conflicts: false,
        blocking_discussions_resolved: true,
      }
    }),
)
for (const ch of mrs) {
  // GET /projects/42/merge_requests/:iid/commits — newest first, without stats
  writeJson(`gitlab/merge_requests/${ch.mr.iid}/commits.json`, shaOf[ch.id].commits.slice().reverse().map((s) => commitJson(s, false)))
}

/* ------------------------------------------------------------------ */
/* 3. Jira                                                             */
/* ------------------------------------------------------------------ */

writeJson('jira/search_jql.json', jira.searchResponse())
writeJson('jira/project.json', { ...jira.project, self: 'https://musterhaus-software.atlassian.net/rest/api/3/project/10004' })
writeJson('jira/project_versions.json', jira.versions.map((v) => ({ ...v, self: `https://musterhaus-software.atlassian.net/rest/api/3/version/${v.id}` })))

/* ------------------------------------------------------------------ */
/* 4. Confluence                                                       */
/* ------------------------------------------------------------------ */

writeJson('confluence/spaces.json', conf.spacesJson())
writeJson('confluence/pages.json', conf.pagesJson())
for (const p of conf.pages) {
  writeJson(`confluence/pages/${p.id}/labels.json`, conf.labelsJson(p))
  writeJson(`confluence/pages/${p.id}/attachments.json`, conf.attachmentsJson(p))
  const f = path.join(OUT, 'confluence/storage', `${p.id}-${p.slug}.xml`)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(f, `<!-- ${p.space} / ${p.title} (Version ${p.v[0]}) -->\n${p.body.replace(/></g, '>\n<')}\n`)
}

/* ------------------------------------------------------------------ */
/* 4b. Document library (SharePoint): real Word, Excel and PDF files   */
/* ------------------------------------------------------------------ */

const mime = { docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pdf: 'application/pdf' }
const driveItems = []
const extracted = {}
for (const [i, f] of docFiles.entries()) {
  const meta = { title: f.title, author: people[f.author].name, modifiedBy: people[f.modifiedBy].name, created: f.created, modified: f.modified }
  const buf = f.kind === 'docx' ? writers.docx(f.blocks, meta) : f.kind === 'xlsx' ? writers.xlsx(f.sheets, meta) : writers.pdf(f.pages, meta)
  const target = path.join(OUT, 'dokumente/files', f.folder, f.name)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, buf)
  const id = `01MOBIQ${String(4711 + i * 37).padStart(6, '0')}DOC${f.slug.length}`
  const user = (k) => ({ user: { email: people[k].email, id: `a3f1${people[k].gitlab}0000-0000-4000-8000-0000000000${String(people[k].gitlab).padStart(2, '0')}`, displayName: people[k].name } })
  driveItems.push({
    '@odata.etag': `"{${id}},${f.slug.length + 3}"`,
    id,
    name: f.name,
    size: buf.length,
    webUrl: `${filesMod.SHAREPOINT}/${encodeURI(filesMod.LIBRARY + '/' + f.folder + '/' + f.name)}`,
    createdDateTime: f.created,
    lastModifiedDateTime: f.modified,
    createdBy: user(f.author),
    lastModifiedBy: user(f.modifiedBy),
    parentReference: { driveType: 'documentLibrary', path: `/drives/b!mobiq/root:/${filesMod.LIBRARY}/${f.folder}` },
    file: { mimeType: mime[f.kind], hashes: { quickXorHash: Buffer.from(String(buf.length * 2654435761 % 4294967296)).toString('base64') } },
    fileSystemInfo: { createdDateTime: f.created, lastModifiedDateTime: f.modified },
    listItem: { fields: { Dokumentart: filesMod.fileDocTypes[f.docType], Verantwortlich: people[f.author].name } },
  })
  // What a parser gets out of the file: text by structure (paragraphs/tables, sheets/rows, pages).
  extracted[f.slug] = { id, name: f.name, kind: f.kind, path: `${f.folder}/${f.name}`, docType: f.docType, title: f.title, blocks: f.blocks ?? null, sheets: f.sheets ?? null, pages: f.pages?.map((p) => ({ slide: !!p.slide, blocks: p.blocks, diagram: p.diagram ?? null })) ?? null }
}
// GET /sites/{site}/drives/{drive}/root:/MOBIQ:/children (flattened over the sub folders)
writeJson('dokumente/driveItems.json', { '@odata.context': "https://graph.microsoft.com/v1.0/$metadata#Collection(driveItem)", value: driveItems })
writeJson('dokumente/extracted.json', extracted)

/* ------------------------------------------------------------------ */
/* 5. Ground truth                                                     */
/* ------------------------------------------------------------------ */

const PAGE_TYPES = ['anwenderhandbuch', 'dialogbeschreibung', 'parametertabelle', 'technische-doku', 'installation', 'architektur']
const pageRef = (slug) => {
  const p = conf.pages.find((x) => x.slug === slug)
  if (!p) throw new Error(`ground truth refers to unknown page ${slug}`)
  return { source: 'confluence', pageId: p.id, space: p.space, title: p.title, docType: PAGE_TYPES.find((l) => p.labels.includes(l)) ?? null }
}
const fileRef = (slug) => {
  const f = docFiles.find((x) => x.slug === slug)
  if (!f) throw new Error(`ground truth refers to unknown file ${slug}`)
  return { source: 'datei', fileId: f.slug, folder: f.folder, title: f.name, docType: f.docType }
}
const ref = (e) => (e.page ? pageRef(e.page) : e.file ? fileRef(e.file) : null)
const withRef = (e) => {
  const { page, file, ...rest } = e
  if (page || file) return { ...ref(e), ...rest }
  const space = e.newPage.space
  return { source: 'neu', title: e.newPage.title, docType: space === 'MOBIQFB' ? 'dialogbeschreibung' : 'anwenderhandbuch', ...rest, newPage: { ...e.newPage, parentId: conf.pageId(e.newPage.parent) } }
}

const gt = {
  release: '26.4',
  note: 'Was eine sorgfältige Redaktion für Release 26.4 in Confluence und in der Dateiablage ändern würde. "must" = Doku ist ohne die Änderung falsch oder unvollständig; "should" = gute Praxis.',
  changes: Object.entries(truth.changes).map(([id, t]) => {
    const ch = changes.find((c) => c.id === id)
    const extra = truth.fileExpectations[id] ?? { expected: [], notAffected: [] }
    return {
      id,
      ...t,
      mergeRequest: ch.mr ? { iid: ch.mr.iid, mergeCommit: shaOf[id].merge } : null,
      commits: shaOf[id].commits.map((sha, i) => ({ sha, title: ch.commits[i].message.split('\n')[0] })),
      expected: [...t.expected, ...extra.expected].map(withRef),
      notAffected: [...t.notAffected, ...extra.notAffected].map((n) => ({ ...ref(n), why: n.why })),
    }
  }),
  release_wide: { expected: truth.release.expected.map(withRef), notInRelease: truth.release.notInRelease },
  ignore: [{ sha: releaseCommit, why: 'Versionsnummer gesetzt, keine Doku-Wirkung.' }],
}
writeJson('ground-truth.json', gt)

/* ------------------------------------------------------------------ */
/* 6. Compact view for the dashboard ("Daten" page)                    */
/* ------------------------------------------------------------------ */

const commitsJson = allShas.map((s) => commitJson(s))
const issuesJson = jira.searchResponse().issues
const docType = (labels) => ['anwenderhandbuch', 'dialogbeschreibung', 'parametertabelle', 'technische-doku', 'installation', 'architektur'].find((l) => labels.includes(l)) ?? null
const mustByPage = {}
for (const c of gt.changes) for (const e of c.expected) if (e.pageId) (mustByPage[e.pageId] ??= { must: 0, should: 0 })[e.level]++

writeJson('dashboard.json', {
  release: '26.4',
  endpoints: {
    gitlab: ['GET /projects/42/repository/commits', 'GET /projects/42/repository/commits/:sha/diff', 'GET /projects/42/merge_requests'],
    jira: ['POST /rest/api/3/search/jql'],
    confluence: ['GET /wiki/api/v2/spaces', 'GET /wiki/api/v2/pages?body-format=storage'],
  },
  changes: changes.map((ch) => {
    const t = gt.changes.find((x) => x.id === ch.id)
    return {
      id: ch.id,
      title: t.title,
      ticket: ch.ticket,
      nature: t.nature,
      mr: ch.mr ? ch.mr.iid : null,
      merged: ch.mr ? ch.mr.merged : ch.commits.at(-1).date,
      must: t.expected.filter((e) => e.level === 'must').length,
      should: t.expected.filter((e) => e.level === 'should').length,
      commits: shaOf[ch.id].commits.map((sha) => {
        const c = commitsJson.find((x) => x.id === sha)
        return { sha: c.short_id.slice(0, 8), title: c.title, author: c.author_name, date: c.authored_date, add: c.stats.additions, del: c.stats.deletions, files: diffJson(sha).map((d) => d.new_path) }
      }),
    }
  }),
  commits: { total: commitsJson.length, merges: commitsJson.filter((c) => c.parent_ids.length > 1).length },
  issues: issuesJson.map((i) => ({
    key: i.key,
    type: i.fields.issuetype.name,
    summary: i.fields.summary,
    status: i.fields.status.name,
    category: i.fields.status.statusCategory.key,
    versions: i.fields.fixVersions.map((v) => v.name),
    comments: i.fields.comment.total,
    hasCode: changes.some((ch) => ch.ticket === i.key || ch.commits.some((c) => c.message.startsWith(i.key + ' '))),
  })),
  files: docFiles.map((f) => ({ slug: f.slug, name: f.name, folder: f.folder, kind: f.kind, docType: f.docType, must: gt.changes.flatMap((c) => c.expected).filter((e) => e.fileId === f.slug && e.level === 'must').length, should: gt.changes.flatMap((c) => c.expected).filter((e) => e.fileId === f.slug && e.level === 'should').length })),
  spaces: conf.spaces.map((s) => ({ key: s.key, name: s.name })),
  pages: conf.pages.map((p) => ({
    id: p.id,
    space: p.space,
    title: p.title,
    labels: p.labels,
    docType: docType(p.labels),
    version: p.v[0],
    updated: p.v[1],
    must: mustByPage[p.id]?.must ?? 0,
    should: mustByPage[p.id]?.should ?? 0,
    trap: gt.changes.some((c) => c.notAffected.some((n) => n.pageId === p.id)) && !mustByPage[p.id],
  })),
  truth: gt.changes.map((c) => ({
    id: c.id,
    title: c.title,
    expected: c.expected.map((e) => ({ page: e.title, source: e.source, docType: e.docType, section: e.section ?? null, pageId: e.pageId ?? null, fileId: e.fileId ?? null, level: e.level, kind: e.kind, what: e.what })),
    notAffected: c.notAffected.map((n) => ({ page: n.title, why: n.why })),
  })),
})

// Repository content at release/26.4: GET /projects/42/repository/tree?recursive=true (tree)
// plus GET /projects/42/repository/files/:path/raw for every file, with the last commit per file.
{
  const ref = releaseBranch.name
  const SEP = '\x1f'
  const tree = git(['ls-tree', '-r', '-t', '--full-tree', ref])
    .split('\n')
    .map((line) => {
      const [meta, p] = line.split('\t')
      const [mode, type, id] = meta.split(' ')
      return { id, name: path.posix.basename(p), type, path: p, mode }
    })
  const files = {}
  for (const t of tree.filter((x) => x.type === 'blob')) {
    const [sha, title, author, date] = git(['log', '-1', `--format=%h${SEP}%s${SEP}%an${SEP}%aI`, ref, '--', t.path]).split(SEP)
    files[t.path] = { content: git(['show', `${ref}:${t.path}`]) + '\n', lastCommit: { short_id: sha, title, author_name: author, authored_date: date } }
  }
  writeJson('gitlab/repository.json', { project: PROJECT_PATH, ref, head: commitJson(git(['rev-parse', ref]), false), tree, files })
}

// Collections for the dashboard's raw-data viewer (same content as the per-commit / per-page files).
writePostgres(OUT, REPO)
writeJson('gitlab/diffs.json', Object.fromEntries(allShas.filter((s) => git(['show', '-s', '--format=%P', s]).split(' ').length === 1).map((s) => [s, diffJson(s)])))
writeJson('confluence/page_meta.json', Object.fromEntries(conf.pages.map((p) => [p.id, { labels: conf.labelsJson(p), attachments: conf.attachmentsJson(p) }])))

/* ------------------------------------------------------------------ */

const count = (dir) => fs.readdirSync(path.join(OUT, dir)).length
const must = gt.changes.flatMap((c) => c.expected).filter((e) => e.level === 'must').length
const summary = {
  generatedAt: new Date().toISOString(),
  git: { commits: allShas.length, merges: mrs.length, changes: changes.length, branches: 2 + mrs.length },
  jira: { issues: jira.searchResponse().issues.length },
  confluence: { spaces: conf.spaces.length, pages: conf.pages.length },
  dokumente: { files: docFiles.length },
  groundTruth: { must, should: gt.changes.flatMap((c) => c.expected).filter((e) => e.level === 'should').length + gt.release_wide.expected.length, notAffected: gt.changes.flatMap((c) => c.notAffected).length },
  diffs: count('gitlab/commits'),
}
writeJson('manifest.json', summary)
console.log(JSON.stringify(summary, null, 2))
