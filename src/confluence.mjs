// Confluence Cloud, REST v2 (GET /wiki/api/v2/spaces, /pages?body-format=storage, /pages/{id}/labels,
// /pages/{id}/attachments). Content is the state as of release 26.3 — before anyone touched the docs for 26.4.
import { join, st } from './formats.mjs'
import { accountId } from './people.mjs'

export const WIKI = 'https://musterhaus-software.atlassian.net/wiki'

export const spaces = [
  { id: '65538', key: 'MOBIQHB', name: 'MOBIQ Anwenderhandbuch', description: 'Handbuch für Verkauf, Disposition, Kasse und Buchhaltung. Wird als PDF mit jeder Version ausgeliefert.', owner: 'kroeger' },
  { id: '65539', key: 'MOBIQFB', name: 'MOBIQ Fachberatung', description: 'Dialogbeschreibungen und Parametertabellen für Fachberatung, Support und Schulung.', owner: 'thelen' },
  { id: '65540', key: 'MOBIQDEV', name: 'MOBIQ Entwicklung', description: 'Architektur, Schnittstellen, Datenmodell. Für Entwicklung, Support und Partner.', owner: 'reuter' },
  { id: '65541', key: 'MOBIQOPS', name: 'MOBIQ Betrieb', description: 'Installation, Update und Betrieb beim Kunden und in der Cloud.', owner: 'brenner' },
]

const S = Object.fromEntries(spaces.map((s) => [s.key, s.id]))

/**
 * Pages. `slug` is our handle (ground truth refers to it); `id` is the Confluence page id.
 * `v` = [version number, last edit date, author, version message].
 */
export const pages = [
  /* ================= Anwenderhandbuch ================= */
  {
    slug: 'hb-home', id: '393281537', space: 'MOBIQHB', parent: null, title: 'MOBIQ Anwenderhandbuch', labels: ['anwenderhandbuch'],
    v: [12, '2026-07-17T15:20:00.000Z', 'kroeger', 'Stand 26.3'],
    body: join(st.info(st.p('Dieses Handbuch beschreibt MOBIQ in der Version 26.3.'), 'Version'), st.p('Wählen Sie ein Kapitel:'), st.children()),
  },
  {
    slug: 'hb-kaufvertrag', id: '393281611', space: 'MOBIQHB', parent: 'hb-home', title: 'Kaufvertrag', labels: ['anwenderhandbuch', 'kaufvertrag'],
    v: [4, '2025-11-03T10:02:00.000Z', 'kroeger', ''],
    body: join(st.p('Vom Angebot bis zur Auslieferung: alles rund um den Kaufvertrag.'), st.children()),
  },
  {
    slug: 'hb-kv-erfassen', id: '393281644', space: 'MOBIQHB', parent: 'hb-kaufvertrag', title: '2 Kaufvertrag erfassen', labels: ['anwenderhandbuch', 'kaufvertrag'],
    v: [9, '2026-04-22T08:41:00.000Z', 'kroeger', 'Finanzkauf ergänzt'],
    attachments: ['kv-erfassen.png'],
    body: join(
      st.h(2, '2.1 Kunde und Positionen'),
      st.p('Legen Sie den Kunden an oder wählen Sie ihn über die Kundensuche. Positionen erfassen Sie über die Artikelsuche oder per Scan des Preisschilds.'),
      st.image('kv-erfassen.png'),
      st.h(2, '2.2 Anzahlung'),
      st.p('Die Mindestanzahlung legt Ihr Administrator fest (Standard 20 %). Die Anzahlung kassieren Sie direkt an der Kasse; sie wird auf dem Kaufvertrag vermerkt.'),
      st.h(2, '2.3 Finanzkauf'),
      st.p('Bei einem Finanzkauf setzen Sie den Haken **Finanzkauf**. MOBIQ übergibt den Antrag an die Partnerbank. Die Bank zahlt den Kaufpreis nach der Auslieferung direkt an das Möbelhaus.'),
    ),
  },
  {
    slug: 'hb-lieferung', id: '393281702', space: 'MOBIQHB', parent: 'hb-kaufvertrag', title: '3 Lieferung und Montage', labels: ['anwenderhandbuch', 'kaufvertrag', 'lieferung'],
    v: [14, '2026-07-14T13:25:00.000Z', 'kroeger', 'Montage-App ergänzt'],
    attachments: ['register-lieferung.png'],
    body: join(
      st.p('Im Register **Lieferung** legen Sie fest, wann und wie die Ware zum Kunden kommt. Die Disposition sieht den Kaufvertrag erst, wenn er auf „Lieferbereit“ steht und keine Liefersperre gesetzt ist.'),
      st.image('register-lieferung.png'),
      st.h(2, '3.1 Liefertermin vereinbaren'),
      st.p('Wählen Sie im Feld „Wunschtermin“ eine Kalenderwoche. MOBIQ prüft, ob alle Positionen bis dahin im Lager sein können, und zeigt den frühesten möglichen Termin an.'),
      st.h(2, '3.2 Lieferbereitschaft'),
      st.p('Ein Kaufvertrag wird immer vollständig ausgeliefert. Er steht erst auf „Lieferbereit“, wenn alle Positionen im Lager eingegangen sind.'),
      st.note(st.p('Soll ein lieferbereiter Kaufvertrag noch nicht disponiert werden, setzen Sie die **Liefersperre**. Sie heben sie im selben Register wieder auf.')),
      st.h(2, '3.3 Montage beauftragen'),
      st.p('Positionen mit Montageleistung werden automatisch an die Montageplanung übergeben. Die Monteure sehen den Auftrag in der Montage-App.'),
    ),
  },
  {
    slug: 'hb-anzahlung', id: '393281733', space: 'MOBIQHB', parent: 'hb-kaufvertrag', title: '4 Anzahlung und Restzahlung', labels: ['anwenderhandbuch', 'kaufvertrag', 'zahlung'],
    v: [6, '2025-09-30T09:10:00.000Z', 'kroeger', ''],
    body: join(
      st.p('Die Anzahlung wird bei Vertragsabschluss kassiert. Die Restzahlung ist bei Lieferung fällig, entweder vorab an der Kasse oder beim Fahrer.'),
      st.p('Mit der Schlussrechnung wird die Anzahlung verrechnet. Die Schlussrechnung entsteht automatisch, sobald der Kaufvertrag ausgeliefert ist.'),
    ),
  },
  {
    slug: 'hb-tour', id: '393282017', space: 'MOBIQHB', parent: 'hb-home', title: 'Tourenplanung', labels: ['anwenderhandbuch', 'tourenplanung'],
    v: [3, '2025-03-11T12:00:00.000Z', 'kroeger', ''],
    body: st.children(),
  },
  {
    slug: 'hb-touren-planen', id: '393282049', space: 'MOBIQHB', parent: 'hb-tour', title: '2 Touren planen', labels: ['anwenderhandbuch', 'tourenplanung'],
    v: [8, '2026-04-30T07:55:00.000Z', 'kroeger', 'Ladevolumen-Anzeige'],
    attachments: ['tourenplanung-karte.png'],
    body: join(
      st.p('Alle lieferbereiten Kaufverträge erscheinen in der Liste „Offene Lieferungen“. Ziehen Sie einen Auftrag auf eine Tour in der Karte, um ihn einzuplanen.'),
      st.image('tourenplanung-karte.png'),
      st.p('Ein Kaufvertrag ist immer genau ein Stopp auf einer Tour. Kaufverträge mit gesetzter Liefersperre erscheinen nicht in „Offene Lieferungen“.'),
      st.h(2, '2.3 Montage einplanen'),
      st.p('Enthält ein Stopp eine Montageposition, plant MOBIQ automatisch einen Monteur und die Montagezeit mit ein. Den Puffer je Montage legt Ihr Administrator fest.'),
      st.h(2, '2.4 Ladevolumen'),
      st.p('MOBIQ summiert das Volumen aller Stopps einer Tour und zeigt es in der Kopfzeile der Tour an.'),
    ),
  },
  {
    slug: 'hb-lieferschein', id: '393282080', space: 'MOBIQHB', parent: 'hb-tour', title: '3 Lieferschein und Auslieferung', labels: ['anwenderhandbuch', 'tourenplanung'],
    v: [5, '2025-06-02T10:30:00.000Z', 'kroeger', ''],
    body: join(
      st.p('Der Fahrer erhält die Lieferscheine in der Fahrer-App und kassiert offene Restzahlungen bar oder per Karte.'),
      st.p('Der Kunde bekommt die Avisierung 48 Stunden vor der Lieferung per SMS oder E-Mail.'),
    ),
  },
  {
    slug: 'hb-kasse', id: '393282305', space: 'MOBIQHB', parent: 'hb-home', title: 'Kasse', labels: ['anwenderhandbuch', 'kasse'],
    v: [2, '2024-10-01T09:00:00.000Z', 'kroeger', ''],
    body: st.children(),
  },
  {
    slug: 'hb-gutscheine', id: '393282337', space: 'MOBIQHB', parent: 'hb-kasse', title: '6 Gutscheine', labels: ['anwenderhandbuch', 'kasse', 'gutschein'],
    v: [4, '2026-02-11T14:12:00.000Z', 'kroeger', ''],
    attachments: ['kasse-gutschein.png'],
    body: join(
      st.p('Ein Gutschein kann nur vollständig eingelöst werden. Ist der Einkauf günstiger als der Gutschein, verfällt der Rest nicht, sondern wird als neuer Gutschein ausgegeben.'),
      st.p('Scannen Sie den Gutschein-Code oder geben Sie die Nummer im Feld „Gutschein“ ein.'),
      st.image('kasse-gutschein.png', 480),
    ),
  },
  {
    slug: 'hb-restzahlung', id: '393282371', space: 'MOBIQHB', parent: 'hb-kasse', title: '7 Restzahlung bei Lieferung', labels: ['anwenderhandbuch', 'kasse'],
    v: [3, '2025-08-19T11:00:00.000Z', 'kroeger', ''],
    body: st.p('Restzahlungen, die der Fahrer kassiert, erscheinen am nächsten Morgen im Kassenbuch der Filiale.'),
  },
  {
    slug: 'hb-faq-kasse', id: '393282402', space: 'MOBIQHB', parent: 'hb-kasse', title: 'FAQ Kasse', labels: ['anwenderhandbuch', 'kasse', 'faq'],
    v: [11, '2026-05-06T16:30:00.000Z', 'thelen', 'Fragen aus dem Support'],
    body: join(
      st.h(3, 'Kann ich einen Gutschein teilweise einlösen?'),
      st.p('Nein. Ein Gutschein wird immer vollständig eingelöst. Ist der Bon günstiger, erhält der Kunde einen neuen Gutschein über den Rest.'),
      st.h(3, 'Wann ist der Tagesabschluss fertig?'),
      st.p('Der Tagesabschluss dauert je nach Filiale einige Sekunden. Während des Abschlusses ist die Kasse gesperrt.'),
      st.h(3, 'Wie storniere ich einen Bon vom Vortag?'),
      st.p('Bons vom Vortag stornieren Sie über eine Gutschrift, nicht über die Storno-Taste.'),
    ),
  },
  {
    slug: 'hb-fibu', id: '393282611', space: 'MOBIQHB', parent: 'hb-home', title: '5 Finanzbuchhaltung: Übergabe aus dem ERP', labels: ['anwenderhandbuch', 'fibu'],
    v: [7, '2026-07-02T09:45:00.000Z', 'demir', ''],
    body: join(
      st.p('MOBIQ übergibt Rechnungen, Gutschriften und Anzahlungen jede Nacht an die Finanzbuchhaltung. Sie finden sie im Stapel „ERP-Import“.'),
      st.h(2, '5.2 Anzahlungen'),
      st.p('Erhaltene Anzahlungen werden auf das Anzahlungskonto gebucht (Parameter `FIBU_KONTO_ANZAHLUNG`).'),
      st.p('Die Schlussrechnung wird nach vollständiger Auslieferung erstellt. Mit ihr wird die gesamte Anzahlung verrechnet.'),
      st.h(2, '5.3 Erlöse'),
      st.p('Der Erlös wird mit dem Rechnungsdatum gebucht. Offene Posten werden über die Kaufvertragsnummer zugeordnet.'),
      st.table(['Belegart', 'Bedeutung'], [['RE', 'Rechnung'], ['GS', 'Gutschrift'], ['AZ', 'Anzahlung']]),
      st.h(2, '5.4 Gutscheine'),
      st.p('Verkaufte Gutscheine werden als Verbindlichkeit gebucht. Bei Einlösung wird die Verbindlichkeit vollständig aufgelöst.'),
    ),
  },
  {
    slug: 'hb-glossar', id: '393282707', space: 'MOBIQHB', parent: 'hb-home', title: 'Glossar', labels: ['anwenderhandbuch', 'glossar'],
    v: [19, '2026-06-09T12:10:00.000Z', 'kroeger', ''],
    body: st.table(
      ['Begriff', 'Bedeutung'],
      [
        ['Anzahlung', 'Teil des Kaufpreises, der bei Vertragsabschluss kassiert wird'],
        ['Finanzkauf', 'Kauf auf Raten über die Partnerbank'],
        ['Kommission', 'Interne Nummer des Kaufvertrags im Lager'],
        ['Liefersperre', 'Kennzeichen am Kaufvertrag: wird nicht disponiert, auch wenn er lieferbereit ist'],
        ['Stopp', 'Ein Halt auf einer Tour, entspricht einem Kaufvertrag'],
        ['Tour', 'Fahrt eines Fahrzeugs mit mehreren Stopps an einem Tag'],
      ],
    ),
  },
  {
    slug: 'hb-rn-263', id: '393282790', space: 'MOBIQHB', parent: 'hb-home', title: 'Neuerungen in 26.3', labels: ['anwenderhandbuch', 'release-notes'],
    v: [3, '2026-07-21T07:00:00.000Z', 'kroeger', ''],
    body: join(
      st.p('Die wichtigsten Änderungen für Anwender in Version 26.3:'),
      st.ul(['Finanzkauf direkt im Kaufvertrag beantragen', 'Montage-App zeigt Aufbauanleitungen', 'Kasse: Kartenzahlung mit neuem Terminaltyp']),
    ),
  },

  /* ================= Fachberatung ================= */
  {
    slug: 'fb-home', id: '426115073', space: 'MOBIQFB', parent: null, title: 'MOBIQ Fachberatung', labels: [],
    v: [5, '2026-01-12T10:00:00.000Z', 'thelen', ''],
    body: join(st.p('Dialogbeschreibungen und Parametertabellen für Fachberatung, Support und Schulung.'), st.children()),
  },
  {
    slug: 'fb-dialoge', id: '426115109', space: 'MOBIQFB', parent: 'fb-home', title: 'Dialogbeschreibungen', labels: ['dialogbeschreibung'],
    v: [2, '2025-02-01T10:00:00.000Z', 'thelen', ''],
    body: join(st.p('Jeder Dialog mit allen Feldern, Pflichtangaben und Abhängigkeiten.'), st.children()),
  },
  {
    slug: 'fb-dlg-lieferung', id: '426115141', space: 'MOBIQFB', parent: 'fb-dialoge', title: 'Kaufvertrag – Register Lieferung', labels: ['dialogbeschreibung', 'kaufvertrag'],
    v: [7, '2026-06-23T14:00:00.000Z', 'thelen', ''],
    attachments: ['register-lieferung.png'],
    body: join(
      st.p('Aufruf über Kaufvertrag › Lieferung. Pflichtfelder sind fett markiert.'),
      st.image('register-lieferung.png'),
      st.table(
        ['Feld', 'Typ', 'Pflicht', 'Beschreibung'],
        [
          ['Wunschtermin', 'KW-Auswahl', 'ja', 'Gewünschte Lieferwoche des Kunden'],
          ['Lieferadresse', 'Adresse', 'ja', 'Vorbelegt mit der Kundenadresse'],
          ['Etage / Aufzug', 'Auswahl', 'nein', 'Für die Tourenplanung'],
          ['Liefersperre', 'Checkbox', 'nein', 'Kaufvertrag wird nicht disponiert'],
          ['Montage', 'Checkbox', 'nein', 'Aus Positionen mit Montageleistung vorbelegt'],
        ],
      ),
      st.p('Änderungen im Register „Lieferung“ werden sofort an die Disposition übertragen.'),
    ),
  },
  {
    slug: 'fb-dlg-zahlung', id: '426115176', space: 'MOBIQFB', parent: 'fb-dialoge', title: 'Kasse – Zahlung', labels: ['dialogbeschreibung', 'kasse'],
    v: [3, '2025-10-07T09:00:00.000Z', 'thelen', ''],
    body: join(
      st.p('Erscheint nach „Bezahlen“ an der Kasse.'),
      st.table(
        ['Feld', 'Typ', 'Pflicht', 'Beschreibung'],
        [
          ['Zahlart', 'Auswahl', 'ja', 'Bar, Karte, Gutschein, Finanzkauf'],
          ['Gutschein', 'Scan / Nummer', 'nein', 'Nur bei Zahlart Gutschein'],
          ['Offener Betrag', 'Anzeige', '–', 'Restbetrag des Bons nach dieser Zahlung'],
        ],
      ),
    ),
  },
  {
    slug: 'fb-parameter', id: '426115202', space: 'MOBIQFB', parent: 'fb-home', title: 'Parametertabellen', labels: ['parametertabelle'],
    v: [2, '2025-02-01T10:00:00.000Z', 'thelen', ''],
    body: join(st.info(st.p('Parameter werden je Mandant unter Administration › Parameter gepflegt. Änderungen wirken ab der nächsten Anmeldung.')), st.children()),
  },
  {
    slug: 'fb-par-auftrag', id: '426115233', space: 'MOBIQFB', parent: 'fb-parameter', title: 'Parameter Auftrag und Lieferung', labels: ['parametertabelle', 'kaufvertrag'],
    v: [9, '2026-07-08T11:30:00.000Z', 'thelen', ''],
    body: st.table(
      ['Parameter', 'Bedeutung', 'Standard', 'Min', 'Max', 'Einheit'],
      [
        ['LIEF_VORLAUF_TAGE', 'Vorlauf zwischen Wareneingang und frühestem Liefertermin', '3', '0', '14', 'Tage'],
        ['LIEF_AVIS_STUNDEN', 'Avisierung an den Kunden vor der Lieferung', '48', '12', '96', 'Stunden'],
        ['ANZ_MIN_PROZ', 'Mindestanzahlung bei Vertragsabschluss', '20', '0', '100', '%'],
        ['MONT_ZEIT_PUFFER', 'Zeitpuffer je Montage', '30', '0', '120', 'Minuten'],
      ],
    ),
  },
  {
    slug: 'fb-par-tour', id: '426115264', space: 'MOBIQFB', parent: 'fb-parameter', title: 'Parameter Tourenplanung', labels: ['parametertabelle', 'tourenplanung'],
    v: [4, '2025-11-20T08:00:00.000Z', 'thelen', ''],
    body: st.table(
      ['Parameter', 'Bedeutung', 'Standard', 'Min', 'Max', 'Einheit'],
      [
        ['TOUR_MAX_STOPPS', 'Höchstzahl Stopps je Tour', '12', '1', '30', 'Stopps'],
        ['TOUR_START_ZEIT', 'Frühester Tourstart', '07:00', '05:00', '10:00', 'Uhrzeit'],
      ],
    ),
  },
  {
    slug: 'fb-par-fibu', id: '426115295', space: 'MOBIQFB', parent: 'fb-parameter', title: 'Parameter Finanzbuchhaltung', labels: ['parametertabelle', 'fibu'],
    v: [3, '2026-03-02T08:00:00.000Z', 'demir', ''],
    body: st.table(
      ['Parameter', 'Bedeutung', 'Standard', 'Min', 'Max', 'Einheit'],
      [
        ['FIBU_KONTO_ANZAHLUNG', 'Konto für erhaltene Anzahlungen', '1718', '–', '–', 'Konto (SKR03)'],
        ['FIBU_EXPORT_ZEIT', 'Uhrzeit der nächtlichen Übergabe', '02:00', '00:00', '05:00', 'Uhrzeit'],
      ],
    ),
  },

  /* ================= Entwicklung ================= */
  {
    slug: 'dev-home', id: '458752001', space: 'MOBIQDEV', parent: null, title: 'MOBIQ Entwicklung', labels: [],
    v: [8, '2026-02-02T10:00:00.000Z', 'reuter', ''],
    body: join(st.toc(), st.children()),
  },
  {
    slug: 'dev-architektur', id: '458752033', space: 'MOBIQDEV', parent: 'dev-home', title: 'Architektur Gesamtsystem', labels: ['architektur'],
    v: [6, '2026-01-20T16:00:00.000Z', 'reuter', 'Fahrer-App ergänzt'],
    attachments: ['mobiq-gesamtsystem.drawio', 'mobiq-gesamtsystem.drawio.png'],
    body: join(
      st.drawio('mobiq-gesamtsystem'),
      st.p('Clients (Desktop, Web, Fahrer-App) sprechen ausschließlich mit dem Anwendungsserver. Hintergrunddienste: tour, druck, fibu-export.'),
      st.p('Rechnungen gelangen ausschließlich über den Dienst fibu-export in die Finanzbuchhaltung.'),
      st.expand('Entscheidungen', st.ul(['ADR-014: Keine direkte DB-Verbindung aus Clients', 'ADR-021: Fibu nur über fibu_export, nie direkt'])),
    ),
  },
  {
    slug: 'dev-fibu-schnittstelle', id: '458752069', space: 'MOBIQDEV', parent: 'dev-home', title: 'Schnittstelle ERP → Finanzbuchhaltung', labels: ['technische-doku', 'schnittstelle', 'fibu'],
    v: [11, '2026-06-30T13:00:00.000Z', 'hoffmann', ''],
    body: join(
      st.h(2, '2 Exportformat der Buchungssätze'),
      st.p('Der Export schreibt je Beleg einen Satz in die Tabelle `fibu_export`. Die Finanzbuchhaltung liest sie nachts über den Dienst fibu-import.'),
      st.table(
        ['Feld', 'Typ', 'Beschreibung'],
        [
          ['belegart', 'char(2)', 'RE = Rechnung, GS = Gutschrift, AZ = Anzahlung'],
          ['belegnr', 'varchar(20)', 'Fortlaufend je Mandant'],
          ['kv_nr', 'varchar(12)', 'Kaufvertragsnummer, für die Zuordnung offener Posten'],
          ['betrag_brutto', 'numeric(12,2)', 'Bruttobetrag des Belegs'],
          ['steuerschluessel', 'smallint', 'Steuerschlüssel der Finanzbuchhaltung'],
        ],
      ),
      st.h(2, '3 Verrechnung von Anzahlungen'),
      st.p('Mit der Schlussrechnung wird die Anzahlung vollständig verrechnet (Feld `az_betrag` des Kaufvertrags).'),
    ),
  },
  {
    slug: 'dev-datenmodell', id: '458752101', space: 'MOBIQDEV', parent: 'dev-home', title: 'Datenmodell Auftragsabwicklung', labels: ['technische-doku', 'datenmodell'],
    v: [15, '2026-07-10T09:00:00.000Z', 'albrecht', ''],
    body: join(
      st.table(
        ['Tabelle', 'Inhalt', 'Schlüssel'],
        [
          ['kaufvertrag', 'Kopf des Kaufvertrags', 'kv_id'],
          ['kv_position', 'Positionen des Kaufvertrags', 'kvp_id, FK kv_id'],
          ['tour_stopp', 'Stopp einer Tour', 'stopp_id, FK kv_id'],
        ],
      ),
    ),
  },
  {
    slug: 'dev-migrationen', id: '458752133', space: 'MOBIQDEV', parent: 'dev-home', title: 'Migrationen 26.x', labels: ['technische-doku', 'datenmodell', 'migration'],
    v: [6, '2026-07-10T09:05:00.000Z', 'albrecht', ''],
    body: join(
      st.p('Migrationen liegen unter `db/migration` und laufen beim Update automatisch in Versionsreihenfolge (Flyway).'),
      st.table(
        ['Version', 'Inhalt', 'Laufzeit bei 1 Mio. Positionen'],
        [
          ['V26_3_004', 'Index auf kv_position.artikel_nr', 'ca. 2 min'],
          ['V26_3_009', 'Spalte kaufvertrag.finanzkauf', 'unter 1 min'],
        ],
      ),
    ),
  },
  {
    slug: 'dev-kasse', id: '458752165', space: 'MOBIQDEV', parent: 'dev-home', title: 'Kasse: Belegdaten und Tagesabschluss', labels: ['technische-doku', 'kasse'],
    v: [4, '2026-05-05T15:00:00.000Z', 'brenner', ''],
    body: join(
      st.h(2, '3 Tabelle kassenbeleg'),
      st.p('Jeder Bon ist ein Satz in `kassenbeleg` mit seinen Zahlungen in `kassenzahlung`. Der Tagesabschluss liest alle Belege des Tages je Filiale.'),
      st.h(2, '4 Aufbewahrung'),
      st.p('Kassenbelege werden nicht gelöscht. Ältere Jahrgänge können über die Archivfunktion ausgelagert werden.'),
    ),
  },
  {
    slug: 'dev-druck', id: '458752197', space: 'MOBIQDEV', parent: 'dev-home', title: 'Druckmanagement', labels: ['technische-doku', 'druck'],
    v: [3, '2024-11-14T10:00:00.000Z', 'schuster', ''],
    body: join(
      st.p('Belege werden über FreeMarker-Vorlagen (`.ftl`) in `druck/vorlagen` erzeugt. Einstieg ist die Klasse `LegacyDruck`.'),
      st.p('Kundeneigene Vorlagen liegen beim Kunden unter `vorlagen/kunde` und überschreiben die Standardvorlage mit gleichem Namen.'),
    ),
  },

  /* ================= Betrieb ================= */
  {
    slug: 'ops-home', id: '491520001', space: 'MOBIQOPS', parent: null, title: 'MOBIQ Betrieb', labels: [],
    v: [3, '2025-12-01T10:00:00.000Z', 'brenner', ''],
    body: st.children(),
  },
  {
    slug: 'ops-update', id: '491520033', space: 'MOBIQOPS', parent: 'ops-home', title: 'Installations- und Updatehandbuch', labels: ['installation'],
    v: [10, '2026-07-15T08:00:00.000Z', 'brenner', 'Stand 26.3'],
    body: join(
      st.h(2, '4 Update auf eine neue Version'),
      st.ol([
        'Sichern Sie die Datenbank.',
        'Stoppen Sie die Dienste mobiq-app und mobiq-druck.',
        'Führen Sie das Update-Paket aus. Migrationen laufen automatisch.',
        'Starten Sie die Dienste und prüfen Sie das Protokoll.',
      ]),
      st.h(2, '4.2 Nach dem Update'),
      st.p('Prüfen Sie unter Administration › Systemstatus, ob alle Dienste laufen. In der Cloud übernimmt das der Betrieb.'),
      st.h(2, '5 Systemanforderungen'),
      st.p('Datenbank: PostgreSQL 15 oder neuer. Anwendungsserver: 4 Kerne und 16 GB Arbeitsspeicher je 50 gleichzeitige Anwender.'),
    ),
  },
  {
    slug: 'ops-vorlagen', id: '491520065', space: 'MOBIQOPS', parent: 'ops-home', title: 'Kundeneigene Druckvorlagen', labels: ['installation', 'druck'],
    v: [2, '2025-04-08T10:00:00.000Z', 'thelen', ''],
    body: join(
      st.p('Kundeneigene Vorlagen sind FreeMarker-Dateien (`.ftl`) im Ordner `vorlagen/kunde` auf dem Anwendungsserver.'),
      st.p('Kopieren Sie die Standardvorlage, passen Sie sie an und speichern Sie sie unter demselben Namen. Ein Neustart von mobiq-druck ist nicht nötig.'),
    ),
  },
]

/* ------------------------------------------------------------------ */

const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]))
export const pageId = (slug) => bySlug[slug].id

export function pageJson(p) {
  const siblings = pages.filter((x) => x.parent === p.parent && x.space === p.space)
  return {
    parentType: p.parent ? 'page' : null,
    parentId: p.parent ? bySlug[p.parent].id : null,
    spaceId: S[p.space],
    ownerId: accountId(p.v[2]),
    lastOwnerId: null,
    createdAt: '2024-09-16T08:00:00.000Z',
    authorId: accountId(spaces.find((s) => s.key === p.space).owner),
    position: 1000 + siblings.indexOf(p) * 1000,
    version: { number: p.v[0], message: p.v[3], minorEdit: false, authorId: accountId(p.v[2]), createdAt: p.v[1] },
    body: { storage: { representation: 'storage', value: p.body } },
    status: 'current',
    title: p.title,
    id: p.id,
    _links: {
      editui: `/pages/resumedraft.action?draftId=${p.id}`,
      webui: `/spaces/${p.space}/pages/${p.id}/${encodeURIComponent(p.title).replace(/%20/g, '+')}`,
      tinyui: `/x/${Buffer.from(p.id).toString('base64url').slice(0, 6)}`,
    },
  }
}

export function spacesJson() {
  return {
    results: spaces.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      type: 'global',
      status: 'current',
      authorId: accountId(s.owner),
      createdAt: '2024-09-16T08:00:00.000Z',
      homepageId: pages.find((p) => p.space === s.key && !p.parent).id,
      description: { plain: { value: s.description, representation: 'plain' } },
      icon: null,
      _links: { webui: `/spaces/${s.key}` },
    })),
    _links: { base: WIKI },
  }
}

export function pagesJson() {
  return { results: pages.map(pageJson), _links: { base: WIKI } }
}

export function labelsJson(p) {
  return { results: p.labels.map((name, i) => ({ id: String(2441216 + i + Number(p.id.slice(-3))), name, prefix: 'global' })), _links: {} }
}

export function attachmentsJson(p) {
  return {
    results: (p.attachments ?? []).map((f, i) => ({
      id: `att${Number(p.id) + 17 + i}`,
      status: 'current',
      title: f,
      createdAt: p.v[1],
      pageId: p.id,
      mediaType: f.endsWith('.png') ? 'image/png' : 'application/vnd.jgraph.mxfile',
      mediaTypeDescription: f.endsWith('.png') ? 'PNG Image' : 'draw.io Diagram',
      comment: '',
      fileId: `0b1f${(Number(p.id) * 31 + i).toString(16)}`,
      fileSize: f.endsWith('.png') ? 84213 + i * 1031 : 23104,
      webuiLink: `/pages/viewpageattachments.action?pageId=${p.id}&preview=/${p.id}/${f}`,
      downloadLink: `/download/attachments/${p.id}/${encodeURIComponent(f)}?version=1&api=v2`,
      version: { number: 1, message: '', minorEdit: false, authorId: accountId(p.v[2]), createdAt: p.v[1] },
      _links: { download: `/download/attachments/${p.id}/${encodeURIComponent(f)}?version=1&api=v2`, webui: `/pages/viewpageattachments.action?pageId=${p.id}` },
    })),
    _links: { base: WIKI },
  }
}
