// Jira Cloud project MOB ("MOBIQ ERP"), as returned by POST /rest/api/3/search/jql
// with fields=*all and expand=renderedFields omitted. German Jira UI (status and priority names).
import { adf } from './formats.mjs'
import { SITE, jiraUser } from './people.mjs'

export const project = { id: '10004', key: 'MOB', name: 'MOBIQ ERP', projectTypeKey: 'software', simplified: false }

export const versions = [
  { id: '10231', name: '26.3', description: 'Sommer-Release', archived: false, released: true, startDate: '2026-05-04', releaseDate: '2026-07-21', projectId: 10004 },
  { id: '10245', name: '26.4', description: 'Herbst-Release, Code-Freeze 09.10.', archived: false, released: false, startDate: '2026-08-24', releaseDate: '2026-10-27', projectId: 10004 },
  { id: '10252', name: '26.5', description: '', archived: false, released: false, startDate: '2026-11-02', releaseDate: '2027-01-26', projectId: 10004 },
]

const components = {
  Kaufvertrag: '10110',
  Tourenplanung: '10111',
  Kasse: '10112',
  Faktura: '10113',
  'Fibu-Export': '10114',
  Druck: '10115',
  Plattform: '10116',
  Stammdaten: '10117',
}

const sprints = {
  s1: { id: 812, name: 'MOB Sprint 26.4-1', state: 'closed', boardId: 37, goal: 'Gutschein, Ladevolumen', startDate: '2026-08-24T07:00:00.000Z', endDate: '2026-09-04T15:00:00.000Z', completeDate: '2026-09-04T14:12:00.000Z' },
  s2: { id: 813, name: 'MOB Sprint 26.4-2', state: 'closed', boardId: 37, goal: 'Teillieferung Kern, Partitionierung', startDate: '2026-09-07T07:00:00.000Z', endDate: '2026-09-18T15:00:00.000Z', completeDate: '2026-09-18T14:40:00.000Z' },
  s3: { id: 814, name: 'MOB Sprint 26.4-3', state: 'active', boardId: 37, goal: 'Teillieferung fertig, Stabilisierung', startDate: '2026-09-21T07:00:00.000Z', endDate: '2026-10-02T15:00:00.000Z' },
}

const types = {
  Epic: { id: '10000', name: 'Epic', subtask: false, hierarchyLevel: 1 },
  Story: { id: '10001', name: 'Story', subtask: false, hierarchyLevel: 0 },
  Aufgabe: { id: '10002', name: 'Aufgabe', subtask: false, hierarchyLevel: 0 },
  Bug: { id: '10004', name: 'Bug', subtask: false, hierarchyLevel: 0 },
  'Unteraufgabe': { id: '10003', name: 'Unteraufgabe', subtask: true, hierarchyLevel: -1 },
}

const statuses = {
  'Zu erledigen': { id: '10000', category: { id: 2, key: 'new', colorName: 'blue-gray', name: 'Zu erledigen' } },
  'In Arbeit': { id: '3', category: { id: 4, key: 'indeterminate', colorName: 'yellow', name: 'In Arbeit' } },
  'In Review': { id: '10005', category: { id: 4, key: 'indeterminate', colorName: 'yellow', name: 'In Arbeit' } },
  Fertig: { id: '10001', category: { id: 3, key: 'done', colorName: 'green', name: 'Fertig' } },
}

const priorities = { Hoch: '2', Mittel: '3', Niedrig: '4' }

/* ------------------------------------------------------------------ */

const issues = [
  /* ---------------- Epics ---------------- */
  {
    key: 'MOB-4700', type: 'Epic', summary: 'Liefertreue erhöhen', status: 'In Arbeit', priority: 'Hoch',
    reporter: 'engel', assignee: 'engel', created: '2026-05-12T10:03:00+02:00', updated: '2026-09-29T15:50:00+02:00',
    components: ['Kaufvertrag', 'Tourenplanung'], labels: ['roadmap-2026'],
    description: adf.doc(adf.p('Ziel: Kunden bekommen ihre Ware früher und verlässlicher. Weniger Leerfahrten, weniger Rückfragen in der Disposition.'), adf.ul(['Teillieferung im Kaufvertrag', 'Ladevolumen je Fahrzeug', 'Feiertage je Bundesland im Liefertermin'])),
  },
  {
    key: 'MOB-4701', type: 'Epic', summary: 'Kasse 2026', status: 'In Arbeit', priority: 'Mittel',
    reporter: 'engel', assignee: 'becker', created: '2026-04-28T09:00:00+02:00', updated: '2026-09-21T09:41:00+02:00',
    components: ['Kasse'], labels: ['roadmap-2026'],
    description: adf.doc(adf.p('Sammel-Epic für Kassenthemen 2026: Gutscheine, neue Zahlarten, Testabdeckung.')),
  },
  {
    key: 'MOB-4702', type: 'Epic', summary: 'Technische Erneuerung', status: 'In Arbeit', priority: 'Mittel',
    reporter: 'reuter', assignee: 'reuter', created: '2026-03-02T08:30:00+01:00', updated: '2026-09-18T16:13:00+02:00',
    components: ['Plattform', 'Druck'], labels: ['tech-debt'],
    description: adf.doc(adf.p('Abbau technischer Schulden: FreeMarker ablösen, Java 21, Gradle 9.')),
  },
  {
    key: 'MOB-4703', type: 'Epic', summary: 'Performance Tagesabschluss', status: 'Fertig', priority: 'Hoch',
    reporter: 'support', assignee: 'brenner', created: '2026-06-03T11:15:00+02:00', updated: '2026-09-16T11:06:00+02:00', resolved: '2026-09-16T11:06:00+02:00',
    components: ['Kasse', 'Plattform'], labels: ['performance'],
    description: adf.doc(adf.p('Tagesabschluss dauert bei großen Mandanten über 40 Sekunden, die Kasse ist in der Zeit gesperrt.')),
  },

  /* ---------------- Teillieferung ---------------- */
  {
    key: 'MOB-4812', type: 'Story', summary: 'Teillieferung im Kaufvertrag', status: 'Fertig', priority: 'Hoch', parent: 'MOB-4700',
    reporter: 'engel', assignee: 'albrecht', created: '2026-08-12T09:14:00+02:00', updated: '2026-09-30T08:52:00+02:00', resolved: '2026-09-29T15:50:00+02:00',
    fixVersions: ['26.4'], components: ['Kaufvertrag', 'Tourenplanung', 'Faktura', 'Fibu-Export'], labels: ['kundenwunsch'], sprint: ['s2', 's3'], points: 13,
    description: adf.doc(
      adf.h(3, 'Ausgangslage'),
      adf.p('Heute wird ein Kaufvertrag erst ausgeliefert, wenn alle Positionen im Lager sind. Bei Küchen mit 8–12 Wochen Lieferzeit wartet der Kunde auf ein Sofa, das längst da ist. Möbel Kessler und Wohnwelt Sauer fragen seit 25.4 danach.'),
      adf.h(3, 'Anforderung'),
      adf.ul([
        'Kaufvertrag kann in mehrere Lieferteile aufgeteilt werden (je Mandant einschaltbar)',
        'Jeder Teil hat einen eigenen Wunschtermin und wird einzeln disponiert',
        'Montage nur beim Teil, der die Montageposition enthält',
        'Je gelieferten Teil eine Teilrechnung, Anzahlung anteilig verrechnen',
        'Fahrer kassiert nur den Anteil des gelieferten Teils',
      ]),
      adf.h(3, 'Akzeptanzkriterien'),
      adf.ol([
        'Register Lieferung zeigt „Teillieferung erlaubt“, wenn der Parameter aktiv ist',
        'Dialog „Lieferung aufteilen“: Positionen per Drag & Drop auf Teile verteilen',
        'Speichern nur, wenn jeder Teil den Mindestwarenwert erreicht',
        'Tourenplanung zeigt Teile als eigene Stopps',
        'Fibu-Export enthält Teilrechnungen',
      ]),
      adf.h(3, 'Offen'),
      adf.p('Finanzkauf: klären, ob die Partnerbank Teillieferungen akzeptiert (MOB-4808).'),
    ),
    comments: [
      { author: 'albrecht', created: '2026-09-09T14:30:00+02:00', body: adf.doc(adf.p('Wie viele Teile maximal? Ich lege erstmal `TEILLIEF_MAX_ANZAHL` mit 1 bis 10, Standard 2 an.')) },
      { author: 'engel', created: '2026-09-16T17:22:00+02:00', body: adf.doc(adf.p('Bitte 2 bis 5, Standard 3. Mehr will kein Kunde, und 1 Teil ist keine Teillieferung. Mindestwarenwert je Teil 20 %, sonst lohnt die Fahrt nicht.')) },
      { author: 'demir', created: '2026-09-18T10:05:00+02:00', body: adf.doc(adf.p('Fibu: Teilrechnungen bitte als eigene Belegart übergeben (Vorschlag TR). Sonst können die Kunden in der Fibu Teil- und Schlussrechnungen nicht auseinanderhalten. Erlös mit Datum der Teilrechnung, OP-Zuordnung weiter über die KV-Nummer.')) },
      { author: 'engel', created: '2026-09-22T08:47:00+02:00', body: adf.doc(adf.p('Finanzkauf: Für 26.4 sperren wir die Teillieferung bei Finanzkauf. Die Partnerbank zahlt erst nach vollständiger Lieferung aus. Ob das so bleibt, klären wir in MOB-4808. Im Handbuch bitte erstmal so beschreiben.')) },
      { author: 'kroeger', created: '2026-09-30T08:52:00+02:00', body: adf.doc(adf.p('Wo finde ich, was sich für den Verkauf genau ändert? Für das Handbuch brauche ich die Schritte im Dialog und die Grenzwerte. Die Unteraufgabe MOB-4813 ist bei mir, Code-Freeze ist am 09.10.')) },
    ],
    links: [
      { type: 'Relates', key: 'MOB-4829', direction: 'outward' },
      { type: 'Blocks', key: 'MOB-4808', direction: 'inward' },
      { type: 'Relates', key: 'MOB-4844', direction: 'outward' },
    ],
  },
  {
    key: 'MOB-4813', type: 'Unteraufgabe', summary: 'Doku: Anwenderhandbuch, Dialogbeschreibung und Parameter anpassen', status: 'Zu erledigen', priority: 'Mittel', parent: 'MOB-4812',
    reporter: 'engel', assignee: 'kroeger', created: '2026-08-12T09:20:00+02:00', updated: '2026-09-30T08:53:00+02:00',
    fixVersions: ['26.4'], components: ['Kaufvertrag'], labels: ['doku'],
    description: adf.doc(adf.p('Handbuch Kaufvertrag, Dialogbeschreibung Register Lieferung, Parametertabelle Auftrag. Fibu-Handbuch prüfen.')),
  },
  {
    key: 'MOB-4814', type: 'Unteraufgabe', summary: 'Test: Teillieferung mit Anzahlung und Montage', status: 'Fertig', priority: 'Mittel', parent: 'MOB-4812',
    reporter: 'engel', assignee: 'wagner', created: '2026-08-12T09:21:00+02:00', updated: '2026-09-29T11:00:00+02:00', resolved: '2026-09-29T11:00:00+02:00',
    fixVersions: ['26.4'], components: ['Kaufvertrag', 'Faktura'], labels: ['test'],
    description: adf.doc(adf.ul(['3 Teile, Montage im 2. Teil', 'Anzahlung 30 %, Restzahlung beim Fahrer', 'Finanzkauf: Aufteilen nicht möglich'])),
  },
  {
    key: 'MOB-4829', type: 'Bug', summary: 'Rundungsdifferenz 0,01 € bei Teillieferung mit 3 Teilen', status: 'Fertig', priority: 'Mittel',
    reporter: 'wagner', assignee: 'hoffmann', created: '2026-09-23T16:40:00+02:00', updated: '2026-09-29T15:50:00+02:00', resolved: '2026-09-29T15:50:00+02:00',
    fixVersions: ['26.4'], components: ['Faktura'], labels: [], sprint: ['s3'],
    description: adf.doc(
      adf.h(3, 'Schritte'),
      adf.ol(['Kaufvertrag 3.000,00 €, Anzahlung 1.000,00 €', 'In 3 gleich große Teile aufteilen', 'Alle Teile ausliefern und abrechnen']),
      adf.h(3, 'Ergebnis'),
      adf.p('Verrechnete Anzahlung 333,33 € × 3 = 999,99 €. 0,01 € bleibt als offener Posten.'),
      adf.h(3, 'Erwartet'),
      adf.p('Anzahlung vollständig verrechnet.'),
    ),
    links: [{ type: 'Relates', key: 'MOB-4812', direction: 'inward' }],
  },
  {
    key: 'MOB-4808', type: 'Aufgabe', summary: 'Klären: Teillieferung bei Finanzkauf mit Partnerbank', status: 'Zu erledigen', priority: 'Mittel', parent: 'MOB-4700',
    reporter: 'engel', assignee: 'engel', created: '2026-09-02T13:00:00+02:00', updated: '2026-09-22T08:48:00+02:00',
    components: ['Kaufvertrag'], labels: ['klaerung'],
    description: adf.doc(adf.p('Zahlt die Bank bei Teillieferung anteilig aus? Termin mit der Partnerbank im Oktober.')),
    links: [{ type: 'Blocks', key: 'MOB-4812', direction: 'outward' }],
  },
  {
    key: 'MOB-4844', type: 'Story', summary: 'Teillieferung im Kundenportal anzeigen', status: 'Zu erledigen', priority: 'Niedrig', parent: 'MOB-4700',
    reporter: 'engel', assignee: null, created: '2026-09-25T10:00:00+02:00', updated: '2026-09-25T10:00:00+02:00',
    fixVersions: ['26.5'], components: ['Kaufvertrag'], labels: [],
    description: adf.doc(adf.p('Kunde sieht im Portal, welcher Teil wann kommt.')),
    links: [{ type: 'Relates', key: 'MOB-4812', direction: 'inward' }],
  },

  /* ---------------- Other 26.4 changes ---------------- */
  {
    key: 'MOB-4777', type: 'Story', summary: 'Gutschein teilweise einlösen', status: 'Fertig', priority: 'Mittel', parent: 'MOB-4701',
    reporter: 'engel', assignee: 'becker', created: '2026-07-30T11:00:00+02:00', updated: '2026-09-03T10:23:00+02:00', resolved: '2026-09-03T10:23:00+02:00',
    fixVersions: ['26.4'], components: ['Kasse', 'Fibu-Export'], labels: ['kundenwunsch'], sprint: ['s1'], points: 5,
    description: adf.doc(
      adf.p('Heute wird ein Gutschein immer ganz eingelöst; der Rest kommt als neuer Gutschein. Kunden verlieren den Überblick, die Filialen drucken ständig neue Gutscheine.'),
      adf.ul(['Teilbetrag einlösen, Restguthaben bleibt auf demselben Gutschein', 'Restguthaben auf dem Bon drucken', 'Fibu: Verbindlichkeit nur in Höhe des eingelösten Betrags auflösen']),
    ),
    comments: [
      { author: 'demir', created: '2026-08-31T15:20:00+02:00', body: adf.doc(adf.p('Mit unserem Steuerberater abgestimmt: Verbindlichkeit nur in Höhe des eingelösten Betrags auflösen, der Rest bleibt stehen. Bitte auch das Fibu-Handbuch anpassen, Kapitel Gutscheine.')) },
    ],
  },
  {
    key: 'MOB-4801', type: 'Story', summary: 'Ladevolumen je Fahrzeug prüfen', status: 'Fertig', priority: 'Mittel', parent: 'MOB-4700',
    reporter: 'engel', assignee: 'schuster', created: '2026-08-05T09:30:00+02:00', updated: '2026-09-10T14:32:00+02:00', resolved: '2026-09-10T14:32:00+02:00',
    fixVersions: ['26.4'], components: ['Tourenplanung', 'Stammdaten'], labels: [], sprint: ['s1', 's2'], points: 5,
    description: adf.doc(
      adf.p('Disponenten planen Touren, die nicht in den LKW passen. Das fällt erst an der Rampe auf.'),
      adf.ul(['Fahrzeugstamm: neues Pflichtfeld Ladevolumen (m³)', 'Tour wird rot markiert, wenn das Volumen überschritten ist', 'Speichern trotz Überladung nur mit Bestätigung (Parameter)']),
    ),
  },
  {
    key: 'MOB-4835', type: 'Aufgabe', summary: '„Liefersperre“ in „Lieferstopp“ umbenennen', status: 'Fertig', priority: 'Niedrig',
    reporter: 'engel', assignee: 'yilmaz', created: '2026-09-19T14:00:00+02:00', updated: '2026-09-25T09:16:00+02:00', resolved: '2026-09-25T09:16:00+02:00',
    fixVersions: ['26.4'], components: ['Kaufvertrag'], labels: ['ui-text'], sprint: ['s3'], points: 1,
    description: adf.doc(adf.p('Support meldet: Kunden verwechseln die Liefersperre mit der Zahlungssperre (z. B. SD-2291). Nur die Beschriftung ändern (de, nl, fr). Der interne Feldname bleibt.')),
  },
  {
    key: 'MOB-4790', type: 'Story', summary: 'Kassenbelege nach Jahr partitionieren', status: 'Fertig', priority: 'Hoch', parent: 'MOB-4703',
    reporter: 'brenner', assignee: 'brenner', created: '2026-06-10T09:00:00+02:00', updated: '2026-09-16T11:06:00+02:00', resolved: '2026-09-16T11:06:00+02:00',
    fixVersions: ['26.4'], components: ['Kasse', 'Plattform'], labels: ['performance', 'datenbank'], sprint: ['s2'], points: 8,
    description: adf.doc(adf.p('Tabelle `kassenbeleg` nach Belegjahr partitionieren. Für Anwender ändert sich nichts.'), adf.p('Migration auf Kopie Möbel Kessler testen (4,1 Mio. Belege).')),
  },
  {
    key: 'MOB-4760', type: 'Story', summary: 'Neue Vorlagen-Engine im Druckmanagement', status: 'Fertig', priority: 'Mittel', parent: 'MOB-4702',
    reporter: 'reuter', assignee: 'schuster', created: '2026-05-20T10:00:00+02:00', updated: '2026-09-18T16:13:00+02:00', resolved: '2026-09-18T16:13:00+02:00',
    fixVersions: ['26.4'], components: ['Druck'], labels: ['tech-debt'], sprint: ['s1', 's2'], points: 8,
    description: adf.doc(
      adf.p('FreeMarker-Vorlagen durch HTML-Vorlagen mit Platzhaltern ersetzen. Standardbelege müssen pixelgleich bleiben.'),
      adf.panel('warning', adf.p('Kundeneigene Vorlagen: Job zum Konvertieren nötig, Betrieb und Fachberatung informieren.')),
    ),
  },
  {
    key: 'MOB-4815', type: 'Aufgabe', summary: 'Testabdeckung Kasse erhöhen', status: 'Fertig', priority: 'Niedrig', parent: 'MOB-4701',
    reporter: 'wagner', assignee: 'becker', created: '2026-09-01T09:00:00+02:00', updated: '2026-09-21T09:41:00+02:00', resolved: '2026-09-21T09:41:00+02:00',
    fixVersions: ['26.4'], components: ['Kasse'], labels: ['test'], sprint: ['s2'], points: 3,
    description: adf.doc(adf.p('Tagesabschluss, Storno, Kartenzahlung. Ziel > 60 % Abdeckung.')),
  },
  {
    key: 'MOB-4841', type: 'Bug', summary: 'Tagesabschluss bricht ab bei Filiale ohne Belege', status: 'Fertig', priority: 'Hoch',
    reporter: 'support', assignee: 'becker', created: '2026-09-25T17:45:00+02:00', updated: '2026-09-26T09:03:00+02:00', resolved: '2026-09-26T09:03:00+02:00',
    fixVersions: ['26.4'], components: ['Kasse'], labels: ['kunde-brandt', 'hotfix'], sprint: ['s3'],
    description: adf.doc(
      adf.p('Küchenstudio Brandt: Tagesabschluss für die Filiale Neuwied (Ruhetag, keine Bons) bricht mit Fehler ab. Danach lässt sich der Abschluss der anderen Filialen nicht starten.'),
      adf.code('java.lang.IndexOutOfBoundsException: Index 0 out of bounds for length 0\n\tat de.musterhaus.mobiq.kasse.Tagesabschluss.erstelle(Tagesabschluss.java:17)', 'java'),
    ),
  },

  /* ---------------- Noise: same project, not part of the 26.4 code changes ---------------- */
  {
    key: 'MOB-4819', type: 'Aufgabe', summary: 'Bon: Logo größer drucken (Wohnwelt Sauer)', status: 'Fertig', priority: 'Niedrig',
    reporter: 'support', assignee: 'thelen', created: '2026-09-12T10:00:00+02:00', updated: '2026-09-15T12:00:00+02:00', resolved: '2026-09-15T12:00:00+02:00',
    fixVersions: ['26.4'], components: ['Druck'], labels: ['kunde-sauer'],
    description: adf.doc(adf.p('Logo auf dem Bon ist zu klein.')),
    comments: [{ author: 'thelen', created: '2026-09-15T11:58:00+02:00', body: adf.doc(adf.p('Über die Kundenvorlage beim Kunden gelöst, keine Änderung im Produkt.')) }],
  },
  {
    key: 'MOB-4826', type: 'Bug', summary: 'Liefertermin-Vorschlag ignoriert Feiertage in Sachsen', status: 'In Review', priority: 'Mittel', parent: 'MOB-4700',
    reporter: 'support', assignee: 'albrecht', created: '2026-09-17T09:12:00+02:00', updated: '2026-09-30T16:20:00+02:00',
    fixVersions: ['26.4'], components: ['Kaufvertrag'], labels: [], sprint: ['s3'],
    description: adf.doc(adf.p('Reformationstag (31.10.) wird in Filialen in Sachsen als Liefertag vorgeschlagen.')),
  },
  {
    key: 'MOB-4822', type: 'Bug', summary: 'Kartenkacheln in der Tourenplanung laden langsam', status: 'In Arbeit', priority: 'Niedrig',
    reporter: 'support', assignee: 'schuster', created: '2026-09-16T08:00:00+02:00', updated: '2026-09-29T10:00:00+02:00',
    fixVersions: ['26.5'], components: ['Tourenplanung'], labels: [],
    description: adf.doc(adf.p('Bei Zoomstufe > 14 dauert das Laden mehrere Sekunden.')),
  },
  {
    key: 'MOB-4850', type: 'Story', summary: 'Zahlung mit Wero an der Kasse', status: 'Zu erledigen', priority: 'Niedrig', parent: 'MOB-4701',
    reporter: 'engel', assignee: null, created: '2026-09-28T14:00:00+02:00', updated: '2026-09-28T14:00:00+02:00',
    components: ['Kasse'], labels: ['idee'],
    description: adf.doc(adf.p('Prüfen, ob Wero über das Kartenterminal angebunden werden kann.')),
  },
]

/* ------------------------------------------------------------------ */

const idOf = (key) => String(10000 + Number(key.split('-')[1]) - 4000)
const ref = (key) => {
  const i = issues.find((x) => x.key === key)
  return {
    id: idOf(key),
    key,
    self: `${SITE}/rest/api/3/issue/${idOf(key)}`,
    fields: {
      summary: i.summary,
      status: status(i.status),
      priority: priority(i.priority),
      issuetype: issuetype(i.type),
    },
  }
}
const status = (name) => ({
  self: `${SITE}/rest/api/3/status/${statuses[name].id}`,
  description: '',
  iconUrl: `${SITE}/`,
  name,
  id: statuses[name].id,
  statusCategory: { self: `${SITE}/rest/api/3/statuscategory/${statuses[name].category.id}`, ...statuses[name].category },
})
const priority = (name) => ({ self: `${SITE}/rest/api/3/priority/${priorities[name]}`, iconUrl: `${SITE}/images/icons/priorities/${name === 'Hoch' ? 'high' : name === 'Mittel' ? 'medium' : 'low'}.svg`, name, id: priorities[name] })
const issuetype = (name) => ({ self: `${SITE}/rest/api/3/issuetype/${types[name].id}`, id: types[name].id, description: '', iconUrl: `${SITE}/rest/api/2/universal_avatar/view/type/issuetype/avatar/10315?size=medium`, name, subtask: types[name].subtask, avatarId: 10315, hierarchyLevel: types[name].hierarchyLevel })
const jiraTime = (iso) => {
  // Jira returns "2026-09-29T15:50:00.000+0200"
  const d = iso.replace(/:00\+(\d\d):(\d\d)$/, ':00.000+$1$2')
  return d
}
const linkTypes = {
  Relates: { id: '10003', name: 'Relates', inward: 'relates to', outward: 'relates to' },
  Blocks: { id: '10000', name: 'Blocks', inward: 'is blocked by', outward: 'blocks' },
}

export function issueJson(i) {
  const fields = {
    summary: i.summary,
    issuetype: issuetype(i.type),
    status: status(i.status),
    statuscategorychangedate: jiraTime(i.resolved ?? i.updated),
    priority: priority(i.priority),
    project: { self: `${SITE}/rest/api/3/project/${project.id}`, id: project.id, key: project.key, name: project.name, projectTypeKey: 'software', simplified: false },
    reporter: jiraUser(i.reporter),
    creator: jiraUser(i.reporter),
    assignee: i.assignee ? jiraUser(i.assignee) : null,
    created: jiraTime(i.created),
    updated: jiraTime(i.updated),
    resolution: i.resolved ? { self: `${SITE}/rest/api/3/resolution/10000`, id: '10000', description: 'Die Arbeit an diesem Vorgang ist abgeschlossen.', name: 'Fertig' } : null,
    resolutiondate: i.resolved ? jiraTime(i.resolved) : null,
    labels: i.labels ?? [],
    components: (i.components ?? []).map((c) => ({ self: `${SITE}/rest/api/3/component/${components[c]}`, id: components[c], name: c })),
    fixVersions: (i.fixVersions ?? []).map((v) => {
      const x = versions.find((y) => y.name === v)
      return { self: `${SITE}/rest/api/3/version/${x.id}`, id: x.id, description: x.description, name: x.name, archived: x.archived, released: x.released, releaseDate: x.releaseDate }
    }),
    versions: [],
    description: i.description ?? null,
    environment: null,
    duedate: null,
    issuelinks: (i.links ?? []).map((l, n) => ({
      id: String(40210 + Number(idOf(i.key)) * 3 + n),
      self: `${SITE}/rest/api/3/issueLink/${40210 + Number(idOf(i.key)) * 3 + n}`,
      type: { ...linkTypes[l.type], self: `${SITE}/rest/api/3/issueLinkType/${linkTypes[l.type].id}` },
      [l.direction === 'outward' ? 'outwardIssue' : 'inwardIssue']: ref(l.key),
    })),
    subtasks: issues.filter((s) => s.parent === i.key && s.type === 'Unteraufgabe').map((s) => ref(s.key)),
    comment: {
      comments: (i.comments ?? []).map((c, n) => ({
        self: `${SITE}/rest/api/3/issue/${idOf(i.key)}/comment/${51000 + Number(idOf(i.key)) * 10 + n}`,
        id: String(51000 + Number(idOf(i.key)) * 10 + n),
        author: jiraUser(c.author),
        body: c.body,
        updateAuthor: jiraUser(c.author),
        created: jiraTime(c.created),
        updated: jiraTime(c.created),
        jsdPublic: true,
      })),
      self: `${SITE}/rest/api/3/issue/${idOf(i.key)}/comment`,
      maxResults: (i.comments ?? []).length,
      total: (i.comments ?? []).length,
      startAt: 0,
    },
    // Sprint and story points live in custom fields on company-managed projects.
    customfield_10020: (i.sprint ?? []).map((s) => sprints[s]),
    customfield_10016: i.points ?? null,
  }
  if (i.parent) fields.parent = ref(i.parent)
  return {
    expand: 'renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations',
    id: idOf(i.key),
    self: `${SITE}/rest/api/3/issue/${idOf(i.key)}`,
    key: i.key,
    fields,
  }
}

export function searchResponse() {
  return {
    issues: issues.slice().sort((a, b) => Number(b.key.split('-')[1]) - Number(a.key.split('-')[1])).map(issueJson),
    isLast: true,
  }
}

export const jql = 'project = MOB AND (fixVersion in ("26.4", "26.5") OR updated >= "2026-08-01") ORDER BY key DESC'
export const issueKeys = issues.map((i) => i.key)
