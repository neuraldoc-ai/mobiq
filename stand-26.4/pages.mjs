// MOBIQ documentation after release 26.4, as a careful editorial team would leave it: every must and should item of
// data/ground-truth.json that text can fix (screenshots and the draw.io picture stay as they are). Storage format,
// keyed by the dataset page id; pages not listed here need no change for 26.4.
const p = (...lines) => lines.map((l) => `<p>${l}</p>`).join('')
const table = (head, rows) => `<table data-layout="default"><colgroup>${head.map(() => '<col />').join('')}</colgroup><tbody><tr>${head.map((h) => `<th><p><strong>${h}</strong></p></th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td><p>${c}</p></td>`).join('')}</tr>`).join('')}</tbody></table>`
const macro = (name, body, title) => `<ac:structured-macro ac:name="${name}" ac:schema-version="1">${title ? `<ac:parameter ac:name="title">${title}</ac:parameter>` : ''}<ac:rich-text-body>${body}</ac:rich-text-body></ac:structured-macro>`
const image = (file, width = 760) => `<ac:image ac:align="center" ac:layout="center" ac:width="${width}"><ri:attachment ri:filename="${file}" /></ac:image>`
const children = '<ac:structured-macro ac:name="children" ac:schema-version="2"><ac:parameter ac:name="all">true</ac:parameter></ac:structured-macro>'
const PARAM = ['Parameter', 'Bedeutung', 'Standard', 'Min', 'Max', 'Einheit']
const FIELD = ['Feld', 'Typ', 'Pflicht', 'Beschreibung']

export const pages = {
  // MOBIQHB · MOBIQ Anwenderhandbuch
  393281537: macro('info', p('Dieses Handbuch beschreibt MOBIQ in der Version 26.4.'), 'Version') + p('Wählen Sie ein Kapitel:') + children,

  393281702: p('Im Register <strong>Lieferung</strong> legen Sie fest, wann und wie die Ware zum Kunden kommt. Die Disposition sieht den Kaufvertrag erst, wenn er auf „Lieferbereit“ steht und kein Lieferstopp gesetzt ist.')
    + image('register-lieferung.png')
    + '<h2>3.1 Liefertermin vereinbaren</h2>' + p('Wählen Sie im Feld „Wunschtermin“ eine Kalenderwoche. MOBIQ prüft, ob alle Positionen bis dahin im Lager sein können, und zeigt den frühesten möglichen Termin an.')
    + '<h2>3.2 Lieferbereitschaft</h2>' + p('Ein Kaufvertrag wird vollständig ausgeliefert, außer Sie vereinbaren eine Teillieferung (siehe 3.4). Er steht erst auf „Lieferbereit“, wenn alle Positionen im Lager eingegangen sind. Bei einer Teillieferung gilt das für jeden Teil einzeln.')
    + macro('note', p('Soll ein lieferbereiter Kaufvertrag noch nicht disponiert werden, setzen Sie den <strong>Lieferstopp</strong>. Sie heben ihn im selben Register wieder auf.'))
    + '<h2>3.3 Montage beauftragen</h2>' + p('Positionen mit Montageleistung werden automatisch an die Montageplanung übergeben. Die Monteure sehen den Auftrag in der Montage-App.')
    + '<h2>3.4 Teillieferung vereinbaren</h2>' + p('Ist ein Teil der Ware früher verfügbar oder möchte der Kunde gestaffelt beliefert werden, teilen Sie die Lieferung auf. Das geht, wenn Ihr Administrator Teillieferungen erlaubt hat (Parameter TEILLIEF_ERLAUBT).')
    + '<ol><li>Setzen Sie im Register „Lieferung“ den Haken „Teillieferung erlaubt“.</li><li>Klicken Sie auf „Lieferung aufteilen“.</li><li>Ziehen Sie die Positionen per Drag &amp; Drop auf die Teile und wählen Sie je Teil einen Wunschtermin.</li><li>Speichern Sie. Jeder Teil wird als eigener Stopp disponiert.</li></ol>'
    + p('Standardmäßig sind höchstens 3 Teile je Kaufvertrag möglich (Parameter TEILLIEF_MAX_ANZAHL, einstellbar von 2 bis 5). Jeder Teil muss mindestens 20 % des Warenwerts haben (Parameter TEILLIEF_MIN_WARENWERT_PROZ). Für jeden ausgelieferten Teil entsteht eine Teilrechnung; die Anzahlung wird anteilig verrechnet.')
    + macro('info', p('Bei Finanzkauf ist keine Teillieferung möglich. Der Haken „Teillieferung erlaubt“ wird dann nicht angezeigt.')),

  393281733: p('Die Anzahlung wird bei Vertragsabschluss kassiert. Die Restzahlung ist bei Lieferung fällig, entweder vorab an der Kasse oder beim Fahrer.',
    'Mit der Schlussrechnung wird die Anzahlung verrechnet. Die Schlussrechnung entsteht automatisch, sobald der Kaufvertrag vollständig ausgeliefert ist.',
    'Bei einer Teillieferung entsteht für jeden ausgelieferten Teil eine Teilrechnung. Sie verrechnet den Anteil der Anzahlung, der dem Warenwert des Teils entspricht; die Teilrechnung des letzten Teils verrechnet den Rest. Die Restzahlung ist je Teil bei dessen Lieferung fällig.'),

  393282049: p('Alle lieferbereiten Kaufverträge erscheinen in der Liste „Offene Lieferungen“. Ziehen Sie einen Auftrag auf eine Tour in der Karte, um ihn einzuplanen.')
    + image('tourenplanung-karte.png')
    + p('Ein Kaufvertrag ist ein Stopp auf einer Tour. Bei einer Teillieferung wird jeder lieferbereite Teil ein eigener Stopp; Karte und Lieferschein zeigen ihn mit Kaufvertragsnummer und Teil (T1, T2 …). Kaufverträge mit gesetztem Lieferstopp erscheinen nicht in „Offene Lieferungen“.')
    + '<h2>2.3 Montage einplanen</h2>' + p('Enthält ein Stopp eine Montageposition, plant MOBIQ automatisch einen Monteur und die Montagezeit mit ein. Bei einer Teillieferung wird die Montage nur bei dem Teil eingeplant, der die Montageposition enthält. Den Puffer je Montage legt Ihr Administrator fest.')
    + '<h2>2.4 Ladevolumen</h2>' + p('MOBIQ summiert das Volumen aller Stopps einer Tour und zeigt es in der Kopfzeile der Tour zusammen mit dem Ladevolumen des Fahrzeugs an. Ist die Tour überladen, wird die Anzeige rot markiert.',
      'Beim Speichern einer überladenen Tour fragt MOBIQ nach, ob Sie trotzdem speichern möchten. Hat Ihr Administrator das Überladen nicht erlaubt (Parameter TOUR_UEBERLADUNG_ERLAUBT), lässt sich die Tour nicht speichern.'),

  393282080: p('Der Fahrer erhält die Lieferscheine in der Fahrer-App und kassiert offene Restzahlungen bar oder per Karte. Bei einer Teillieferung kassiert er nur den offenen Betrag der Teilrechnung des gelieferten Teils.',
    'Der Kunde bekommt die Avisierung standardmäßig 24 Stunden vor der Lieferung per SMS oder E-Mail. Den Vorlauf legt Ihr Administrator fest (Parameter LIEF_AVIS_STUNDEN).'),

  393282337: p('Ein Gutschein kann ganz oder teilweise eingelöst werden. Ist der Einkauf günstiger als der Gutschein, bleibt das Restguthaben auf demselben Gutschein und kann später eingelöst werden.',
    'Scannen Sie den Gutschein-Code oder geben Sie die Nummer im Feld „Gutschein“ ein. Nach der Einlösung zeigt die Kasse das Restguthaben an, und der Bon nennt es mit der Gutscheinnummer.')
    + image('kasse-gutschein.png', 480),

  393282371: p('Restzahlungen, die der Fahrer kassiert, erscheinen am nächsten Morgen im Kassenbuch der Filiale.',
    'Die Fahrer-App zeigt den offenen Betrag beim Kunden: ohne Teillieferung den Warenwert abzüglich der Anzahlung, bei einer Teillieferung den offenen Betrag der Teilrechnung des gelieferten Teils.'),

  393282402: '<h3>Kann ich einen Gutschein teilweise einlösen?</h3>' + p('Ja. Ist der Bon günstiger als der Gutschein, bleibt das Restguthaben auf demselben Gutschein und kann später eingelöst werden. Der Bon nennt das Restguthaben.')
    + '<h3>Wann ist der Tagesabschluss fertig?</h3>' + p('Der Tagesabschluss dauert je nach Filiale einige Sekunden. Während des Abschlusses ist die Kasse gesperrt.')
    + '<h3>Wie storniere ich einen Bon vom Vortag?</h3>' + p('Bons vom Vortag stornieren Sie über eine Gutschrift, nicht über die Storno-Taste.'),

  393282611: p('MOBIQ übergibt Rechnungen, Teilrechnungen, Gutschriften und Anzahlungen jede Nacht an die Finanzbuchhaltung. Sie finden sie im Stapel „ERP-Import“.')
    + '<h2>5.2 Anzahlungen</h2>' + p('Erhaltene Anzahlungen werden auf das Anzahlungskonto gebucht (Parameter <code>FIBU_KONTO_ANZAHLUNG</code>).',
      'Ohne Teillieferung wird die Schlussrechnung nach vollständiger Auslieferung erstellt; mit ihr wird die gesamte Anzahlung verrechnet. Bei einer Teillieferung verrechnet jede Teilrechnung den Anteil der Anzahlung, der dem Warenwert ihres Teils entspricht. Die Teilrechnung des letzten Teils verrechnet den Rest, damit keine Rundungsdifferenz bleibt.')
    + '<h2>5.3 Erlöse</h2>' + p('Der Erlös wird mit dem Rechnungsdatum gebucht, bei Teilrechnungen mit dem Datum der Teilrechnung. Offene Posten werden über die Kaufvertragsnummer zugeordnet, auch wenn zu einem Kaufvertrag mehrere Teilrechnungen gehören.')
    + table(['Belegart', 'Bedeutung'], [['RE', 'Rechnung'], ['TR', 'Teilrechnung'], ['GS', 'Gutschrift'], ['AZ', 'Anzahlung']])
    + '<h2>5.4 Gutscheine</h2>' + p('Verkaufte Gutscheine werden als Verbindlichkeit gebucht. Bei einer Einlösung wird die Verbindlichkeit nur in Höhe des eingelösten Betrags aufgelöst; für ein Restguthaben bleibt sie stehen.'),

  393282707: table(['Begriff', 'Bedeutung'], [
    ['Anzahlung', 'Teil des Kaufpreises, der bei Vertragsabschluss kassiert wird'],
    ['Finanzkauf', 'Kauf auf Raten über die Partnerbank'],
    ['Kommission', 'Interne Nummer des Kaufvertrags im Lager'],
    ['Lieferstopp', 'Kennzeichen am Kaufvertrag: wird nicht disponiert, auch wenn er lieferbereit ist (bis 26.3 „Liefersperre“)'],
    ['Lieferteil', 'Ein Teil einer Teillieferung mit eigenen Positionen, eigenem Wunschtermin und eigenem Stopp'],
    ['Stopp', 'Ein Halt auf einer Tour; entspricht einem Kaufvertrag oder, bei einer Teillieferung, einem Lieferteil'],
    ['Teillieferung', 'Auslieferung eines Kaufvertrags in mehreren Lieferteilen'],
    ['Teilrechnung', 'Rechnung über einen ausgelieferten Lieferteil (Belegart TR)'],
    ['Tour', 'Fahrt eines Fahrzeugs mit mehreren Stopps an einem Tag'],
  ]),

  // MOBIQFB · MOBIQ Fachberatung
  426115141: p('Aufruf über Kaufvertrag › Lieferung. Pflichtfelder sind fett markiert.')
    + image('register-lieferung.png')
    + table(FIELD, [
      ['Wunschtermin', 'KW-Auswahl', 'ja', 'Gewünschte Lieferwoche des Kunden'],
      ['Lieferadresse', 'Adresse', 'ja', 'Vorbelegt mit der Kundenadresse'],
      ['Etage / Aufzug', 'Auswahl', 'nein', 'Für die Tourenplanung'],
      ['Lieferstopp', 'Checkbox', 'nein', 'Kaufvertrag wird nicht disponiert'],
      ['Montage', 'Checkbox', 'nein', 'Aus Positionen mit Montageleistung vorbelegt'],
      ['Teillieferung erlaubt', 'Checkbox', 'nein', 'Nur sichtbar, wenn Teillieferungen im Mandanten erlaubt sind (TEILLIEF_ERLAUBT) und kein Finanzkauf vorliegt'],
      ['Lieferung aufteilen', 'Schaltfläche', '–', 'Öffnet den Dialog „Lieferung aufteilen“; aktiv, wenn „Teillieferung erlaubt“ gesetzt ist'],
    ])
    + p('Änderungen im Register „Lieferung“ werden sofort an die Disposition übertragen.')
    + '<h2>Dialog „Lieferung aufteilen“</h2>' + p('Teilt den Kaufvertrag in Lieferteile. Speichern ist erst möglich, wenn die Aufteilung gültig ist.')
    + table(FIELD, [
      ['Teil', 'Gruppe', '–', 'Teil 1, 2, … bis höchstens TEILLIEF_MAX_ANZAHL (Standard 3)'],
      ['Positionen', 'Liste (Drag &amp; Drop)', 'ja', 'Positionen des Teils; per Drag &amp; Drop zwischen den Teilen verschieben'],
      ['Warenwert-Anteil', 'Anzeige', '–', 'Anteil des Teils am Warenwert in %; Warnung, wenn er unter TEILLIEF_MIN_WARENWERT_PROZ (Standard 20 %) liegt'],
      ['Wunschtermin', 'KW-Auswahl', 'ja', 'Lieferwoche dieses Teils'],
    ]),

  426115176: p('Erscheint nach „Bezahlen“ an der Kasse.') + table(FIELD, [
    ['Zahlart', 'Auswahl', 'ja', 'Bar, Karte, Gutschein, Finanzkauf'],
    ['Gutschein', 'Scan / Nummer', 'nein', 'Nur bei Zahlart Gutschein'],
    ['Offener Betrag', 'Anzeige', '–', 'Restbetrag des Bons nach dieser Zahlung'],
    ['Restguthaben', 'Anzeige', '–', 'Guthaben, das nach der Einlösung auf dem Gutschein bleibt; nur bei Zahlart Gutschein'],
  ]),

  426115233: table(PARAM, [
    ['LIEF_VORLAUF_TAGE', 'Vorlauf zwischen Wareneingang und frühestem Liefertermin', '3', '0', '14', 'Tage'],
    ['LIEF_AVIS_STUNDEN', 'Avisierung an den Kunden vor der Lieferung', '24', '12', '96', 'Stunden'],
    ['ANZ_MIN_PROZ', 'Mindestanzahlung bei Vertragsabschluss', '20', '0', '100', '%'],
    ['MONT_ZEIT_PUFFER', 'Zeitpuffer je Montage', '30', '0', '120', 'Minuten'],
    ['TEILLIEF_ERLAUBT', 'Teillieferungen im Mandanten erlauben', 'Nein', '–', '–', '–'],
    ['TEILLIEF_MAX_ANZAHL', 'Höchstzahl Lieferteile je Kaufvertrag', '3', '2', '5', 'Teile'],
    ['TEILLIEF_MIN_WARENWERT_PROZ', 'Mindestanteil am Warenwert je Lieferteil', '20', '10', '90', '%'],
  ]),

  426115264: table(PARAM, [
    ['TOUR_MAX_STOPPS', 'Höchstzahl Stopps je Tour', '12', '1', '30', 'Stopps'],
    ['TOUR_START_ZEIT', 'Frühester Tourstart', '07:00', '05:00', '10:00', 'Uhrzeit'],
    ['TOUR_MAX_LADEVOLUMEN_M3', 'Ladevolumen für neu angelegte Fahrzeuge', '38', '5', '60', 'm³'],
    ['TOUR_UEBERLADUNG_ERLAUBT', 'Tour trotz Überladung speichern (mit Bestätigung)', 'Ja', '–', '–', '–'],
  ]),

  426115295: table(PARAM, [
    ['FIBU_KONTO_ANZAHLUNG', 'Konto für erhaltene Anzahlungen', '1718', '–', '–', 'Konto (SKR03)'],
    ['FIBU_EXPORT_ZEIT', 'Uhrzeit der nächtlichen Übergabe', '02:00', '00:00', '05:00', 'Uhrzeit'],
    ['FIBU_BELEGART_TEILRECHNUNG', 'Belegart für Teilrechnungen im Export', 'TR', '–', '–', 'Text'],
  ]),

  // MOBIQDEV · MOBIQ Entwicklung
  458752033: '<ac:structured-macro ac:name="drawio" ac:schema-version="1"><ac:parameter ac:name="diagramName">mobiq-gesamtsystem</ac:parameter><ac:parameter ac:name="simpleViewer">false</ac:parameter><ac:parameter ac:name="pageSize">false</ac:parameter><ac:parameter ac:name="zoom">1</ac:parameter><ac:parameter ac:name="lbox">true</ac:parameter><ac:parameter ac:name="diagramWidth">1081</ac:parameter><ac:parameter ac:name="revision">7</ac:parameter><ac:parameter ac:name="width" /></ac:structured-macro>'
    + p('Clients (Desktop, Web, Fahrer-App) sprechen ausschließlich mit dem Anwendungsserver. Hintergrunddienste: tour, druck, fibu-export.',
      'Rechnungen gelangen ausschließlich über den Dienst fibu-export in die Finanzbuchhaltung. Das gilt auch für Teilrechnungen: Für jeden ausgelieferten Lieferteil erstellt der Anwendungsserver eine Teilrechnung (Belegart TR), die fibu-export mit der verrechneten Anzahlung übergibt.')
    + macro('expand', '<ul><li>ADR-014: Keine direkte DB-Verbindung aus Clients</li><li>ADR-021: Fibu nur über fibu_export, nie direkt</li></ul>', 'Entscheidungen'),

  458752069: '<h2>2 Exportformat der Buchungssätze</h2>' + p('Der Export schreibt je Beleg einen Satz in die Tabelle <code>fibu_export</code>. Die Finanzbuchhaltung liest sie nachts über den Dienst fibu-import.')
    + table(['Feld', 'Typ', 'Beschreibung'], [
      ['belegart', 'char(2)', 'RE = Rechnung, TR = Teilrechnung, GS = Gutschrift, AZ = Anzahlung'],
      ['belegnr', 'varchar(20)', 'Fortlaufend je Mandant'],
      ['kv_nr', 'varchar(12)', 'Kaufvertragsnummer, für die Zuordnung offener Posten'],
      ['betrag_brutto', 'numeric(12,2)', 'Bruttobetrag des Belegs'],
      ['steuerschluessel', 'smallint', 'Steuerschlüssel der Finanzbuchhaltung'],
      ['teillieferung_nr', 'smallint', 'Nummer des Lieferteils; nur bei Belegart TR, sonst leer'],
      ['az_verrechnet', 'numeric(12,2)', 'Mit diesem Beleg verrechnete Anzahlung'],
    ])
    + '<h2>3 Verrechnung von Anzahlungen</h2>' + p('Ohne Teillieferung verrechnet die Schlussrechnung die gesamte Anzahlung (Feld <code>anzahlung</code> des Kaufvertrags).',
      'Bei einer Teillieferung verrechnet jede Teilrechnung die Anzahlung anteilig nach dem Warenwert ihres Lieferteils, kaufmännisch auf zwei Nachkommastellen gerundet. Die Teilrechnung des letzten Teils verrechnet den Rest der Anzahlung, sodass keine Rundungsdifferenz bleibt. Der verrechnete Betrag steht in <code>az_verrechnet</code>.'),

  458752101: table(['Tabelle', 'Inhalt', 'Schlüssel'], [
    ['kaufvertrag', 'Kopf des Kaufvertrags', 'kv_id'],
    ['kv_position', 'Positionen des Kaufvertrags', 'kvp_id, FK kv_id, FK lt_id (nur bei Teillieferung)'],
    ['lieferteil', 'Teile einer Teillieferung: Teilnummer, Wunsch-KW, Status', 'lt_id, FK kv_id; eindeutig je kv_id und teil_nr'],
    ['tour_stopp', 'Stopp einer Tour', 'stopp_id, FK kv_id, FK lt_id (nur bei Teillieferung)'],
  ]),

  458752133: p('Migrationen liegen unter <code>db/migration</code> und laufen beim Update automatisch in Versionsreihenfolge (Flyway).')
    + table(['Version', 'Inhalt', 'Laufzeit (Richtwert)'], [
      ['V26_3_004', 'Index auf kv_position.artikel_nr', 'ca. 2 min bei 1 Mio. Positionen'],
      ['V26_3_009', 'Spalte kaufvertrag.finanzkauf', 'unter 1 min'],
      ['V26_4_012', 'Tabelle lieferteil; Spalten kv_position.lt_id und tour_stopp.lt_id', 'unter 1 min'],
      ['V26_4_015', 'Tabelle kassenbeleg nach Belegjahr partitionieren', 'ca. 4 min bei 4 Mio. Belegen'],
      ['V26_4_016', 'Sicht kassenbeleg_alle', 'unter 1 min'],
    ]),

  458752165: '<h2>3 Tabelle kassenbeleg</h2>' + p('Jeder Bon ist ein Satz in <code>kassenbeleg</code> mit seinen Zahlungen in <code>kassenzahlung</code>. Seit 26.4 ist <code>kassenbeleg</code> nach Belegjahr partitioniert (eine Partition <code>kassenbeleg_&lt;jahr&gt;</code> je Jahr, Bereich über <code>belegdatum</code>). Der Tagesabschluss liest alle Belege des Tages je Filiale und damit nur die Partition des laufenden Jahres.',
      'Für Auswertungen über mehrere Jahre gibt es die Sicht <code>kassenbeleg_alle</code>.')
    + '<h2>4 Aufbewahrung</h2>' + p('Kassenbelege werden nicht gelöscht. Ältere Jahrgänge lassen sich als eigene Partition auslagern, ohne die Kasse zu sperren.'),

  458752197: p('Belege werden über HTML-Vorlagen mit Platzhaltern wie <code>{{beleg.nr}}</code> in <code>druck/vorlagen</code> erzeugt (<code>rechnung.html</code>, <code>lieferschein.html</code>, <code>kaufvertrag.html</code>). Einstieg ist die Klasse <code>VorlagenEngine</code>: Sie lädt die Vorlage und rendert sie als PDF. Die frühere Ausgabe über FreeMarker (<code>LegacyDruck</code>, <code>.ftl</code>) gibt es seit 26.4 nicht mehr.',
    'Kundeneigene Vorlagen liegen beim Kunden unter <code>vorlagen/kunde</code> und überschreiben die Standardvorlage mit gleichem Namen. Vorhandene <code>.ftl</code>-Vorlagen stellt der Admin-Job „Vorlagen konvertieren“ auf HTML um.'),

  // MOBIQOPS · MOBIQ Betrieb
  491520033: '<h2>4 Update auf eine neue Version</h2><ol><li>Sichern Sie die Datenbank.</li><li>Stoppen Sie die Dienste mobiq-app und mobiq-druck.</li><li>Führen Sie das Update-Paket aus. Migrationen laufen automatisch.</li><li>Starten Sie die Dienste und prüfen Sie das Protokoll.</li></ol>'
    + p('Beim Update auf 26.4 partitioniert die Migration V26_4_015 die Kassenbelege; bei 4 Mio. Belegen dauert das ca. 4 Minuten.')
    + '<h2>4.2 Nach dem Update</h2>' + p('Prüfen Sie unter Administration › Systemstatus, ob alle Dienste laufen. In der Cloud übernimmt das der Betrieb.',
      'Ab 26.4 druckt MOBIQ nur noch mit HTML-Vorlagen. Haben Sie kundeneigene Druckvorlagen (<code>.ftl</code> im Ordner <code>vorlagen/kunde</code>), starten Sie nach dem Update unter Administration › Vorlagen konvertieren den gleichnamigen Job. Er legt zu jeder <code>.ftl</code>-Vorlage eine <code>.html</code>-Vorlage an. Prüfen Sie danach je einen Probedruck von Rechnung, Lieferschein und Kaufvertrag.')
    + '<h2>5 Systemanforderungen</h2>' + p('Datenbank: PostgreSQL 15 oder neuer. Anwendungsserver: 4 Kerne und 16 GB Arbeitsspeicher je 50 gleichzeitige Anwender.'),

  491520065: p('Kundeneigene Vorlagen sind HTML-Dateien mit Platzhaltern in doppelten geschweiften Klammern, zum Beispiel <code>{{kv.nr}}</code>, im Ordner <code>vorlagen/kunde</code> auf dem Anwendungsserver.',
    'Kopieren Sie die Standardvorlage (zum Beispiel <code>rechnung.html</code>), passen Sie sie an und speichern Sie sie unter demselben Namen. Ein Neustart von mobiq-druck ist nicht nötig.')
    + macro('note', p('FreeMarker-Vorlagen (<code>.ftl</code>) aus Versionen vor 26.4 werden nicht mehr gedruckt. Stellen Sie sie mit dem Job Administration › Vorlagen konvertieren auf HTML um.')),
}

/** New pages for 26.4: parent = dataset page id, labels as in the dataset. */
export const newPages = [
  {
    space: 'MOBIQHB', parent: 393281537, title: 'Neuerungen in 26.4', labels: ['anwenderhandbuch', 'release-notes'],
    body: p('Die wichtigsten Änderungen für Anwender in Version 26.4:') + '<ul>'
      + ['Teillieferung: einen Kaufvertrag in bis zu 3 Teilen ausliefern, je Teil mit eigenem Wunschtermin, Stopp und Teilrechnung (der Administrator schaltet sie mit TEILLIEF_ERLAUBT frei)', 'Gutscheine teilweise einlösen: das Restguthaben bleibt auf dem Gutschein und steht auf dem Bon', 'Ladevolumen je Fahrzeug: die Tourenplanung markiert überladene Touren rot', '„Liefersperre“ heißt jetzt „Lieferstopp“', 'Avisierung standardmäßig 24 statt 48 Stunden vor der Lieferung', 'Für Administratoren: kundeneigene Druckvorlagen nach dem Update mit „Vorlagen konvertieren“ umstellen'].map((x) => `<li>${x}</li>`).join('') + '</ul>',
  },
  {
    space: 'MOBIQFB', parent: 426115109, title: 'Stammdaten – Fahrzeug', labels: ['dialogbeschreibung', 'tourenplanung'],
    body: p('Aufruf über Stammdaten › Fahrzeug. Pflichtfelder sind fett markiert.') + table(FIELD, [
      ['Kennzeichen', 'Text', 'ja', 'Amtliches Kennzeichen'],
      ['Ladevolumen (m³)', 'Zahl', 'ja', 'Ladevolumen des Fahrzeugs; neu angelegte Fahrzeuge erhalten TOUR_MAX_LADEVOLUMEN_M3 (Standard 38 m³)'],
      ['Zuladung (kg)', 'Zahl', 'nein', 'Höchstzuladung'],
      ['Filiale', 'Auswahl', 'ja', 'Standort des Fahrzeugs'],
    ]) + p('Die Tourenplanung vergleicht das Volumen der Stopps einer Tour mit dem Ladevolumen des Fahrzeugs (Anwenderhandbuch, 2.4 Ladevolumen).'),
  },
]
