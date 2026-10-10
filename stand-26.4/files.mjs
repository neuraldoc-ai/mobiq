// The Word, Excel and PDF files after release 26.4 (release 27.10.2026, documentation updated after code freeze):
// the 26.3 definitions of src/files.mjs with every must and should item of data/ground-truth.json applied.
// Files with a version in their name get the new name; the installation manual moves to the folder Auslieferung/26.4.
import { files as before } from '../src/files.mjs'

const files = structuredClone(before)
const bySlug = (slug) => files.find((f) => f.slug === slug)
const sheet = (f, name) => f.sheets.find((s) => s.name === name)
const modified = '2026-10-12T10:00:00Z'

{
  const f = bySlug('parameterliste')
  Object.assign(f, { name: 'MOBIQ_Parameterliste_26.4.xlsx', title: 'MOBIQ Parameterliste 26.4', modified })
  const auftrag = sheet(f, 'Auftrag').rows
  auftrag.find((r) => r[0] === 'LIEF_AVIS_STUNDEN')[3] = 24
  auftrag.push(
    ['TEILLIEF_ERLAUBT', 'Lieferung', 'Teillieferungen im Mandanten erlauben', 'Nein', '', '', 'Ja/Nein', '26.4', 'ja'],
    ['TEILLIEF_MAX_ANZAHL', 'Lieferung', 'Höchstzahl Lieferteile je Kaufvertrag', 3, 2, 5, 'Teile', '26.4', 'ja'],
    ['TEILLIEF_MIN_WARENWERT_PROZ', 'Lieferung', 'Mindestanteil am Warenwert je Lieferteil', 20, 10, 90, '%', '26.4', 'ja'],
  )
  sheet(f, 'Tour').rows.push(
    ['TOUR_MAX_LADEVOLUMEN_M3', 'Tour', 'Ladevolumen für neu angelegte Fahrzeuge', 38, 5, 60, 'm³', '26.4', 'ja'],
    ['TOUR_UEBERLADUNG_ERLAUBT', 'Tour', 'Tour trotz Überladung speichern (mit Bestätigung)', 'Ja', '', '', 'Ja/Nein', '26.4', 'ja'],
  )
  sheet(f, 'Fibu').rows.push(['FIBU_BELEGART_TEILRECHNUNG', 'Fibu', 'Belegart für Teilrechnungen im Export', 'TR', '', '', 'Text', '26.4', 'nein'])
  sheet(f, 'Änderungshistorie').rows.splice(1, 0, ['26.4', '12.10.2026', 'TEILLIEF_ERLAUBT, TEILLIEF_MAX_ANZAHL, TEILLIEF_MIN_WARENWERT_PROZ, TOUR_MAX_LADEVOLUMEN_M3, TOUR_UEBERLADUNG_ERLAUBT und FIBU_BELEGART_TEILRECHNUNG neu; LIEF_AVIS_STUNDEN: Standard von 48 auf 24 Stunden', 'M. Thelen'])
}

{
  const f = bySlug('dlg-kaufvertrag-docx')
  Object.assign(f, { name: 'Dialogbeschreibung_Kaufvertrag_v8.docx', modified })
  const b = f.blocks
  b[1] = { p: 'Version 8 · gültig ab MOBIQ 26.4 · Verantwortlich: Fachberatung (M. Thelen)' }
  const lieferung = b.find((x) => x.table?.rows.some((r) => r[0] === 'Liefersperre')).table.rows
  lieferung.find((r) => r[0] === 'Liefersperre')[0] = 'Lieferstopp'
  lieferung.push(
    ['Teillieferung erlaubt', 'Checkbox', 'nein', 'Nur sichtbar, wenn TEILLIEF_ERLAUBT gesetzt ist und kein Finanzkauf vorliegt'],
    ['Lieferung aufteilen', 'Schaltfläche', '–', 'Öffnet den Dialog „Lieferung aufteilen“; aktiv, wenn „Teillieferung erlaubt“ gesetzt ist'],
  )
  const note = b.findIndex((x) => x.note)
  b[note] = { note: 'Ist der Lieferstopp gesetzt, erscheint der Kaufvertrag nicht in der Tourenplanung.' }
  const zahlung = b.findIndex((x) => x.h2 === '3 Register „Zahlung“')
  b[zahlung] = { h2: '4 Register „Zahlung“' }
  b.splice(zahlung, 0,
    { h2: '3 Dialog „Lieferung aufteilen“' },
    { p: 'Aufruf über die Schaltfläche „Lieferung aufteilen“ im Register „Lieferung“. Speichern ist erst möglich, wenn die Aufteilung gültig ist. Bei Finanzkauf ist keine Teillieferung möglich.' },
    { table: { head: ['Feld', 'Typ', 'Pflicht', 'Beschreibung'], rows: [
      ['Teil', 'Gruppe', '–', 'Teil 1, 2, … bis höchstens TEILLIEF_MAX_ANZAHL (Standard 3)'],
      ['Positionen', 'Liste (Drag & Drop)', 'ja', 'Positionen des Teils; per Drag & Drop zwischen den Teilen verschieben'],
      ['Warenwert-Anteil', 'Anzeige', '–', 'Anteil am Warenwert in %; Warnung unter TEILLIEF_MIN_WARENWERT_PROZ (Standard 20 %)'],
      ['Wunschtermin', 'KW-Auswahl', 'ja', 'Lieferwoche dieses Teils'],
    ] } },
  )
}

{
  const f = bySlug('installationshandbuch')
  Object.assign(f, { name: 'MOBIQ_Installationshandbuch_26.4.pdf', folder: 'Auslieferung/26.4', title: 'MOBIQ Installationshandbuch 26.4', created: modified, modified })
  f.pages[0].blocks[1] = { p: 'Version 26.4 · für Administratoren beim Kunden · Stand Oktober 2026' }
  const update = f.pages[1].blocks
  update[1] = { bullets: ['Sichern Sie die Datenbank.', 'Stoppen Sie die Dienste mobiq-app und mobiq-druck.', 'Führen Sie das Update-Paket aus. Migrationen laufen automatisch; V26_4_015 (Kassenbelege) dauert bei 4 Mio. Belegen ca. 4 Minuten.', 'Starten Sie die Dienste und prüfen Sie das Protokoll.'] }
  update[3] = { p: 'Prüfen Sie unter Administration › Systemstatus, ob alle Dienste laufen. Ab 26.4 druckt MOBIQ nur noch mit HTML-Vorlagen: Kundeneigene Druckvorlagen (.ftl) im Ordner vorlagen/kunde stellen Sie unter Administration › Vorlagen konvertieren um. Prüfen Sie danach je einen Probedruck von Rechnung, Lieferschein und Kaufvertrag.' }
}

{
  const f = bySlug('schulung-verkauf')
  Object.assign(f, { modified })
  f.pages[0].blocks[2] = { p: 'Stand 26.4 · Akademie Musterhaus' }
  f.pages[1].blocks[1] = { bullets: ['Wunschtermin als Kalenderwoche wählen', 'Ein Kaufvertrag wird komplett geliefert, außer eine Teillieferung ist vereinbart', 'Lieferstopp setzen, wenn der Kunde noch nicht bereit ist'] }
  f.pages.splice(2, 0, { slide: true, blocks: [{ title: 'Teillieferung vereinbaren' }, { bullets: ['Haken „Teillieferung erlaubt“ im Register Lieferung', '„Lieferung aufteilen“: Positionen per Drag & Drop auf bis zu 3 Teile', 'Je Teil ein Wunschtermin, mindestens 20 % des Warenwerts', 'Je Teil eine Teilrechnung, Anzahlung anteilig', 'Nicht bei Finanzkauf'] }] })
  f.pages[3].blocks[1] = { bullets: ['Gutschein scannen oder Nummer eingeben', 'Gutscheine lassen sich ganz oder teilweise einlösen', 'Restguthaben bleibt auf dem Gutschein und steht auf dem Bon'] }
}

{
  const f = bySlug('architekturbild')
  Object.assign(f, { modified })
  const page = f.pages[0]
  page.blocks[1] = { p: 'Stand 26.4 · Export aus draw.io (mobiq-gesamtsystem.drawio)' }
  page.diagram.captions.push({ text: 'Teillieferung: Lieferteil → Teilrechnung (TR) → fibu-export, mit verrechneter Anzahlung.', x: 70, y: 160 })
}

{
  const f = bySlug('leistungsbeschreibung')
  Object.assign(f, { modified })
  const b = f.blocks, list = (h) => b[b.findIndex((x) => x.h2 === h) + 1].bullets
  list('1 Kaufvertrag und Auftrag')[1] = 'Lieferung: Komplettlieferung je Kaufvertrag mit Wunschtermin (Kalenderwoche); auf Wunsch Teillieferung in bis zu 3 Teilen mit Teilrechnung je Teil (außer bei Finanzkauf)'
  list('2 Auslieferung')[1] = 'Avisierung per SMS oder E-Mail, standardmäßig 24 Stunden vor der Lieferung'
  list('3 Kasse')[1] = 'Gutscheine: Verkauf sowie vollständige oder teilweise Einlösung mit Restguthaben'
  list('4 Finanzbuchhaltung')[1] = 'Belegarten RE, TR (Teilrechnung), GS, AZ'
}

{
  const f = bySlug('datenmodell-xlsx')
  Object.assign(f, { name: 'Datenmodell_Auftragsabwicklung_26.4.xlsx', title: 'Datenmodell Auftragsabwicklung 26.4', modified })
  const tables = sheet(f, 'Tabellen').rows
  tables.find((r) => r[0] === 'kv_position')[2] = 'kvp_id, FK kv_id, FK lt_id'
  tables.find((r) => r[0] === 'tour_stopp')[2] = 'stopp_id, FK kv_id, FK lt_id'
  tables.push(['lieferteil', 'Teile einer Teillieferung', 'lt_id, FK kv_id', '26.4'])
  sheet(f, 'Spalten').rows.push(
    ['kv_position', 'lt_id', 'bigint', 'Lieferteil der Position, nur bei Teillieferung (seit 26.4)'],
    ['tour_stopp', 'lt_id', 'bigint', 'Lieferteil des Stopps, nur bei Teillieferung (seit 26.4)'],
    ['lieferteil', 'teil_nr', 'smallint', 'Nummer des Teils, eindeutig je Kaufvertrag (seit 26.4)'],
    ['lieferteil', 'wunsch_kw', 'char(7)', 'Wunsch-Kalenderwoche des Teils (seit 26.4)'],
    ['lieferteil', 'status', 'varchar(20)', 'Status des Teils, Standard ERFASST (seit 26.4)'],
  )
}

export { files }
