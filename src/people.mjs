// One set of people across Jira, Confluence and GitLab. All invented.
// Atlassian account ids follow the cloud format "712020:<uuid>"; GitLab ids are numeric.

export const people = {
  engel: { name: 'Markus Engel', email: 'markus.engel@musterhaus-software.de', role: 'Product Owner ERP', gitlab: 11, username: 'mengel' },
  albrecht: { name: 'Jonas Albrecht', email: 'jonas.albrecht@musterhaus-software.de', role: 'Entwicklung Auftrag', gitlab: 23, username: 'jalbrecht' },
  yilmaz: { name: 'Merve Yilmaz', email: 'merve.yilmaz@musterhaus-software.de', role: 'Entwicklung Web und Desktop', gitlab: 31, username: 'myilmaz' },
  schuster: { name: 'Paul Schuster', email: 'paul.schuster@musterhaus-software.de', role: 'Entwicklung Tour und Druck', gitlab: 27, username: 'pschuster' },
  hoffmann: { name: 'Lena Hoffmann', email: 'lena.hoffmann@musterhaus-software.de', role: 'Entwicklung Faktura und Fibu', gitlab: 19, username: 'lhoffmann' },
  becker: { name: 'Anna Becker', email: 'anna.becker@musterhaus-software.de', role: 'Entwicklung Kasse', gitlab: 35, username: 'abecker' },
  brenner: { name: 'Kai Brenner', email: 'kai.brenner@musterhaus-software.de', role: 'Cloud-Betrieb und Datenbank', gitlab: 14, username: 'kbrenner' },
  wagner: { name: 'Tim Wagner', email: 'tim.wagner@musterhaus-software.de', role: 'Qualitätssicherung', gitlab: 40, username: 'twagner' },
  kroeger: { name: 'Sabine Kröger', email: 'sabine.kroeger@musterhaus-software.de', role: 'Redaktion Anwenderhandbuch', gitlab: 52, username: 'skroeger' },
  thelen: { name: 'Miriam Thelen', email: 'miriam.thelen@musterhaus-software.de', role: 'Fachberatung', gitlab: 53, username: 'mthelen' },
  reuter: { name: 'Tobias Reuter', email: 'tobias.reuter@musterhaus-software.de', role: 'Architektur', gitlab: 9, username: 'treuter' },
  demir: { name: 'Elif Demir', email: 'elif.demir@musterhaus-software.de', role: 'Produkt Finanzbuchhaltung', gitlab: 48, username: 'edemir' },
  support: { name: 'Support Musterhaus', email: 'support@musterhaus-software.de', role: 'Kundensupport', gitlab: 60, username: 'support' },
}

// Stable fake uuid per person so ids look real and never change between runs.
function uuid(seed) {
  let h = 2166136261
  const hex = []
  for (let round = 0; round < 4; round++) {
    for (const c of seed + round) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
    hex.push(h.toString(16).padStart(8, '0'))
  }
  const s = hex.join('')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-a${s.slice(17, 20)}-${s.slice(20, 32)}`
}

export const accountId = (key) => `712020:${uuid(key)}`

export const SITE = 'https://musterhaus-software.atlassian.net'
export const GITLAB = 'https://gitlab.musterhaus-software.de'
export const PROJECT_PATH = 'mobiq/erp'
export const PROJECT_ID = 42

export function jiraUser(key) {
  const p = people[key]
  return {
    self: `${SITE}/rest/api/3/user?accountId=${accountId(key)}`,
    accountId: accountId(key),
    avatarUrls: { '48x48': `https://secure.gravatar.com/avatar/${uuid(key + 'av').replace(/-/g, '').slice(0, 32)}?d=mm&s=48` },
    displayName: p.name,
    active: true,
    timeZone: 'Europe/Berlin',
    accountType: 'atlassian',
  }
}

export function gitlabUser(key) {
  const p = people[key]
  return {
    id: p.gitlab,
    username: p.username,
    name: p.name,
    state: 'active',
    locked: false,
    avatar_url: null,
    web_url: `${GITLAB}/${p.username}`,
  }
}
