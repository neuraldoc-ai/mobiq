// The document library outside Confluence: Word, Excel and PDF files in SharePoint
// ("MOBIQ Produktdokumentation"), as many companies still keep them. State before release 26.4.
// Listed via Microsoft Graph: GET /sites/{site}/drives/{drive}/root/children (driveItem JSON).

export const SHAREPOINT = 'https://musterhaus.sharepoint.com/sites/Produktdokumentation'
export const LIBRARY = 'Freigegebene Dokumente/MOBIQ'

const P = 'Parameter'
const head = [P, 'Bereich', 'Bedeutung', 'Standard', 'Min', 'Max', 'Einheit', 'Seit Version', 'Je Mandant']

export const files = [
  {
    slug: 'parameterliste',
    name: 'MOBIQ_Parameterliste_26.3.xlsx',
    folder: 'Fachberatung',
    kind: 'xlsx',
    docType: 'parametertabelle',
    author: 'thelen',
    modifiedBy: 'thelen',
    created: '2021-03-15T08:00:00Z',
    modified: '2026-07-09T14:20:00Z',
    title: 'MOBIQ Parameterliste 26.3',
    sheets: [
      {
        name: 'Auftrag',
        widths: [30, 12, 52, 10, 8, 8, 10, 12, 11],
        rows: [
          head,
          ['LIEF_VORLAUF_TAGE', 'Lieferung', 'Vorlauf zwischen Wareneingang und frühestem Liefertermin', 3, 0, 14, 'Tage', '19.2', 'ja'],
          ['LIEF_AVIS_STUNDEN', 'Lieferung', 'Avisierung an den Kunden vor der Lieferung', 48, 12, 96, 'Stunden', '22.1', 'ja'],
          ['ANZ_MIN_PROZ', 'Kaufvertrag', 'Mindestanzahlung bei Vertragsabschluss', 20, 0, 100, '%', '18.1', 'ja'],
          ['MONT_ZEIT_PUFFER', 'Montage', 'Zeitpuffer je Montage', 30, 0, 120, 'Minuten', '24.3', 'ja'],
          ['KV_STORNO_TAGE', 'Kaufvertrag', 'Stornofrist ohne Gebühr', 14, 0, 30, 'Tage', '18.1', 'ja'],
        ],
      },
      {
        name: 'Tour',
        widths: [30, 12, 52, 10, 8, 8, 10, 12, 11],
        rows: [head, ['TOUR_MAX_STOPPS', 'Tour', 'Höchstzahl Stopps je Tour', 12, 1, 30, 'Stopps', '20.1', 'ja'], ['TOUR_START_ZEIT', 'Tour', 'Frühester Tourstart', '07:00', '05:00', '10:00', 'Uhrzeit', '20.1', 'ja']],
      },
      {
        name: 'Fibu',
        widths: [30, 12, 52, 10, 8, 8, 14, 12, 11],
        rows: [head, ['FIBU_KONTO_ANZAHLUNG', 'Fibu', 'Konto für erhaltene Anzahlungen', '1718', '', '', 'Konto (SKR03)', '18.1', 'ja'], ['FIBU_EXPORT_ZEIT', 'Fibu', 'Uhrzeit der nächtlichen Übergabe', '02:00', '00:00', '05:00', 'Uhrzeit', '21.2', 'nein']],
      },
      {
        name: 'Änderungshistorie',
        widths: [10, 14, 70, 18],
        rows: [
          ['Version', 'Datum', 'Änderung', 'Bearbeitet von'],
          ['26.3', '09.07.2026', 'Keine neuen Parameter', 'M. Thelen'],
          ['26.2', '28.04.2026', 'MONT_ZEIT_PUFFER: Max von 90 auf 120 Minuten', 'M. Thelen'],
          ['26.1', '30.01.2026', 'FIBU_EXPORT_ZEIT neu', 'E. Demir'],
        ],
      },
    ],
  },
  {
    slug: 'dlg-kaufvertrag-docx',
    name: 'Dialogbeschreibung_Kaufvertrag_v7.docx',
    folder: 'Fachberatung',
    kind: 'docx',
    docType: 'dialogbeschreibung',
    author: 'thelen',
    modifiedBy: 'thelen',
    created: '2019-11-04T09:00:00Z',
    modified: '2026-06-23T13:40:00Z',
    title: 'Dialogbeschreibung Kaufvertrag',
    blocks: [
      { h1: 'Dialogbeschreibung Kaufvertrag' },
      { p: 'Version 7 · gültig ab MOBIQ 26.3 · Verantwortlich: Fachberatung (M. Thelen)' },
      { h2: '1 Register „Positionen“' },
      { table: { head: ['Feld', 'Typ', 'Pflicht', 'Beschreibung'], rows: [['Artikel', 'Suche / Scan', 'ja', 'Artikelnummer oder Preisschild-Scan'], ['Menge', 'Zahl', 'ja', 'Vorbelegt mit 1'], ['Montage', 'Checkbox', 'nein', 'Montageleistung zur Position']] } },
      { h2: '2 Register „Lieferung“' },
      { p: 'Aufruf über Kaufvertrag › Lieferung. Änderungen werden sofort an die Disposition übertragen.' },
      {
        table: {
          head: ['Feld', 'Typ', 'Pflicht', 'Beschreibung'],
          rows: [
            ['Wunschtermin', 'KW-Auswahl', 'ja', 'Gewünschte Lieferwoche des Kunden'],
            ['Lieferadresse', 'Adresse', 'ja', 'Vorbelegt mit der Kundenadresse'],
            ['Etage / Aufzug', 'Auswahl', 'nein', 'EG, 1. OG, 2. OG, 3. OG+, mit Aufzug'],
            ['Liefersperre', 'Checkbox', 'nein', 'Kaufvertrag wird nicht disponiert'],
            ['Montage', 'Checkbox', 'nein', 'Aus Positionen mit Montageleistung vorbelegt'],
          ],
        },
      },
      { note: 'Ist die Liefersperre gesetzt, erscheint der Kaufvertrag nicht in der Tourenplanung.' },
      { h2: '3 Register „Zahlung“' },
      { table: { head: ['Feld', 'Typ', 'Pflicht', 'Beschreibung'], rows: [['Anzahlung', 'Betrag', 'ja', 'Mindestens ANZ_MIN_PROZ'], ['Finanzkauf', 'Checkbox', 'nein', 'Antrag an die Partnerbank']] } },
    ],
  },
  {
    slug: 'installationshandbuch',
    name: 'MOBIQ_Installationshandbuch_26.3.pdf',
    folder: 'Auslieferung/26.3',
    kind: 'pdf',
    docType: 'installation',
    author: 'brenner',
    modifiedBy: 'brenner',
    created: '2026-07-15T08:30:00Z',
    modified: '2026-07-15T08:30:00Z',
    title: 'MOBIQ Installationshandbuch 26.3',
    pages: [
      {
        blocks: [
          { h1: 'MOBIQ Installationshandbuch' },
          { p: 'Version 26.3 · für Administratoren beim Kunden · Stand Juli 2026' },
          { h2: '1 Systemanforderungen' },
          { table: { head: ['Komponente', 'Mindestens', 'Empfohlen'], rows: [['Datenbank', 'PostgreSQL 15', 'PostgreSQL 16'], ['Anwendungsserver', '4 Kerne, 16 GB RAM je 50 Anwender', '8 Kerne, 32 GB RAM'], ['Clients', 'Windows 10 / aktueller Browser', 'Windows 11']] } },
          { h2: '2 Erstinstallation' },
          { p: 'Führen Sie das Setup auf dem Anwendungsserver aus und folgen Sie dem Assistenten. Die Datenbank wird beim ersten Start angelegt.' },
        ],
      },
      {
        blocks: [
          { h2: '4 Update auf eine neue Version' },
          { bullets: ['Sichern Sie die Datenbank.', 'Stoppen Sie die Dienste mobiq-app und mobiq-druck.', 'Führen Sie das Update-Paket aus. Migrationen laufen automatisch.', 'Starten Sie die Dienste und prüfen Sie das Protokoll.'] },
          { h2: '4.2 Nach dem Update' },
          { p: 'Prüfen Sie unter Administration › Systemstatus, ob alle Dienste laufen. Kundeneigene Druckvorlagen (.ftl) im Ordner vorlagen/kunde bleiben erhalten.' },
          { note: 'In der MOBIQ Performance Cloud übernimmt der Betrieb das Update.' },
        ],
      },
    ],
  },
  {
    slug: 'schulung-verkauf',
    name: 'Schulung_Verkauf_Kaufvertrag_Kasse.pdf',
    folder: 'Schulung',
    kind: 'pdf',
    docType: 'schulung',
    author: 'kroeger',
    modifiedBy: 'kroeger',
    created: '2025-02-10T09:00:00Z',
    modified: '2026-03-04T11:15:00Z',
    title: 'Schulung Verkauf: Kaufvertrag und Kasse',
    pages: [
      { slide: true, blocks: [{ title: 'Schulung Verkauf' }, { p: 'Kaufvertrag, Lieferung und Kasse in MOBIQ' }, { p: 'Stand 26.1 · Akademie Musterhaus' }] },
      { slide: true, blocks: [{ title: 'Lieferung vereinbaren' }, { bullets: ['Wunschtermin als Kalenderwoche wählen', 'Ein Kaufvertrag wird immer komplett geliefert', 'Liefersperre setzen, wenn der Kunde noch nicht bereit ist'] }] },
      { slide: true, blocks: [{ title: 'Gutscheine an der Kasse' }, { bullets: ['Gutschein scannen oder Nummer eingeben', 'Gutscheine werden immer vollständig eingelöst', 'Restbetrag: neuer Gutschein wird gedruckt'] }] },
      { slide: true, blocks: [{ title: 'Tagesabschluss' }, { bullets: ['Am Ende des Tages je Kasse', 'Dauert je nach Filiale einige Sekunden', 'Danach Kassenbuch prüfen'] }] },
    ],
  },
  {
    slug: 'architekturbild',
    name: 'MOBIQ_Architektur_Gesamtsystem.pdf',
    folder: 'Entwicklung/Architektur',
    kind: 'pdf',
    docType: 'architektur',
    author: 'reuter',
    modifiedBy: 'reuter',
    created: '2024-05-06T10:00:00Z',
    modified: '2026-01-20T16:05:00Z',
    title: 'MOBIQ Architektur Gesamtsystem',
    pages: [
      {
        blocks: [{ h1: 'MOBIQ Gesamtsystem' }, { p: 'Stand 26.1 · Export aus draw.io (mobiq-gesamtsystem.drawio)' }],
        diagram: {
          boxes: [
            { x: 70, y: 600, w: 130, h: 46, label: 'Desktop-Client\nDelphi' },
            { x: 232, y: 600, w: 130, h: 46, label: 'Web-Client\nReact' },
            { x: 394, y: 600, w: 130, h: 46, label: 'Fahrer-App\nKotlin' },
            { x: 150, y: 470, w: 295, h: 56, label: 'Anwendungsserver\nKaufvertrag · Kasse · Tour · Faktura', fill: '0.906 0.933 0.984' },
            { x: 70, y: 340, w: 120, h: 46, label: 'Dienst tour' },
            { x: 205, y: 340, w: 120, h: 46, label: 'Dienst druck' },
            { x: 340, y: 340, w: 120, h: 46, label: 'Dienst fibu-export' },
            { x: 150, y: 220, w: 160, h: 46, label: 'PostgreSQL' },
            { x: 340, y: 220, w: 160, h: 46, label: 'Finanzbuchhaltung\n(MOBIQ Finanz)' },
          ],
          arrows: [
            [135, 600, 250, 528],
            [297, 600, 297, 528],
            [459, 600, 345, 528],
            [200, 470, 130, 388],
            [297, 470, 265, 388],
            [390, 470, 400, 388],
            [265, 340, 240, 268],
            [400, 340, 420, 268],
          ],
          captions: [{ text: 'Rechnungen gelangen nur über fibu-export in die Finanzbuchhaltung (ADR-021).', x: 70, y: 180 }],
        },
      },
    ],
  },
  {
    slug: 'leistungsbeschreibung',
    name: 'Leistungsbeschreibung_MOBIQ_ERP_2026.docx',
    folder: 'Vertrieb',
    kind: 'docx',
    docType: 'leistungsbeschreibung',
    author: 'engel',
    modifiedBy: 'engel',
    created: '2025-12-01T09:00:00Z',
    modified: '2026-02-18T10:30:00Z',
    title: 'Leistungsbeschreibung MOBIQ ERP 2026',
    blocks: [
      { h1: 'Leistungsbeschreibung MOBIQ ERP' },
      { p: 'Anlage zum Software-Pflegevertrag · Stand 2026' },
      { h2: '1 Kaufvertrag und Auftrag' },
      { bullets: ['Kaufvertrag mit Positionen, Anzahlung und Finanzkauf', 'Lieferung: Komplettlieferung je Kaufvertrag mit Wunschtermin (Kalenderwoche)', 'Montageplanung mit Montage-App'] },
      { h2: '2 Auslieferung' },
      { bullets: ['Grafische Tourenplanung mit Karte', 'Avisierung per SMS oder E-Mail, standardmäßig 48 Stunden vor der Lieferung', 'Fahrer-App mit Lieferschein und Restzahlung'] },
      { h2: '3 Kasse' },
      { bullets: ['Filialkasse mit Kartenterminal', 'Gutscheine: Verkauf und vollständige Einlösung', 'Tagesabschluss je Filiale'] },
      { h2: '4 Finanzbuchhaltung' },
      { bullets: ['Nächtliche Übergabe von Rechnungen, Gutschriften und Anzahlungen', 'Belegarten RE, GS, AZ'] },
    ],
  },
  {
    slug: 'datenmodell-xlsx',
    name: 'Datenmodell_Auftragsabwicklung_26.3.xlsx',
    folder: 'Entwicklung/Datenmodell',
    kind: 'xlsx',
    docType: 'technische-doku',
    author: 'albrecht',
    modifiedBy: 'albrecht',
    created: '2022-09-01T08:00:00Z',
    modified: '2026-07-10T09:10:00Z',
    title: 'Datenmodell Auftragsabwicklung 26.3',
    sheets: [
      {
        name: 'Tabellen',
        widths: [18, 44, 26, 16],
        rows: [['Tabelle', 'Inhalt', 'Schlüssel', 'Seit Version'], ['kaufvertrag', 'Kopf des Kaufvertrags', 'kv_id', '18.1'], ['kv_position', 'Positionen des Kaufvertrags', 'kvp_id, FK kv_id', '18.1'], ['tour_stopp', 'Stopp einer Tour', 'stopp_id, FK kv_id', '20.1']],
      },
      {
        name: 'Spalten',
        widths: [16, 20, 16, 50],
        rows: [
          ['Tabelle', 'Spalte', 'Typ', 'Beschreibung'],
          ['kaufvertrag', 'kv_nr', 'varchar(12)', 'Kaufvertragsnummer'],
          ['kaufvertrag', 'liefersperre', 'boolean', 'Nicht disponieren'],
          ['kaufvertrag', 'finanzkauf', 'boolean', 'Ratenkauf über Partnerbank (seit 26.3)'],
          ['kv_position', 'artikel_nr', 'varchar(20)', 'Artikelnummer'],
          ['kv_position', 'montage', 'boolean', 'Montageleistung'],
          ['tour_stopp', 'kv_id', 'bigint', 'Kaufvertrag des Stopps'],
        ],
      },
    ],
  },
]

/** Document type labels for files (the six Confluence types plus training and contract docs). */
export const fileDocTypes = {
  parametertabelle: 'Parametertabelle',
  dialogbeschreibung: 'Dialogbeschreibung',
  installation: 'Installationsdoku',
  architektur: 'Architekturbild',
  'technische-doku': 'Technische Doku',
  schulung: 'Schulungsunterlage',
  leistungsbeschreibung: 'Leistungsbeschreibung',
}
