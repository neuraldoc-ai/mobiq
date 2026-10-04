// PostgreSQL database of MOBIQ: the schema at release 26.2, example data, the Flyway migrations of the
// repository (V26_3_*, V26_4_*) and the data that only exists after them. Everything is deterministic.
//
//   out/postgres/initdb/*.sql   run in file name order by the postgres Docker image (and by the dashboard)
//   out/postgres/docker-compose.yml
//
// Run on its own with `node src/postgres.mjs`; generate.mjs calls writePostgres() after the repository exists.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/* ---------- small helpers ---------- */

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(2604)
const int = (a, b) => a + Math.floor(rand() * (b - a + 1))
const pick = (list) => list[Math.floor(rand() * list.length)]
const chance = (p) => rand() < p

const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? 'true' : 'false') : `'${String(v).replace(/'/g, "''")}'`)
const money = (v) => (Math.round(v * 100) / 100).toFixed(2)
const day = (d) => d.toISOString().slice(0, 10)
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)
const insert = (table, cols, rows) => (rows.length ? `INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${rows.map((r) => `  (${r.map(q).join(', ')})`).join(',\n')};\n` : '')
const crc32 = (s) => {
  let c
  let crc = 0xffffffff
  for (const ch of Buffer.from(s, 'utf8')) {
    c = (crc ^ ch) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) | 0
}

/* ---------- master data ---------- */

const filialen = [
  ['Musterhaus Hannover', 'Hannover', '30159'],
  ['Musterhaus Bremen', 'Bremen', '28195'],
  ['Musterhaus Kassel', 'Kassel', '34117'],
  ['Musterhaus Osnabrück', 'Osnabrück', '49074'],
  ['Musterhaus Braunschweig', 'Braunschweig', '38100'],
]

const artikel = [
  ['Polstermöbel', 'Sofa Malmö 3-Sitzer', 899, 62, 1.9],
  ['Polstermöbel', 'Sofa Malmö 2-Sitzer', 699, 48, 1.4],
  ['Polstermöbel', 'Ecksofa Lund links', 1499, 95, 3.1],
  ['Polstermöbel', 'Sessel Visby', 349, 21, 0.7],
  ['Polstermöbel', 'Hocker Visby', 129, 7, 0.2],
  ['Küchen', 'Küchenzeile Aarhus 240 cm', 2190, 210, 3.8],
  ['Küchen', 'Küchenzeile Aarhus 300 cm', 2690, 255, 4.6],
  ['Küchen', 'Kücheninsel Odense', 1290, 140, 2.2],
  ['Küchen', 'Einbauherd Set Nordic', 799, 55, 0.6],
  ['Küchen', 'Spüle Edelstahl Doppel', 349, 24, 0.3],
  ['Schlafzimmer', 'Bett Fjord 180x200', 799, 70, 1.8],
  ['Schlafzimmer', 'Bett Fjord 140x200', 649, 58, 1.5],
  ['Schlafzimmer', 'Kleiderschrank Bergen 250 cm', 1190, 135, 2.9],
  ['Schlafzimmer', 'Nachttisch Bergen', 119, 12, 0.2],
  ['Schlafzimmer', 'Kommode Bergen', 399, 40, 0.6],
  ['Esszimmer', 'Esstisch Skagen 180 cm', 649, 52, 1.1],
  ['Esszimmer', 'Esstisch Skagen 220 cm', 799, 64, 1.4],
  ['Esszimmer', 'Stuhl Skagen', 99, 6, 0.2],
  ['Esszimmer', 'Sideboard Skagen', 549, 58, 0.9],
  ['Esszimmer', 'Vitrine Skagen', 749, 66, 1.2],
  ['Wohnen', 'Regal Kiruna 5 Fächer', 229, 28, 0.6],
  ['Wohnen', 'TV-Board Kiruna', 349, 36, 0.7],
  ['Wohnen', 'Couchtisch Luleå', 249, 22, 0.4],
  ['Wohnen', 'Beistelltisch Luleå', 89, 5, 0.1],
  ['Matratzen', 'Kaltschaummatratze 90x200', 349, 16, 0.5],
  ['Matratzen', 'Kaltschaummatratze 180x200', 599, 30, 0.9],
  ['Matratzen', 'Lattenrost verstellbar 90x200', 229, 14, 0.4],
  ['Leuchten', 'Stehleuchte Aura', 129, 6, 0.2],
  ['Leuchten', 'Pendelleuchte Aura', 169, 4, 0.2],
  ['Leuchten', 'Tischleuchte Aura', 59, 2, 0.05],
].map(([gruppe, text, preis, kg, m3], i) => ({ nr: `A-${10001 + i}`, gruppe, text, preis, kg, m3 }))

const vornamen = ['Anna', 'Jonas', 'Lena', 'Paul', 'Mira', 'Tobias', 'Elif', 'Kai', 'Sabine', 'Markus', 'Julia', 'Stefan', 'Nina', 'Felix', 'Claudia', 'Jan', 'Petra', 'Lukas', 'Sandra', 'Michael', 'Katrin', 'Ole', 'Svenja', 'Hanna']
const nachnamen = ['Meier', 'Schmidt', 'Köhler', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Maier', 'Fuchs', 'Peters']
const strassen = ['Lindenallee', 'Bahnhofstraße', 'Gartenweg', 'Am Markt', 'Schulstraße', 'Bergstraße', 'Ringstraße', 'Eichenweg', 'Hauptstraße', 'Wiesenstraße']
const orte = [['30159', 'Hannover'], ['30177', 'Hannover'], ['28195', 'Bremen'], ['28203', 'Bremen'], ['34117', 'Kassel'], ['49074', 'Osnabrück'], ['38100', 'Braunschweig'], ['31134', 'Hildesheim'], ['29221', 'Celle']]
const fahrer = ['Dirk Lorenz', 'Ismail Kaya', 'Jens Pohl', 'Marco Vogt', 'Thomas Ernst']

/* ---------- schema at release 26.2 ---------- */

const schema = `-- MOBIQ ERP: Datenbankstand Release 26.2.
-- Ab hier führen die Flyway-Migrationen aus db/migration im Repository (V26_3_*, V26_4_*) weiter.
-- PostgreSQL 18

CREATE TABLE filiale (
  filial_id  serial       PRIMARY KEY,
  name       varchar(80)  NOT NULL,
  ort        varchar(60)  NOT NULL,
  plz        char(5)      NOT NULL
);

CREATE TABLE kunde (
  kunde_id   bigserial    PRIMARY KEY,
  kunde_nr   varchar(10)  NOT NULL UNIQUE,
  vorname    varchar(60)  NOT NULL,
  nachname   varchar(60)  NOT NULL,
  strasse    varchar(80),
  plz        char(5),
  ort        varchar(60),
  email      varchar(120),
  angelegt   date         NOT NULL
);

CREATE TABLE artikel (
  artikel_nr   varchar(10)   PRIMARY KEY,
  bezeichnung  varchar(120)  NOT NULL,
  warengruppe  varchar(40)   NOT NULL,
  preis        numeric(10,2) NOT NULL CHECK (preis >= 0),
  gewicht_kg   numeric(7,2),
  volumen_m3   numeric(6,3)
);

CREATE TABLE fahrzeug (
  fahrzeug_id    serial       PRIMARY KEY,
  kennzeichen    varchar(12)  NOT NULL UNIQUE,
  bezeichnung    varchar(60)  NOT NULL,
  ladevolumen_m3 numeric(5,1) NOT NULL,
  filial_id      integer      NOT NULL REFERENCES filiale (filial_id)
);

CREATE TABLE kaufvertrag (
  kv_id         bigserial     PRIMARY KEY,
  kv_nr         varchar(12)   NOT NULL UNIQUE,
  kunde_id      bigint        NOT NULL REFERENCES kunde (kunde_id),
  filial_id     integer       NOT NULL REFERENCES filiale (filial_id),
  status        varchar(20)   NOT NULL DEFAULT 'ERFASST'
                CHECK (status IN ('ERFASST','LIEFERBEREIT','DISPONIERT','AUSGELIEFERT','ABGERECHNET','STORNIERT')),
  anzahlung     numeric(10,2) NOT NULL DEFAULT 0,
  liefersperre  boolean       NOT NULL DEFAULT false,
  erfasst_am    date          NOT NULL,
  wunschtermin  date
);

CREATE TABLE kv_position (
  kvp_id       bigserial     PRIMARY KEY,
  kv_id        bigint        NOT NULL REFERENCES kaufvertrag (kv_id),
  pos_nr       smallint      NOT NULL,
  artikel_nr   varchar(10)   NOT NULL REFERENCES artikel (artikel_nr),
  menge        integer       NOT NULL CHECK (menge > 0),
  einzelpreis  numeric(10,2) NOT NULL,
  im_lager     boolean       NOT NULL DEFAULT false,
  UNIQUE (kv_id, pos_nr)
);

CREATE TABLE tour (
  tour_id      bigserial    PRIMARY KEY,
  tour_datum   date         NOT NULL,
  fahrzeug_id  integer      NOT NULL REFERENCES fahrzeug (fahrzeug_id),
  fahrer       varchar(60)  NOT NULL
);

CREATE TABLE tour_stopp (
  stopp_id     bigserial    PRIMARY KEY,
  tour_id      bigint       NOT NULL REFERENCES tour (tour_id),
  kv_id        bigint       NOT NULL REFERENCES kaufvertrag (kv_id),
  reihenfolge  smallint     NOT NULL,
  avisiert_am  timestamp,
  UNIQUE (tour_id, reihenfolge)
);

-- Kassenbelege: der Primärschlüssel enthält das Belegdatum, damit die Tabelle später nach Jahr
-- partitioniert werden kann (V26_4_015). Eine Partition kann nicht per Fremdschlüssel angesprochen werden,
-- darum verweist kassenzahlung nur über Beleg und Datum, ohne Constraint.
CREATE TABLE kassenbeleg (
  beleg_id    bigint GENERATED BY DEFAULT AS IDENTITY,
  belegdatum  date          NOT NULL,
  filial_id   integer       NOT NULL REFERENCES filiale (filial_id),
  kasse_nr    smallint      NOT NULL,
  summe       numeric(10,2) NOT NULL,
  storniert   boolean       NOT NULL DEFAULT false,
  PRIMARY KEY (beleg_id, belegdatum)
);
CREATE INDEX idx_kassenbeleg_tag ON kassenbeleg (filial_id, belegdatum);

CREATE TABLE gutschein (
  gutschein_nr  varchar(14)   PRIMARY KEY,
  wert          numeric(10,2) NOT NULL,
  restwert      numeric(10,2) NOT NULL CHECK (restwert >= 0),
  ausgestellt   date          NOT NULL,
  gueltig_bis   date          NOT NULL
);

CREATE TABLE kassenzahlung (
  zahlung_id    bigserial     PRIMARY KEY,
  beleg_id      bigint        NOT NULL,
  belegdatum    date          NOT NULL,
  zahlart       varchar(10)   NOT NULL CHECK (zahlart IN ('BAR','KARTE','GUTSCHEIN')),
  betrag        numeric(10,2) NOT NULL,
  gutschein_nr  varchar(14)   REFERENCES gutschein (gutschein_nr)
);

CREATE TABLE rechnung (
  rechnung_id  bigserial     PRIMARY KEY,
  rechnungs_nr varchar(14)   NOT NULL UNIQUE,
  kv_id        bigint        NOT NULL REFERENCES kaufvertrag (kv_id),
  belegart     char(2)       NOT NULL,
  betrag       numeric(10,2) NOT NULL,
  belegdatum   date          NOT NULL
);

-- Flyway merkt sich hier, welche Migrationen gelaufen sind.
CREATE TABLE flyway_schema_history (
  installed_rank  integer       PRIMARY KEY,
  version         varchar(50),
  description     varchar(200)  NOT NULL,
  type            varchar(20)   NOT NULL,
  script          varchar(1000) NOT NULL,
  checksum        integer,
  installed_by    varchar(100)  NOT NULL,
  installed_on    timestamp     NOT NULL,
  execution_time  integer       NOT NULL,
  success         boolean       NOT NULL
);
`

/* ---------- example data at release 26.2 ---------- */

function seed262() {
  let sql = '-- Beispieldaten (Stand vor den Migrationen von 26.3 und 26.4)\n\n'
  sql += insert('filiale', ['filial_id', 'name', 'ort', 'plz'], filialen.map((f, i) => [i + 1, ...f]))
  sql += '\n' + insert('artikel', ['artikel_nr', 'bezeichnung', 'warengruppe', 'preis', 'gewicht_kg', 'volumen_m3'], artikel.map((a) => [a.nr, a.text, a.gruppe, money(a.preis), money(a.kg), a.m3.toFixed(3)]))

  const fahrzeuge = [
    ['H-MO 4101', 'Sprinter 3,5 t', 14.0, 1],
    ['H-MO 4102', 'Sprinter 3,5 t', 14.0, 1],
    ['HB-MO 210', 'Crafter 5 t', 18.5, 2],
    ['KS-MO 77', 'Sprinter 3,5 t', 14.0, 3],
    ['OS-MO 15', 'Crafter 5 t', 18.5, 4],
    ['BS-MO 33', 'Sprinter 3,5 t', 14.0, 5],
  ]
  sql += '\n' + insert('fahrzeug', ['fahrzeug_id', 'kennzeichen', 'bezeichnung', 'ladevolumen_m3', 'filial_id'], fahrzeuge.map((f, i) => [i + 1, f[0], f[1], f[2].toFixed(1), f[3]]))

  const kunden = []
  for (let i = 0; i < 80; i++) {
    const [plz, ort] = pick(orte)
    const v = pick(vornamen)
    const n = pick(nachnamen)
    kunden.push([i + 1, `K-${String(20001 + i)}`, v, n, `${pick(strassen)} ${int(1, 90)}`, plz, ort, chance(0.85) ? `${v}.${n}${int(1, 99)}@example.de`.toLowerCase().replace(/[äöü]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[c]) : null, day(addDays(new Date('2023-01-10'), int(0, 1000)))])
  }
  sql += '\n' + insert('kunde', ['kunde_id', 'kunde_nr', 'vorname', 'nachname', 'strasse', 'plz', 'ort', 'email', 'angelegt'], kunden)

  // Kaufverträge with 1 to 4 positions each
  const statusFor = (erfasst) => {
    const age = (new Date('2026-09-29') - erfasst) / 86400000
    if (age > 60) return pick(['ABGERECHNET', 'ABGERECHNET', 'ABGERECHNET', 'AUSGELIEFERT', 'STORNIERT'])
    if (age > 30) return pick(['AUSGELIEFERT', 'ABGERECHNET', 'DISPONIERT', 'AUSGELIEFERT'])
    if (age > 12) return pick(['DISPONIERT', 'LIEFERBEREIT', 'AUSGELIEFERT'])
    return pick(['ERFASST', 'ERFASST', 'LIEFERBEREIT'])
  }
  const kvs = []
  const positionen = []
  let kvp = 0
  for (let i = 0; i < 140; i++) {
    const erfasst = addDays(new Date('2026-01-05'), int(0, 265))
    const status = statusFor(erfasst)
    const n = int(1, 4)
    const used = new Set()
    let summe = 0
    const pos = []
    for (let p = 1; p <= n; p++) {
      let a
      do a = pick(artikel)
      while (used.has(a.nr))
      used.add(a.nr)
      const menge = a.preis < 150 ? int(1, 6) : int(1, 2)
      summe += a.preis * menge
      pos.push([++kvp, i + 1, p, a.nr, menge, money(a.preis), status !== 'ERFASST' || chance(0.5)])
    }
    positionen.push(...pos)
    kvs.push({ id: i + 1, nr: `KV-${String(26001 + i)}`, kunde: int(1, kunden.length), filiale: int(1, filialen.length), status, anzahlung: money(summe * pick([0, 0.1, 0.2, 0.2, 0.3])), erfasst, wunsch: addDays(erfasst, int(14, 60)), summe })
  }
  sql += '\n' + insert('kaufvertrag', ['kv_id', 'kv_nr', 'kunde_id', 'filial_id', 'status', 'anzahlung', 'liefersperre', 'erfasst_am', 'wunschtermin'], kvs.map((k) => [k.id, k.nr, k.kunde, k.filiale, k.status, k.anzahlung, k.status === 'ERFASST' && chance(0.12), day(k.erfasst), day(k.wunsch)]))
  sql += '\n' + insert('kv_position', ['kvp_id', 'kv_id', 'pos_nr', 'artikel_nr', 'menge', 'einzelpreis', 'im_lager'], positionen)

  // Tours of September 2026 with the contracts that are disposed or delivered
  const delivering = kvs.filter((k) => ['DISPONIERT', 'AUSGELIEFERT'].includes(k.status))
  const tours = []
  const stopps = []
  let stoppId = 0
  let cursor = 0
  for (let t = 0; t < 26 && cursor < delivering.length; t++) {
    const datum = addDays(new Date('2026-09-01'), Math.floor(t / 1.2))
    tours.push([t + 1, day(datum), int(1, fahrzeuge.length), pick(fahrer)])
    const stops = int(2, 5)
    for (let s = 1; s <= stops && cursor < delivering.length; s++, cursor++) {
      stopps.push([++stoppId, t + 1, delivering[cursor].id, s, `${day(addDays(datum, -1))} ${String(int(8, 16)).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}:00`])
    }
  }
  sql += '\n' + insert('tour', ['tour_id', 'tour_datum', 'fahrzeug_id', 'fahrer'], tours)
  sql += '\n' + insert('tour_stopp', ['stopp_id', 'tour_id', 'kv_id', 'reihenfolge', 'avisiert_am'], stopps)

  // Gutscheine
  const gutscheine = []
  for (let i = 0; i < 40; i++) {
    const wert = pick([25, 50, 50, 100, 100, 150, 250])
    const ausg = addDays(new Date('2024-06-01'), int(0, 850))
    const rest = chance(0.55) ? wert : chance(0.5) ? 0 : money(wert * pick([0.2, 0.4, 0.6, 0.8]))
    gutscheine.push([`GS-${String(7001 + i)}-${int(10, 99)}`, money(wert), money(Number(rest)), day(ausg), day(addDays(ausg, 1095))])
  }
  sql += '\n' + insert('gutschein', ['gutschein_nr', 'wert', 'restwert', 'ausgestellt', 'gueltig_bis'], gutscheine)

  // Kassenbelege 2023 to September 2026, with their payments
  const belege = []
  const zahlungen = []
  let belegId = 0
  let zahlungId = 0
  const start = new Date('2023-01-02')
  const end = new Date('2026-09-29')
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    if (d.getUTCDay() === 0) continue
    const perDay = int(0, 1) + (d.getUTCDay() === 6 ? 1 : 0)
    for (let i = 0; i < perDay + (chance(0.35) ? 1 : 0); i++) {
      const a1 = pick(artikel)
      const summe = a1.preis * (a1.preis < 150 ? int(1, 3) : 1) + (chance(0.3) ? pick(artikel).preis : 0)
      belegId++
      const storno = chance(0.03)
      belege.push([belegId, day(d), int(1, filialen.length), int(1, 3), money(summe), storno])
      const art = pick(['BAR', 'KARTE', 'KARTE', 'KARTE', 'GUTSCHEIN'])
      if (art === 'GUTSCHEIN' && chance(0.7)) {
        const g = pick(gutscheine)
        const teil = Math.min(Number(g[2]) || 25, summe)
        zahlungen.push([++zahlungId, belegId, day(d), 'GUTSCHEIN', money(teil), g[0]])
        zahlungen.push([++zahlungId, belegId, day(d), 'KARTE', money(summe - teil), null])
      } else {
        zahlungen.push([++zahlungId, belegId, day(d), art === 'GUTSCHEIN' ? 'BAR' : art, money(summe), null])
      }
    }
  }
  sql += '\n' + insert('kassenbeleg', ['beleg_id', 'belegdatum', 'filial_id', 'kasse_nr', 'summe', 'storniert'], belege)
  sql += '\n' + insert('kassenzahlung', ['zahlung_id', 'beleg_id', 'belegdatum', 'zahlart', 'betrag', 'gutschein_nr'], zahlungen)

  // Rechnungen for settled contracts
  const rechnungen = []
  let reNr = 0
  for (const k of kvs.filter((x) => x.status === 'ABGERECHNET')) {
    rechnungen.push([++reNr, `RE-26${String(1000 + reNr)}`, k.id, 'RE', money(k.summe), day(addDays(k.wunsch, int(0, 6)))])
    if (Number(k.anzahlung) > 0) rechnungen.push([++reNr, `AZ-26${String(1000 + reNr)}`, k.id, 'AZ', k.anzahlung, day(addDays(k.erfasst, 1))])
  }
  sql += '\n' + insert('rechnung', ['rechnung_id', 'rechnungs_nr', 'kv_id', 'belegart', 'betrag', 'belegdatum'], rechnungen)

  sql += `
-- Zähler hinter die eingefügten Werte setzen
SELECT setval(pg_get_serial_sequence('filiale', 'filial_id'), (SELECT max(filial_id) FROM filiale));
SELECT setval(pg_get_serial_sequence('kunde', 'kunde_id'), (SELECT max(kunde_id) FROM kunde));
SELECT setval(pg_get_serial_sequence('fahrzeug', 'fahrzeug_id'), (SELECT max(fahrzeug_id) FROM fahrzeug));
SELECT setval(pg_get_serial_sequence('kaufvertrag', 'kv_id'), (SELECT max(kv_id) FROM kaufvertrag));
SELECT setval(pg_get_serial_sequence('kv_position', 'kvp_id'), (SELECT max(kvp_id) FROM kv_position));
SELECT setval(pg_get_serial_sequence('tour', 'tour_id'), (SELECT max(tour_id) FROM tour));
SELECT setval(pg_get_serial_sequence('tour_stopp', 'stopp_id'), (SELECT max(stopp_id) FROM tour_stopp));
SELECT setval(pg_get_serial_sequence('kassenzahlung', 'zahlung_id'), (SELECT max(zahlung_id) FROM kassenzahlung));
SELECT setval(pg_get_serial_sequence('rechnung', 'rechnung_id'), (SELECT max(rechnung_id) FROM rechnung));
`
  return { sql, kvs, stopps }
}

/* ---------- data that exists after the 26.4 migrations ---------- */

function seed264(kvs, stopps, migrations) {
  let sql = '-- Stand nach den Migrationen von 26.4: Finanzkäufe, Teillieferungen und die Flyway-Historie\n\n'
  const finanz = kvs.filter((k) => k.summe > 1500 && chance(0.25)).map((k) => k.id)
  sql += `UPDATE kaufvertrag SET finanzkauf = true WHERE kv_id IN (${finanz.join(', ')});\n\n`

  // Teillieferungen: contracts with several positions that are not a Finanzkauf (Finanzkauf ist gesperrt)
  const candidates = kvs.filter((k) => !finanz.includes(k.id) && ['DISPONIERT', 'AUSGELIEFERT', 'LIEFERBEREIT'].includes(k.status)).slice(0, 8)
  const teile = []
  const kw = (d) => {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    const dayNum = t.getUTCDay() || 7
    t.setUTCDate(t.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
    return `${t.getUTCFullYear()}-${String(Math.ceil(((t - yearStart) / 86400000 + 1) / 7)).padStart(2, '0')}`
  }
  let lt = 0
  const ltRows = []
  for (const k of candidates) {
    for (let teil = 1; teil <= 2; teil++) {
      ltRows.push([++lt, k.id, teil, kw(addDays(k.wunsch, (teil - 1) * 21)), teil === 1 && k.status !== 'LIEFERBEREIT' ? 'AUSGELIEFERT' : 'ERFASST'])
      teile.push({ lt, kv: k.id, teil })
    }
  }
  sql += insert('lieferteil', ['lt_id', 'kv_id', 'teil_nr', 'wunsch_kw', 'status'], ltRows)
  sql += '\n'
  for (const t of teile) {
    sql += t.teil === 1
      ? `UPDATE kv_position SET lt_id = ${t.lt} WHERE kv_id = ${t.kv} AND pos_nr = 1;\n`
      : `UPDATE kv_position SET lt_id = ${t.lt} WHERE kv_id = ${t.kv} AND pos_nr > 1;\n`
  }
  sql += '\n'
  for (const s of stopps.filter((x) => teile.some((t) => t.kv === x[2] && t.teil === 1))) {
    const t = teile.find((x) => x.kv === s[2] && x.teil === 1)
    sql += `UPDATE tour_stopp SET lt_id = ${t.lt} WHERE stopp_id = ${s[0]};\n`
  }
  sql += `\nSELECT setval(pg_get_serial_sequence('lieferteil', 'lt_id'), (SELECT max(lt_id) FROM lieferteil));\n`
  sql += `SELECT setval(pg_get_serial_sequence('kassenbeleg', 'beleg_id'), (SELECT max(beleg_id) FROM kassenbeleg));\n\n`
  // Teilrechnungen (Belegart TR) for the delivered first parts
  sql += `INSERT INTO rechnung (rechnungs_nr, kv_id, belegart, betrag, belegdatum)\nSELECT 'TR-26' || (2000 + l.lt_id), l.kv_id, 'TR', round(sum(p.menge * p.einzelpreis), 2), k.wunschtermin\nFROM lieferteil l\nJOIN kaufvertrag k ON k.kv_id = l.kv_id\nJOIN kv_position p ON p.lt_id = l.lt_id\nWHERE l.status = 'AUSGELIEFERT'\nGROUP BY l.lt_id, l.kv_id, k.wunschtermin;\n\n`

  // Flyway history, one row per migration of the repository
  const hist = [[1, '26.2', '<< Flyway Baseline >>', 'BASELINE', '<< Flyway Baseline >>', null, 'flyway', '2026-04-14 06:12:00', 0, true]]
  migrations.forEach((m, i) => {
    const mm = m.name.match(/^V(\d+(?:_\d+)*)__(.+)\.sql$/)
    hist.push([i + 2, mm[1].replace(/_/g, '.'), mm[2].replace(/_/g, ' '), 'SQL', m.name, crc32(m.content), 'flyway', m.name.startsWith('V26_3') ? `2026-06-${String(2 + i).padStart(2, '0')} 05:30:00` : `2026-09-${String(8 + i).padStart(2, '0')} 05:30:00`, int(12, 480), true])
  })
  sql += insert('flyway_schema_history', ['installed_rank', 'version', 'description', 'type', 'script', 'checksum', 'installed_by', 'installed_on', 'execution_time', 'success'], hist)
  return sql
}

/* ---------- output ---------- */

export function writePostgres(outDir, repoDir) {
  const migDir = path.join(repoDir, 'db', 'migration')
  const migrations = fs
    .readdirSync(migDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, content: fs.readFileSync(path.join(migDir, name), 'utf8') }))

  const dir = path.join(outDir, 'postgres')
  const init = path.join(dir, 'initdb')
  fs.mkdirSync(init, { recursive: true })
  const write = (rel, text) => fs.writeFileSync(path.join(dir, rel), text.replace(/\r\n/g, '\n'), 'utf8')

  const { sql: seed, kvs, stopps } = seed262()
  write('initdb/01_schema_26_2.sql', schema)
  write('initdb/02_daten_26_2.sql', seed)
  migrations.forEach((m, i) => write(`initdb/${String(10 + i)}_${m.name}`, m.content))
  write('initdb/90_daten_26_4.sql', seed264(kvs, stopps, migrations))

  write(
    'docker-compose.yml',
    `# Die MOBIQ-Datenbank als echtes PostgreSQL:  docker compose up -d
# Das Image führt die Dateien in initdb/ beim ersten Start in Namensreihenfolge aus:
# Schema 26.2, Daten, die Flyway-Migrationen aus dem Repository, Daten nach 26.4.
services:
  mobiq-db:
    image: postgres:18
    container_name: mobiq-db
    environment:
      POSTGRES_DB: mobiq
      POSTGRES_USER: mobiq
      POSTGRES_PASSWORD: mobiq-demo
    ports:
      - "5433:5432"
    volumes:
      - ./initdb:/docker-entrypoint-initdb.d:ro
`,
  )
  // Numbers for the Daten page card, so it does not have to start the database to show them
  const dataSql = fs.readFileSync(path.join(init, '02_daten_26_2.sql'), 'utf8')
  const allSql = [schema, ...migrations.map((m) => m.content)].join('\n')
  const tables = new Set([...allSql.matchAll(/^CREATE TABLE (\w+) \($/gm)].map((m) => m[1]))
  const overview = { version: 'PostgreSQL 18', tables: tables.size, rows: (dataSql.match(/^ {2}\(/gm) ?? []).length, migrations: migrations.length }
  write('overview.json', JSON.stringify(overview, null, 2) + '\n')
  return { files: fs.readdirSync(init).length, ...overview }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(writePostgres(path.join(ROOT, 'out'), path.join(ROOT, 'out', 'repo')))
}
