// Change benchmark for MOBIQ 26.5: 22 commits on top of release/26.4 (tag v26.4.0), each a typical or tricky case,
// with the documents of the clean 26.4 state (stand-26.4/) that each case makes outdated. Deterministic: fixed
// author and dates, so the commit ids are the same on every run.
//   node bench-26.5/build.mjs <mobiq-code worktree on a branch that starts at release/26.4>
// Writes bench-26.5/cases.json. Documents are named by their dataset page id (Confluence), file name (Drive) or
// "new:<title>" for the two pages that 26.4 added.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(process.argv[2] || '.')
const git = (args, env = {}) => execFileSync('git', ['-c', 'core.autocrlf=false', ...args], { cwd: repo, encoding: 'utf8', env: { ...process.env, ...env } }).trim()
const read = (f) => fs.readFileSync(path.join(repo, f), 'utf8')
const write = (f, text) => { fs.mkdirSync(path.dirname(path.join(repo, f)), { recursive: true }); fs.writeFileSync(path.join(repo, f), text) }
const edit = (f, find, replace) => { const t = read(f); if (t.split(find).length !== 2) throw new Error(`${f}: Stelle nicht eindeutig: ${find.slice(0, 60)}`); write(f, t.replace(find, () => replace)) }
// A YAML parameter's field, found inside its block.
const param = (f, name, field, value) => {
  const t = read(f), at = t.indexOf(`${name}:`), next = t.indexOf('\n', at), end = t.slice(next).search(/\n[A-Z_]+:/)
  const block = t.slice(at, end < 0 ? t.length : next + end), changed = block.replace(new RegExp(`(\\n  ${field}: ).*`), `$1${value}`)
  if (at < 0 || changed === block) throw new Error(`${f}: ${name}.${field} nicht gefunden`)
  write(f, t.slice(0, at) + changed + t.slice(at + block.length))
}

const PA = '426115233', PT = '426115264', XL = 'MOBIQ_Parameterliste_26.4.xlsx', DLG = 'Dialogbeschreibung_Kaufvertrag_v8.docx', REG = '426115141'
const HB_LIEF = '393281702', HB_ANZ = '393281733', HB_TOUR = '393282049', HB_LS = '393282080', HB_GS = '393282337', HB_REST = '393282371', HB_FAQ = '393282402', SCHULUNG = 'Schulung_Verkauf_Kaufvertrag_Kasse.pdf', LB = 'Leistungsbeschreibung_MOBIQ_ERP_2026.docx'
const DEV_KASSE = '458752165', DEV_MIG = '458752133', DEV_FIBU = '458752069', ZAHLUNG = '426115176', FAHRZEUG = 'new:Stammdaten – Fahrzeug'

/** Each step: one commit (message, changes) and the case it belongs to; a case may span several commits. */
const steps = [
  { case: 'default-wert', msg: 'MOB-4901 Liefervorlauf Standard 5 Tage', kind: 'Standardwert geändert', run: () => param('config/parameter/auftrag.yaml', 'LIEF_VORLAUF_TAGE', 'standard', '5'),
    expected: [[PA, 'must', 'LIEF_VORLAUF_TAGE: Standard 3 → 5'], [XL, 'must', 'Blatt Auftrag: LIEF_VORLAUF_TAGE Standard 3 → 5']] },
  { case: 'wertebereich', msg: 'MOB-4903 Bis zu 8 Lieferteile erlauben', kind: 'Wertebereich geändert', run: () => param('config/parameter/auftrag.yaml', 'TEILLIEF_MAX_ANZAHL', 'max', '8'),
    expected: [[PA, 'must', 'TEILLIEF_MAX_ANZAHL: Max 5 → 8'], [XL, 'must', 'TEILLIEF_MAX_ANZAHL: Max 5 → 8'], [HB_LIEF, 'must', '3.4: „einstellbar von 2 bis 5“ → 2 bis 8']] },
  { case: 'label-umbenannt', msg: 'MOB-4905 Feld heißt jetzt Stockwerk / Aufzug', kind: 'Oberflächentext umbenannt (i18n)', run: () => edit('web/src/i18n/de.json', '"Etage / Aufzug"', '"Stockwerk / Aufzug"'),
    expected: [[REG, 'must', 'Feldtabelle: „Etage / Aufzug“ → „Stockwerk / Aufzug“'], [DLG, 'must', 'Register Lieferung: Feld „Stockwerk / Aufzug“']] },
  { case: 'regel-ohne-kommentar', msg: 'MOB-4907 Lieferbereit erst nach Anzahlung', kind: 'Geschäftsregel geändert, Kommentar veraltet', run: () => edit('server/src/main/java/de/musterhaus/mobiq/auftrag/Kaufvertrag.java', 'return !liefersperre && positionen', 'return !liefersperre && anzahlung.signum() > 0 && positionen'),
    expected: [[HB_LIEF, 'must', '3.2 (und Einleitung): lieferbereit erst, wenn eine Anzahlung eingegangen ist'], [HB_ANZ, 'should', 'Ohne Anzahlung wird der Kaufvertrag nicht lieferbereit']], notAffected: [PA, HB_TOUR] },
  { case: 'kommentar-luegt', msg: 'MOB-4909 Tagesabschluss ohne stornierte Bons', kind: 'Verhalten geändert, Kommentar sagt das Gegenteil', run: () => edit('server/src/main/java/de/musterhaus/mobiq/kasse/Tagesabschluss.java', 'belege.findeTag(filiale, tag);', 'belege.findeTag(filiale, tag).stream().filter(b -> !b.storniert()).toList();'),
    expected: [[DEV_KASSE, 'must', '3: Der Tagesabschluss liest nicht alle Belege, stornierte zählen nicht']], notAffected: [HB_GS, ZAHLUNG] },
  { case: 'neue-regel', msg: 'MOB-4911 Abgelaufene Gutscheine ablehnen', kind: 'neue Regel, die nirgends steht', run: () => {
    edit('server/src/main/java/de/musterhaus/mobiq/kasse/GutscheinService.java', 'import java.math.BigDecimal;\n', 'import java.math.BigDecimal;\nimport java.time.LocalDate;\n')
    edit('server/src/main/java/de/musterhaus/mobiq/kasse/GutscheinService.java', '    public Einloesung einloesen(Gutschein g, BigDecimal bonBetrag) {\n', '    public Einloesung einloesen(Gutschein g, BigDecimal bonBetrag) {\n        if (g.gueltigBis().isBefore(LocalDate.now())) {\n            return Einloesung.abgelehnt(g.restwert());\n        }\n')
  }, expected: [[HB_GS, 'must', 'Abgelaufene Gutscheine werden abgelehnt'], [HB_FAQ, 'should', 'FAQ: abgelaufener Gutschein'], [SCHULUNG, 'should', 'Folie Gutscheine: Gültigkeit']] },
  { case: 'refactoring', msg: 'MOB-4913 StoppBuilder aufgeräumt', kind: 'reines Refactoring', run: () => {
    const f = 'server/src/main/java/de/musterhaus/mobiq/tour/StoppBuilder.java'
    write(f, read(f).replaceAll('volumen(', 'summeVolumen(').replace('private double summeVolumen(List<KvPosition> positionen) {\n        return positionen.stream().mapToDouble(p -> p.volumenM3().doubleValue()).sum();', 'private double summeVolumen(List<KvPosition> positionen) {\n        double summe = 0;\n        for (KvPosition p : positionen) summe += p.volumenM3().doubleValue();\n        return summe;'))
  }, expected: [], notAffected: [HB_TOUR, PT, '458752033'] },
  { case: 'nur-tests', msg: 'MOB-4915 Tests Tourprüfung', kind: 'nur Tests', run: () => edit('server/src/test/java/de/musterhaus/mobiq/tour/TourPruefungTest.java', '    }\n}\n', '    }\n\n    @Test\n    void zwoelfStoppsSindErlaubt() {\n        Tour tour = Testdaten.tourMitStopps(12);\n        assertThat(new TourPruefung(Testdaten.parameter()).pruefe(tour).istOk()).isTrue();\n    }\n}\n'),
    expected: [], notAffected: [PT, HB_TOUR] },
  { case: 'bug-und-fix', msg: 'MOB-4917 Tourprüfung vereinfacht', kind: 'Bug: eine Tour darf einen Stopp weniger haben, als dokumentiert', run: () => edit('server/src/main/java/de/musterhaus/mobiq/tour/TourPruefung.java', 'tour.stopps().size() > param.getInt("TOUR_MAX_STOPPS")', 'tour.stopps().size() >= param.getInt("TOUR_MAX_STOPPS")'),
    expected: [[PT, 'should', 'TOUR_MAX_STOPPS: es sind nur noch 11 statt 12 Stopps möglich (eigentlich ein Code-Fehler)']] },
  { case: 'bug-und-fix', msg: 'MOB-4918 Fix: 12 Stopps je Tour wieder möglich', kind: 'Fix stellt das dokumentierte Verhalten wieder her', run: () => edit('server/src/main/java/de/musterhaus/mobiq/tour/TourPruefung.java', 'tour.stopps().size() >= param.getInt("TOUR_MAX_STOPPS")', 'tour.stopps().size() > param.getInt("TOUR_MAX_STOPPS")'),
    expected: [], notAffected: [PT] },
  { case: 'nur-technik', msg: 'MOB-4920 Spalte kassenbeleg.storno_grund', kind: 'Datenbank, nur technische Doku', run: () => write('db/migration/V26_5_001__kassenbeleg_storno_grund.sql', '-- Grund eines Stornos am Kassenbeleg (MOB-4920)\nALTER TABLE kassenbeleg ADD COLUMN storno_grund varchar(80);\n'),
    expected: [[DEV_MIG, 'must', 'Migration V26_5_001: Spalte kassenbeleg.storno_grund'], [DEV_KASSE, 'should', 'kassenbeleg hat einen Stornogrund']], notAffected: [HB_GS, HB_FAQ, ZAHLUNG] },
  { case: 'feature-3-commits', msg: 'MOB-4922 WIP Montage-Zeitfenster', kind: 'Feature über drei Commits, erst Parameter', run: () => fs.appendFileSync(path.join(repo, 'config/parameter/auftrag.yaml'), 'MONT_ZEITFENSTER_STD:\n  typ: int\n  standard: 4\n  min: 2\n  max: 8\n  einheit: Stunden\n  beschreibung: Zeitfenster, das dem Kunden für die Montage genannt wird\n'),
    expected: [[PA, 'must', 'neuer Parameter MONT_ZEITFENSTER_STD'], [XL, 'must', 'neuer Parameter MONT_ZEITFENSTER_STD']] },
  { case: 'feature-3-commits', msg: 'MOB-4922 Zeitfenster am Stopp anzeigen', kind: 'Feature über drei Commits, dann Oberfläche', run: () => {
    edit('server/src/main/java/de/musterhaus/mobiq/tour/TourStopp.java', 'public record TourStopp(String kvNr, Integer teilNr, boolean montage, double volumenM3) {', 'public record TourStopp(String kvNr, Integer teilNr, boolean montage, double volumenM3, Integer zeitfensterStd) {')
    edit('web/src/tour/StoppKarte.tsx', 'montage={s.montage} />', 'montage={s.montage} hinweis={s.montage && s.zeitfensterStd ? `Montage-Zeitfenster ${s.zeitfensterStd} h` : undefined} />')
  }, expected: [[HB_TOUR, 'should', '2.3: Stopps mit Montage zeigen das Zeitfenster']] },
  { case: 'feature-3-commits', msg: 'MOB-4922 Zeitfenster Standard 3 Stunden', kind: 'Feature über drei Commits, Zwischenwert überholt', run: () => { param('config/parameter/auftrag.yaml', 'MONT_ZEITFENSTER_STD', 'standard', '3'); param('config/parameter/auftrag.yaml', 'MONT_ZEITFENSTER_STD', 'min', '1') },
    expected: [[PA, 'must', 'MONT_ZEITFENSTER_STD: Standard 3, Min 1'], [XL, 'must', 'MONT_ZEITFENSTER_STD: Standard 3, Min 1']] },
  { case: 'revert', msg: 'MOB-4925 Avisierung 36 Stunden vorher', kind: 'Änderung, gleich danach zurückgenommen', run: () => param('config/parameter/auftrag.yaml', 'LIEF_AVIS_STUNDEN', 'standard', '36'),
    expected: [[PA, 'must', 'LIEF_AVIS_STUNDEN 24 → 36'], [XL, 'must', 'LIEF_AVIS_STUNDEN 24 → 36'], [HB_LS, 'must', '„standardmäßig 24 Stunden“ → 36'], [LB, 'must', '„standardmäßig 24 Stunden“ → 36']] },
  { case: 'revert', msg: 'Revert "MOB-4925 Avisierung 36 Stunden vorher"', kind: 'Revert: wieder der dokumentierte Stand', run: () => param('config/parameter/auftrag.yaml', 'LIEF_AVIS_STUNDEN', 'standard', '24'),
    expected: [], notAffected: [PA, HB_LS] },
  { case: 'kotlin-app', msg: 'MOB-4927 Fahrer kassiert bar nur bis 1.000 €', kind: 'Regel in der Fahrer-App (Kotlin)', run: () => {
    edit('app/fahrer/src/main/kotlin/de/musterhaus/mobiq/fahrer/Restzahlung.kt', 'class Restzahlung(private val api: FahrerApi) {\n', 'class Restzahlung(private val api: FahrerApi) {\n\n    /** Bar nur bis zu dieser Grenze, darüber nur Karte (Geldwäschegesetz). */\n    val barGrenze = BigDecimal("1000.00")\n\n    fun zahlarten(betrag: BigDecimal): List<Zahlart> = if (betrag > barGrenze) listOf(Zahlart.KARTE) else listOf(Zahlart.BAR, Zahlart.KARTE)\n')
  }, expected: [[HB_LS, 'must', 'Bar nur bis 1.000 €, darüber nur Karte'], [HB_REST, 'should', 'Restzahlung: Grenze für Barzahlung']] },
  { case: 'delphi-desktop', msg: 'MOB-4929 Desktop: Checkbox Expresslieferung', kind: 'Feld nur im Delphi-Desktop', run: () => {
    edit('desktop/kaufvertrag/FrmLieferung.pas', '    btnAufteilen: TButton;\n', '    btnAufteilen: TButton;\n    chkExpress: TCheckBox;\n')
    edit('desktop/kaufvertrag/FrmLieferung.pas', '  chkMontage.Checked := FKv.HatMontage;\n', '  chkMontage.Checked := FKv.HatMontage;\n  chkExpress.Caption := Texte.Get(1207);\n  chkExpress.Checked := FKv.Express;\n')
    edit('desktop/res/texte_de.rc', '  1206, "Lieferung aufteilen"\n', '  1206, "Lieferung aufteilen"\n  1207, "Expresslieferung"\n')
  }, expected: [[REG, 'must', 'Feldtabelle: Checkbox „Expresslieferung“ (Desktop)'], [DLG, 'must', 'Register Lieferung: Feld „Expresslieferung“']] },
  { case: 'druckvorlage', msg: 'MOB-4931 Lieferschein mit Unterschrift', kind: 'nur Druckvorlage', run: () => edit('druck/vorlagen/lieferschein.html', '{{/positionen}}', '{{/positionen}}\n<p>Ware vollständig und unbeschädigt erhalten: {{kunde.unterschrift}}</p>'),
    expected: [[HB_LS, 'should', 'Der Kunde bestätigt den Empfang auf dem Lieferschein mit Unterschrift']] },
  { case: 'schnittstelle', msg: 'MOB-4933 Fibu-Export: Feld anzahlung_verrechnet', kind: 'Feld der Schnittstelle umbenannt, mit Migration', run: () => {
    edit('server/src/main/java/de/musterhaus/mobiq/fibu/export/Buchungssatz.java', 'BigDecimal azVerrechnet)', 'BigDecimal anzahlungVerrechnet)')
    write('db/migration/V26_5_002__fibu_export_anzahlung.sql', '-- Sprechender Spaltenname (MOB-4933)\nALTER TABLE fibu_export RENAME COLUMN az_verrechnet TO anzahlung_verrechnet;\n')
  }, expected: [[DEV_FIBU, 'must', 'az_verrechnet → anzahlung_verrechnet (Tabelle und Text)'], [DEV_MIG, 'must', 'Migration V26_5_002']] },
  { case: 'irrefuehrende-nachricht', msg: 'chore: cleanup', kind: 'Nachricht sagt nichts, Wert in sechs Dokumenten ändert sich', run: () => param('config/parameter/auftrag.yaml', 'TEILLIEF_MIN_WARENWERT_PROZ', 'standard', '25'),
    expected: [[PA, 'must', 'TEILLIEF_MIN_WARENWERT_PROZ 20 → 25'], [XL, 'must', 'TEILLIEF_MIN_WARENWERT_PROZ 20 → 25'], [HB_LIEF, 'must', '3.4: „mindestens 20 %“ → 25 %'], [REG, 'must', 'Dialog: „Standard 20 %“ → 25 %'], [DLG, 'must', '„Standard 20 %“ → 25 %'], [SCHULUNG, 'must', '„mindestens 20 % des Warenwerts“ → 25 %']] },
  { case: 'toter-code', msg: 'feat: Avisierung auch per WhatsApp', kind: 'Nachricht verspricht ein Feature, der Code nutzt es nirgends', run: () => write('server/src/main/java/de/musterhaus/mobiq/auftrag/AvisKanal.java', 'package de.musterhaus.mobiq.auftrag;\n\n/** Kanäle für die Avisierung. WHATSAPP ist vorbereitet, aber noch nicht angebunden. */\npublic enum AvisKanal { SMS, EMAIL, WHATSAPP }\n'),
    expected: [], notAffected: [HB_LS, LB] },
  { case: 'neues-feld', msg: 'MOB-4935 Fahrzeugstamm: Kühlfahrzeug', kind: 'neues Feld in der Oberfläche (Web und Desktop)', run: () => {
    edit('web/src/stamm/Fahrzeug.tsx', "      <Field label={t('stamm.fahrzeug.filiale')} required>", "      <Checkbox label={t('stamm.fahrzeug.kuehlung')} checked={fz.kuehlung} onChange={(kuehlung) => onChange({ ...fz, kuehlung })} />\n      <Field label={t('stamm.fahrzeug.filiale')} required>")
    edit('web/src/stamm/Fahrzeug.tsx', "import { Auswahl, Field, Zahl, Text } from '@mobiq/ui'", "import { Auswahl, Checkbox, Field, Zahl, Text } from '@mobiq/ui'")
    edit('web/src/i18n/de.json', '  "stamm.fahrzeug.filiale": "Filiale"\n', '  "stamm.fahrzeug.filiale": "Filiale",\n  "stamm.fahrzeug.kuehlung": "Kühlfahrzeug"\n')
    edit('desktop/stamm/FrmFahrzeug.pas', '    cbxFiliale: TComboBox;\n', '    cbxFiliale: TComboBox;\n    chkKuehlung: TCheckBox;\n')
  }, expected: [[FAHRZEUG, 'must', 'Feldtabelle: Checkbox „Kühlfahrzeug“']] },
]

if (git(['status', '--porcelain'])) throw new Error('Arbeitsverzeichnis nicht sauber')
const base = git(['rev-parse', 'HEAD'])
const cases = new Map()
steps.forEach((step, i) => {
  step.run()
  const date = new Date(Date.UTC(2026, 9, 20 + Math.floor(i / 4), 8 + (i % 4) * 2)).toISOString()
  git(['add', '-A'])
  git(['commit', '-q', '-m', step.msg], { GIT_AUTHOR_NAME: 'Delschad Jankir', GIT_AUTHOR_EMAIL: '273245025+djankir@users.noreply.github.com', GIT_COMMITTER_NAME: 'Delschad Jankir', GIT_COMMITTER_EMAIL: '273245025+djankir@users.noreply.github.com', GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date })
  const sha = git(['rev-parse', 'HEAD'])
  const c = cases.get(step.case) ?? { id: step.case, commits: [] }
  c.commits.push({ sha, title: step.msg, kind: step.kind, expected: step.expected.map(([doc, level, what]) => ({ doc, level, what })), notAffected: step.notAffected ?? [] })
  cases.set(step.case, c)
})
const out = { base, branch: git(['rev-parse', '--abbrev-ref', 'HEAD']), head: git(['rev-parse', 'HEAD']), docs: 'stand-26.4 (mobiq/stand-26.4)', note: 'Erwartet ist je Commit, welche Dokumente des sauberen Stands 26.4 nach diesem Commit nicht mehr stimmen (Doku jeweils im Stand 26.4, nicht nachgezogen). must = falsch oder unvollständig, should = gute Praxis.', cases: [...cases.values()] }
fs.writeFileSync(path.join(HERE, 'cases.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`${steps.length} Commits, ${cases.size} Fälle, ${base.slice(0, 7)}..${out.head.slice(0, 7)}`)
