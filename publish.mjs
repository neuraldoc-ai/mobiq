// Distributes a fresh ./out (from generate.mjs) into this repository and the three MOBIQ repositories:
//   data/          GitLab and Jira API responses, ground truth, manifest   (this repository)
//   mobiq-code     the Git repository with all branches and tags
//   mobiq-docs     Confluence and SharePoint exports
//   mobiq-db       PostgreSQL init scripts and docker compose
// Usage: node publish.mjs [--code ../mobiq-code] [--docs ../mobiq-docs] [--db ../mobiq-db]
// Only data paths are replaced; README, .git and other files of the target repositories stay.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, 'out')
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return path.resolve(ROOT, i > 0 ? process.argv[i + 1] : fallback)
}
const targets = { code: arg('code', '../mobiq-code'), docs: arg('docs', '../mobiq-docs'), db: arg('db', '../mobiq-db') }
if (!fs.existsSync(path.join(OUT, 'manifest.json'))) throw new Error('No ./out found. Run node generate.mjs first.')

const replace = (from, to) => {
  fs.rmSync(to, { recursive: true, force: true })
  fs.cpSync(from, to, { recursive: true })
}
const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

for (const rel of ['gitlab', 'jira', 'dashboard.json', 'ground-truth.json', 'manifest.json']) replace(path.join(OUT, rel), path.join(ROOT, 'data', rel))
for (const rel of ['confluence', 'dokumente']) replace(path.join(OUT, rel), path.join(targets.docs, rel))
for (const rel of ['docker-compose.yml', 'initdb', 'overview.json']) replace(path.join(OUT, 'postgres', rel), path.join(targets.db, rel))

// The code repository is updated from the bundle, never overwritten: same commits, same hashes.
const bundle = path.join(OUT, 'mobiq-erp.bundle')
if (!fs.existsSync(path.join(targets.code, '.git'))) {
  execFileSync('git', ['-c', 'core.autocrlf=false', 'clone', '-q', '--no-checkout', bundle, targets.code])
  for (const ref of git(targets.code, ['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin']).split('\n')) {
    const branch = ref.replace(/^origin\//, '')
    if (ref.startsWith('origin/') && branch !== 'HEAD' && !git(targets.code, ['branch', '--list', branch])) git(targets.code, ['branch', '-q', branch, ref])
  }
  git(targets.code, ['remote', 'remove', 'origin'])
  git(targets.code, ['config', 'core.autocrlf', 'false'])
  git(targets.code, ['checkout', '-q', 'release/26.4'])
} else {
  if (git(targets.code, ['status', '--porcelain'])) throw new Error(`${targets.code} has local changes. Code repository not updated.`)
  git(targets.code, ['fetch', '-q', '--force', '--update-head-ok', bundle, '+refs/heads/*:refs/heads/*', '+refs/tags/*:refs/tags/*'])
  git(targets.code, ['reset', '-q', '--hard'])
}
// GitHub shows .github/README.md instead of the German company README. One fixed commit on top of the
// release branch adds it; fixed author and date keep its hash identical on every run. The dataset itself
// still ends at the bundle's release/26.4 commit.
const overlay = fs.readFileSync(path.join(ROOT, 'code-readme.md'), 'utf8')
git(targets.code, ['checkout', '-q', 'release/26.4'])
const current = (() => { try { return git(targets.code, ['show', 'HEAD:.github/README.md']) } catch { return null } })()
if (current !== overlay.trim()) {
  fs.mkdirSync(path.join(targets.code, '.github'), { recursive: true })
  fs.writeFileSync(path.join(targets.code, '.github/README.md'), overlay)
  const stamp = '2026-10-04T00:00:00+00:00', who = { NAME: 'neuraldoc', EMAIL: 'neuraldoc@users.noreply.github.com' }
  const env = { ...process.env, GIT_AUTHOR_NAME: who.NAME, GIT_AUTHOR_EMAIL: who.EMAIL, GIT_COMMITTER_NAME: who.NAME, GIT_COMMITTER_EMAIL: who.EMAIL, GIT_AUTHOR_DATE: stamp, GIT_COMMITTER_DATE: stamp }
  execFileSync('git', ['-C', targets.code, 'add', '.github/README.md'], { env })
  execFileSync('git', ['-C', targets.code, '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'Add English repository description (not part of the dataset)', '-m', 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'], { env })
}
console.log(`Published: data/, ${targets.code}, ${targets.docs}, ${targets.db}`)
