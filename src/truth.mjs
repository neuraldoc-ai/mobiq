// Ground truth: what a careful technical writer would change in Confluence for release 26.4.
// Used to measure a pipeline (recall = must-items found, false alarms = proposals on `notAffected`).
//
// level: "must"   = the docs are wrong or incomplete without it
//        "should" = good practice (screenshots, cross references, new page for a gap)
// kind:  replace | insert | table-rows | table-cell | new-section | new-page | image | task

export const changes = {
  teillieferung: {
    title: 'Teillieferung im Kaufvertrag',
    tickets: ['MOB-4812', 'MOB-4829'],
    nature: 'fachlich',
    kinds: ['prozess', 'feld', 'parameter', 'schnittstelle', 'datenbank'],
    path: ['Auftragsabwicklung', 'Kaufvertrag', 'Lieferung und Montage', 'Teillieferung'],
    summary: 'Kaufvertrag in 2–5 Lieferteile aufteilen (Standard 3, je Teil mind. 20 % Warenwert, nur wenn TEILLIEF_ERLAUBT). Je Teil eigener Stopp, eigene Teilrechnung (Belegart TR), Anzahlung anteilig, Rest mit dem letzten Teil. Bei Finanzkauf gesperrt.',
    linking: [
      'Commit "MOB-4829 Rundungsdifferenz …" gehört dazu: MOB-4829 ist mit MOB-4812 verknüpft und im selben Merge-Request geschlossen.',
      'Commit "MOB4812 Tooltip …" hat einen Tippfehler im Ticket-Schlüssel, liegt aber auf dem Feature-Branch.',
      'Commit "… (1 bis 10)" ist ein überholter Zwischenstand: gültig sind 2–5, Standard 3.',
      'Die Finanzkauf-Sperre steht nur im Code und in einem Jira-Kommentar (22.09., M. Engel: "Im Handbuch bitte erstmal so beschreiben").',
    ],
    expected: [
      { page: 'hb-lieferung', section: '3.2 Lieferbereitschaft', kind: 'replace', level: 'must', what: '„Ein Kaufvertrag wird immer vollständig ausgeliefert“ ist falsch, Ausnahme Teillieferung.' },
      { page: 'hb-lieferung', section: 'nach 3.3', kind: 'new-section', level: 'must', what: 'Neues Kapitel „Teillieferung vereinbaren“: Haken setzen, Lieferung aufteilen, je Teil Wunschtermin; max. 3 Teile (Standard), je Teil mind. 20 %; Teilrechnung je Teil.' },
      { page: 'hb-lieferung', section: 'neues Kapitel', kind: 'insert', level: 'must', what: 'Bei Finanzkauf ist keine Teillieferung möglich (Quelle: Code + Jira-Kommentar).' },
      { page: 'hb-anzahlung', section: '4', kind: 'replace', level: 'must', what: 'Anzahlung wird bei Teillieferung anteilig je Teilrechnung verrechnet; Restzahlung je Teil.' },
      { page: 'hb-touren-planen', section: '2', kind: 'replace', level: 'must', what: '„Ein Kaufvertrag ist immer genau ein Stopp“: bei Teillieferung ein Stopp je Teil (T1, T2 …).' },
      { page: 'hb-touren-planen', section: '2.3 Montage einplanen', kind: 'insert', level: 'must', what: 'Montage nur beim Teil mit Montageposition.' },
      { page: 'hb-lieferschein', section: '3', kind: 'insert', level: 'should', what: 'Fahrer kassiert bei Teillieferung nur den Anteil des gelieferten Teils.' },
      { page: 'hb-restzahlung', section: '7', kind: 'insert', level: 'should', what: 'Restzahlung je Teil (Fahrer-App zeigt Betrag der Teilrechnung).' },
      { page: 'hb-fibu', section: '5.2 Anzahlungen', kind: 'replace', level: 'must', what: 'Anzahlung nicht nur mit der Schlussrechnung: anteilig je Teilrechnung, Rest mit dem letzten Teil.' },
      { page: 'hb-fibu', section: '5.3 Erlöse', kind: 'table-rows', level: 'must', what: 'Belegart TR = Teilrechnung ergänzen; Erlös mit Datum der Teilrechnung, OP über KV-Nummer.' },
      { page: 'hb-glossar', section: 'Stopp', kind: 'table-cell', level: 'must', what: '„Stopp … entspricht einem Kaufvertrag“ stimmt nicht mehr; Begriffe Teillieferung/Lieferteil ergänzen.' },
      { page: 'fb-dlg-lieferung', section: 'Feldtabelle', kind: 'table-rows', level: 'must', what: 'Checkbox „Teillieferung erlaubt“ (nur wenn TEILLIEF_ERLAUBT, nicht bei Finanzkauf), Schaltfläche „Lieferung aufteilen“.' },
      { page: 'fb-dlg-lieferung', section: 'neu', kind: 'new-section', level: 'must', what: 'Dialog „Lieferung aufteilen“: Teil, Positionen (Drag & Drop), Warenwert-Anteil mit Warnung, Wunschtermin je Teil.' },
      { page: 'fb-dlg-lieferung', section: 'Screenshot', kind: 'image', level: 'should', what: 'register-lieferung.png zeigt die neuen Felder nicht.' },
      { page: 'fb-par-auftrag', section: 'Tabelle', kind: 'table-rows', level: 'must', what: 'TEILLIEF_ERLAUBT (Nein), TEILLIEF_MAX_ANZAHL (3; 2–5), TEILLIEF_MIN_WARENWERT_PROZ (20; 10–90). Nicht 1–10.' },
      { page: 'fb-par-fibu', section: 'Tabelle', kind: 'table-rows', level: 'must', what: 'FIBU_BELEGART_TEILRECHNUNG (TR).' },
      { page: 'dev-fibu-schnittstelle', section: '2', kind: 'table-cell', level: 'must', what: 'belegart: TR = Teilrechnung.' },
      { page: 'dev-fibu-schnittstelle', section: '2', kind: 'table-rows', level: 'must', what: 'Felder teillieferung_nr, az_verrechnet.' },
      { page: 'dev-fibu-schnittstelle', section: '3', kind: 'replace', level: 'must', what: 'Anzahlung anteilig nach Warenwert, Rundungsrest mit dem letzten Teil.' },
      { page: 'dev-datenmodell', section: 'Tabelle', kind: 'table-rows', level: 'must', what: 'Tabelle lieferteil; Spalte lt_id in kv_position und tour_stopp.' },
      { page: 'dev-migrationen', section: 'Tabelle', kind: 'table-rows', level: 'must', what: 'V26_4_012 lieferteil.' },
      { page: 'dev-architektur', section: 'Bild', kind: 'task', level: 'should', what: 'Datenfluss Lieferteil → Teilrechnung → fibu-export im draw.io ergänzen (Bild selbst kann kein Modell zeichnen).' },
    ],
    notAffected: [
      { page: 'ops-update', why: 'Migration läuft automatisch, kein Schritt für Administratoren.' },
      { page: 'hb-kv-erfassen', why: 'Erfassen und Finanzkauf-Antrag unverändert.' },
      { page: 'hb-gutscheine', why: 'Kein Bezug.' },
    ],
  },

  gutschein: {
    title: 'Gutschein teilweise einlösen',
    tickets: ['MOB-4777'],
    nature: 'fachlich',
    kinds: ['prozess', 'feld'],
    path: ['Kasse', 'Gutscheine', 'Einlösung'],
    summary: 'Gutschein ganz oder teilweise einlösen; Restguthaben bleibt auf demselben Gutschein und steht auf dem Bon. Fibu löst die Verbindlichkeit nur in Höhe des eingelösten Betrags auf.',
    linking: ['Jira-Kommentar von E. Demir verlangt ausdrücklich die Anpassung des Fibu-Handbuchs.'],
    expected: [
      { page: 'hb-gutscheine', section: '6', kind: 'replace', level: 'must', what: 'Teileinlösung statt „nur vollständig, Rest als neuer Gutschein“.' },
      { page: 'hb-faq-kasse', section: 'Kann ich einen Gutschein teilweise einlösen?', kind: 'replace', level: 'must', what: 'Antwort „Nein“ ist falsch. Zweite Fundstelle derselben Aussage — leicht zu übersehen.' },
      { page: 'hb-fibu', section: '5.4 Gutscheine', kind: 'replace', level: 'must', what: 'Verbindlichkeit nur in Höhe des eingelösten Betrags auflösen.' },
      { page: 'fb-dlg-zahlung', section: 'Feldtabelle', kind: 'table-rows', level: 'must', what: 'Anzeige „Restguthaben“.' },
      { page: 'hb-gutscheine', section: 'Screenshot', kind: 'image', level: 'should', what: 'kasse-gutschein.png ohne Restguthaben.' },
    ],
    notAffected: [{ page: 'dev-kasse', why: 'Tabellen unverändert.' }],
  },

  ladevolumen: {
    title: 'Ladevolumen je Fahrzeug prüfen',
    tickets: ['MOB-4801'],
    nature: 'fachlich',
    kinds: ['prozess', 'feld', 'parameter'],
    path: ['Auslieferung', 'Tourenplanung', 'Ladevolumen'],
    summary: 'Fahrzeug hat Pflichtfeld Ladevolumen (m³). Überladene Tour wird rot markiert; Speichern nur mit Bestätigung, wenn TOUR_UEBERLADUNG_ERLAUBT.',
    linking: [],
    expected: [
      { page: 'hb-touren-planen', section: '2.4 Ladevolumen', kind: 'insert', level: 'must', what: 'Rote Markierung bei Überladung, Speichern mit Bestätigung.' },
      { page: 'fb-par-tour', section: 'Tabelle', kind: 'table-rows', level: 'must', what: 'TOUR_MAX_LADEVOLUMEN_M3 (38; 5–60 m³), TOUR_UEBERLADUNG_ERLAUBT (Ja).' },
      { page: null, newPage: { space: 'MOBIQFB', parent: 'fb-dialoge', title: 'Stammdaten – Fahrzeug' }, kind: 'new-page', level: 'should', what: 'Es gibt keine Dialogbeschreibung für den Fahrzeugstamm; neues Pflichtfeld Ladevolumen.' },
    ],
    notAffected: [{ page: 'dev-datenmodell', why: 'Fahrzeugtabelle ist dort nicht beschrieben.' }],
  },

  lieferstopp: {
    title: '„Liefersperre“ heißt jetzt „Lieferstopp“',
    tickets: ['MOB-4835'],
    nature: 'umbenennung',
    kinds: ['label'],
    path: ['Auftragsabwicklung', 'Kaufvertrag', 'Lieferung und Montage'],
    summary: 'Nur die Beschriftung ändert sich (de, nl, fr). Interner Feldname bleibt liefersperre.',
    linking: [],
    expected: [
      { page: 'hb-lieferung', section: 'Einleitung', kind: 'replace', level: 'must', what: '„keine Liefersperre gesetzt ist“ → „kein Lieferstopp gesetzt ist“ (Artikel!).' },
      { page: 'hb-lieferung', section: '3.2 Hinweis', kind: 'replace', level: 'must', what: '„setzen Sie die Liefersperre … Sie heben sie“ → „setzen Sie den Lieferstopp … Sie heben ihn“ (Genus!).' },
      { page: 'hb-touren-planen', section: '2', kind: 'replace', level: 'must', what: '„mit gesetzter Liefersperre“ → „mit gesetztem Lieferstopp“.' },
      { page: 'hb-glossar', section: 'Liefersperre', kind: 'table-cell', level: 'must', what: 'Begriff umbenennen, alphabetisch einsortieren.' },
      { page: 'fb-dlg-lieferung', section: 'Feldtabelle', kind: 'table-cell', level: 'must', what: 'Feld „Lieferstopp“.' },
      { page: 'hb-lieferung', section: 'Screenshot', kind: 'image', level: 'should', what: 'register-lieferung.png zeigt alte Beschriftung.' },
    ],
    notAffected: [{ page: 'dev-datenmodell', why: 'Spalte heißt weiter liefersperre — Code-Bezeichner nicht umbenennen.' }],
  },

  kassenbelege: {
    title: 'Kassenbelege nach Jahr partitionieren',
    tickets: ['MOB-4790'],
    nature: 'technisch',
    kinds: ['datenbank'],
    path: ['Kasse', 'Tagesabschluss und Belege', 'Datenhaltung'],
    summary: 'kassenbeleg nach Belegjahr partitioniert, Sicht kassenbeleg_alle für jahresübergreifende Abfragen. Für Anwender unsichtbar.',
    linking: [],
    expected: [
      { page: 'dev-kasse', section: '3 Tabelle kassenbeleg', kind: 'insert', level: 'must', what: 'Partitionierung nach Belegjahr, Sicht kassenbeleg_alle.' },
      { page: 'dev-kasse', section: '4 Aufbewahrung', kind: 'replace', level: 'should', what: 'Alte Jahrgänge als Partition auslagern, ohne die Kasse zu sperren.' },
      { page: 'dev-migrationen', section: 'Tabelle', kind: 'table-rows', level: 'must', what: 'V26_4_015 (ca. 4 min bei 4 Mio. Belegen), V26_4_016.' },
    ],
    notAffected: [
      { page: 'hb-gutscheine', why: 'Nur Datenbank — Anwenderhandbuch gar nicht erst prüfen.' },
      { page: 'hb-faq-kasse', why: '„Tagesabschluss dauert einige Sekunden“ bleibt richtig.' },
      { page: 'hb-restzahlung', why: 'Nur Datenbank.' },
    ],
  },

  druckvorlagen: {
    title: 'Neue Vorlagen-Engine im Druckmanagement',
    tickets: ['MOB-4760'],
    nature: 'technisch',
    kinds: ['intern', 'betrieb'],
    path: ['Druck und Belege', 'Belegvorlagen'],
    summary: 'FreeMarker (.ftl, LegacyDruck) ersetzt durch HTML-Vorlagen mit {{platzhaltern}} (VorlagenEngine). Kundeneigene Vorlagen nach dem Update per Job „Vorlagen konvertieren“ umstellen, sonst Standardlayout.',
    linking: ['Sechs von sieben Commits sind reiner Umbau; die Betriebswirkung steht nur in einer Commit-Nachricht und in der Ticket-Warnung.'],
    expected: [
      { page: 'ops-update', section: '4.2 Nach dem Update', kind: 'insert', level: 'must', what: 'Ab 26.4: kundeneigene Vorlagen unter Administration › Vorlagen konvertieren umstellen.' },
      { page: 'ops-vorlagen', section: 'ganze Seite', kind: 'replace', level: 'must', what: 'Vorlagen sind jetzt HTML mit {{platzhaltern}}, nicht mehr .ftl.' },
      { page: 'dev-druck', section: 'ganze Seite', kind: 'replace', level: 'must', what: 'VorlagenEngine statt LegacyDruck/FreeMarker.' },
    ],
    notAffected: [
      { page: 'hb-fibu', why: 'Rechnungsinhalt unverändert, obwohl „Rechnung“ in Commits vorkommt.' },
      { page: 'hb-anzahlung', why: 'Kein fachlicher Unterschied.' },
    ],
  },

  'avis-standard': {
    title: 'Avisierung standardmäßig 24 statt 48 Stunden',
    tickets: [],
    nature: 'fachlich',
    kinds: ['parameter'],
    path: ['Auslieferung', 'Lieferschein und Auslieferung', 'Avisierung'],
    summary: 'Standardwert LIEF_AVIS_STUNDEN von 48 auf 24 Stunden geändert. Kein Ticket, kein Merge-Request, direkt auf release/26.4.',
    linking: ['Kein Ticket-Schlüssel. Nur über den Diff in config/parameter/auftrag.yaml erkennbar.'],
    expected: [
      { page: 'fb-par-auftrag', section: 'LIEF_AVIS_STUNDEN', kind: 'table-cell', level: 'must', what: 'Standard 48 → 24.' },
      { page: 'hb-lieferschein', section: '3', kind: 'replace', level: 'must', what: '„48 Stunden vor der Lieferung“ → standardmäßig 24 Stunden.' },
    ],
    notAffected: [],
  },

  'kasse-tests': {
    title: 'Testabdeckung Kasse erhöht',
    tickets: ['MOB-4815'],
    nature: 'intern',
    kinds: ['intern'],
    summary: 'Nur Tests, Testdaten, Pipeline.',
    linking: [],
    expected: [],
    notAffected: [
      { page: 'hb-gutscheine', why: 'Nur Tests.' },
      { page: 'dev-kasse', why: 'Nur Tests.' },
    ],
  },

  'hotfix-tagesabschluss': {
    title: 'Tagesabschluss bei Filiale ohne Belege',
    tickets: ['MOB-4841'],
    nature: 'intern',
    kinds: ['intern'],
    summary: 'Fehlerbehebung: Abbruch bei Filiale ohne Bons. Stellt das dokumentierte Verhalten wieder her.',
    linking: [],
    expected: [],
    notAffected: [{ page: 'hb-faq-kasse', why: 'Verhalten war nie anders dokumentiert.' }],
  },
}

/** Across all changes: a release-notes page is expected once per release. */
export const release = {
  expected: [
    {
      page: null,
      newPage: { space: 'MOBIQHB', parent: 'hb-home', title: 'Neuerungen in 26.4' },
      kind: 'new-page',
      level: 'should',
      what: 'Teillieferung, Gutschein teilweise einlösen, Ladevolumen, Lieferstopp (Umbenennung), Avisierung 24 h, Vorlagen konvertieren (Administratoren).',
    },
  ],
  notInRelease: [
    { ticket: 'MOB-4826', why: 'Status „In Review“, kein Code gemergt — trotz fixVersion 26.4 nicht dokumentieren.' },
    { ticket: 'MOB-4819', why: 'Beim Kunden gelöst, keine Produktänderung.' },
    { ticket: 'MOB-4844', why: 'Folge-Story für 26.5.' },
    { ticket: 'MOB-4850', why: 'Idee im Backlog.' },
    { ticket: 'MOB-4822', why: 'In Arbeit, 26.5.' },
  ],
}

/**
 * The same changes, in the file library (Word, Excel, PDF). Merged into `changes` by the generator.
 * `file` = slug in files.mjs; `section` = sheet/row, chapter or page.
 */
export const fileExpectations = {
  teillieferung: {
    expected: [
      { file: 'parameterliste', section: 'Blatt Auftrag', kind: 'table-rows', level: 'must', what: 'Zeilen TEILLIEF_ERLAUBT (Nein), TEILLIEF_MAX_ANZAHL (3; 2–5), TEILLIEF_MIN_WARENWERT_PROZ (20; 10–90), Seit Version 26.4.' },
      { file: 'parameterliste', section: 'Blatt Fibu', kind: 'table-rows', level: 'must', what: 'Zeile FIBU_BELEGART_TEILRECHNUNG (TR).' },
      { file: 'parameterliste', section: 'Blatt Änderungshistorie', kind: 'table-rows', level: 'should', what: 'Eintrag 26.4 mit den neuen Parametern.' },
      { file: 'dlg-kaufvertrag-docx', section: '2 Register „Lieferung“', kind: 'table-rows', level: 'must', what: 'Felder „Teillieferung erlaubt“ und „Lieferung aufteilen“.' },
      { file: 'dlg-kaufvertrag-docx', section: 'neu nach 2', kind: 'new-section', level: 'must', what: 'Abschnitt „Dialog Lieferung aufteilen“ mit Feldtabelle.' },
      { file: 'schulung-verkauf', section: 'Folie 2 „Lieferung vereinbaren“', kind: 'replace', level: 'must', what: '„Ein Kaufvertrag wird immer komplett geliefert“ ist falsch.' },
      { file: 'schulung-verkauf', section: 'neue Folie', kind: 'new-section', level: 'should', what: 'Folie „Teillieferung vereinbaren“.' },
      { file: 'leistungsbeschreibung', section: '1 Kaufvertrag und Auftrag', kind: 'replace', level: 'must', what: '„Komplettlieferung je Kaufvertrag“: Teillieferung ergänzen (Vertragsgrundlage beim Kunden).' },
      { file: 'leistungsbeschreibung', section: '4 Finanzbuchhaltung', kind: 'replace', level: 'must', what: 'Belegart TR ergänzen.' },
      { file: 'datenmodell-xlsx', section: 'Blatt Tabellen und Spalten', kind: 'table-rows', level: 'must', what: 'Tabelle lieferteil; Spalten lt_id in kv_position und tour_stopp.' },
      { file: 'architekturbild', section: 'Seite 1', kind: 'task', level: 'should', what: 'Datenfluss Lieferteil → Teilrechnung → fibu-export einzeichnen (PDF neu aus draw.io exportieren).' },
    ],
    notAffected: [{ file: 'installationshandbuch', why: 'Kein Schritt für Administratoren.' }],
  },
  gutschein: {
    expected: [
      { file: 'schulung-verkauf', section: 'Folie 3 „Gutscheine an der Kasse“', kind: 'replace', level: 'must', what: '„immer vollständig eingelöst“ und „neuer Gutschein“ sind falsch.' },
      { file: 'leistungsbeschreibung', section: '3 Kasse', kind: 'replace', level: 'must', what: '„vollständige Einlösung“ → Teileinlösung mit Restguthaben.' },
    ],
    notAffected: [],
  },
  ladevolumen: {
    expected: [{ file: 'parameterliste', section: 'Blatt Tour', kind: 'table-rows', level: 'must', what: 'TOUR_MAX_LADEVOLUMEN_M3 (38; 5–60 m³), TOUR_UEBERLADUNG_ERLAUBT (Ja).' }],
    notAffected: [],
  },
  lieferstopp: {
    expected: [
      { file: 'dlg-kaufvertrag-docx', section: '2 Register „Lieferung“ und Hinweis', kind: 'table-cell', level: 'must', what: 'Feld und Hinweis: „Lieferstopp“.' },
      { file: 'schulung-verkauf', section: 'Folie 2', kind: 'replace', level: 'must', what: '„Liefersperre setzen“ → „Lieferstopp setzen“.' },
    ],
    notAffected: [{ file: 'datenmodell-xlsx', why: 'Spalte heißt weiter liefersperre — Code-Bezeichner nicht umbenennen.' }],
  },
  kassenbelege: {
    expected: [],
    notAffected: [
      { file: 'schulung-verkauf', why: '„Tagesabschluss dauert einige Sekunden“ bleibt richtig.' },
      { file: 'installationshandbuch', why: 'Migration läuft automatisch.' },
    ],
  },
  druckvorlagen: {
    expected: [{ file: 'installationshandbuch', section: 'Seite 2, 4.2 Nach dem Update', kind: 'replace', level: 'must', what: '„.ftl-Vorlagen bleiben erhalten“ ist falsch: eigene Vorlagen mit „Vorlagen konvertieren“ umstellen.' }],
    notAffected: [{ file: 'leistungsbeschreibung', why: 'Belege sehen gleich aus.' }],
  },
  'avis-standard': {
    expected: [
      { file: 'parameterliste', section: 'Blatt Auftrag, LIEF_AVIS_STUNDEN', kind: 'table-cell', level: 'must', what: 'Standard 48 → 24.' },
      { file: 'leistungsbeschreibung', section: '2 Auslieferung', kind: 'replace', level: 'must', what: '„standardmäßig 48 Stunden“ → 24 Stunden.' },
    ],
    notAffected: [],
  },
}
