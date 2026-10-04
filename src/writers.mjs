// Minimal writers for real office files, no dependencies:
//   docx / xlsx  = OOXML parts in a ZIP (stored, no compression)
//   pdf          = PDF 1.4 with Helvetica (WinAnsi), text, tables, boxes and arrows
// The files open in Word, Excel and any PDF viewer. Output is deterministic (fixed timestamps).

/* ------------------------------------------------------------------ */
/* ZIP                                                                 */
/* ------------------------------------------------------------------ */

const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export function zip(files, date = new Date('2026-07-01T10:00:00Z')) {
  const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1)
  const dosDate = ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate()
  const locals = []
  const centrals = []
  let offset = 0
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content, 'utf8')
    const nameBuf = Buffer.from(name, 'utf8')
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // UTF-8 names
    local.writeUInt16LE(0, 8) // stored
    local.writeUInt16LE(dosTime, 10)
    local.writeUInt16LE(dosDate, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    locals.push(local, nameBuf, data)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(dosTime, 12)
    central.writeUInt16LE(dosDate, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, nameBuf)
    offset += 30 + nameBuf.length + data.length
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 8)
  end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, ...centrals, end])
}

const x = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const coreXml = ({ title, author, modifiedBy, created, modified }) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(title)}</dc:title><dc:creator>${x(author)}</dc:creator><cp:lastModifiedBy>${x(modifiedBy)}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${modified}</dcterms:modified></cp:coreProperties>`

/* ------------------------------------------------------------------ */
/* DOCX                                                                */
/* ------------------------------------------------------------------ */

// blocks: { h1 } | { h2 } | { p } | { bullets: [] } | { table: { head, rows } } | { note }
export function docx(blocks, meta) {
  const run = (t, bold) => `<w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${x(t)}</w:t></w:r>`
  const para = (t, style) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${run(t)}</w:p>`
  const body = blocks
    .map((b) => {
      if (b.h1) return para(b.h1, 'Heading1')
      if (b.h2) return para(b.h2, 'Heading2')
      if (b.p) return para(b.p)
      if (b.note) return `<w:p><w:pPr><w:pStyle w:val="Hinweis"/></w:pPr>${run('Hinweis: ', true)}${run(b.note)}</w:p>`
      if (b.bullets) return b.bullets.map((t) => para('• ' + t, 'Liste')).join('')
      if (b.table) {
        const cell = (t, head) => `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>${head ? '<w:shd w:val="clear" w:color="auto" w:fill="E7EEFB"/>' : ''}</w:tcPr><w:p>${run(t, head)}</w:p></w:tc>`
        const border = '<w:top w:val="single" w:sz="4" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/>'
        return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${border}</w:tblBorders></w:tblPr><w:tr>${b.table.head.map((h) => cell(h, true)).join('')}</w:tr>${b.table.rows.map((r) => `<w:tr>${r.map((c) => cell(c)).join('')}</w:tr>`).join('')}</w:tbl><w:p/>`
      }
      return ''
    })
    .join('')
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
  return zip({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'word/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="de-DE"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="1D4ED8"/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Liste"><w:name w:val="Liste"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360"/><w:spacing w:after="40"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Hinweis"><w:name w:val="Hinweis"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="FFF4E5"/><w:ind w:left="120" w:right="120"/></w:pPr></w:style></w:styles>`,
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`,
    'docProps/core.xml': coreXml(meta),
  })
}

/* ------------------------------------------------------------------ */
/* XLSX                                                                */
/* ------------------------------------------------------------------ */

const colName = (i) => (i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26)))

// sheets: [{ name, rows: [[...]], widths?: [] }]; row 1 = header (bold, frozen)
export function xlsx(sheets, meta) {
  const sheetXml = (s) => {
    const rows = s.rows
      .map((r, ri) => {
        const cells = r
          .map((v, ci) => {
            const ref = `${colName(ci)}${ri + 1}`
            const style = ri === 0 ? ' s="1"' : ''
            if (v === '' || v === null || v === undefined) return ''
            if (typeof v === 'number') return `<c r="${ref}"${style}><v>${v}</v></c>`
            return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${x(v)}</t></is></c>`
          })
          .join('')
        return `<row r="${ri + 1}">${cells}</row>`
      })
      .join('')
    const cols = (s.widths ?? s.rows[0].map(() => 16)).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${rows}</sheetData><autoFilter ref="A1:${colName(s.rows[0].length - 1)}${s.rows.length}"/></worksheet>`
  }
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${x(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>${sheets.map((s, i) => `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${x(s.name)}'!$A$1:$${colName(s.rows[0].length - 1)}$${s.rows.length}</definedName></definedNames>`).slice(0, 1).join('')}</workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE7EEFB"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`,
    'docProps/core.xml': coreXml(meta),
  }
  sheets.forEach((s, i) => (files[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s)))
  return zip(files)
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

const WIN = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99 }
const winAnsi = (s) => {
  let out = ''
  for (const ch of String(s).replace(/→/g, '->').replace(/›/g, '>').replace(/≥/g, '>=').replace(/ /g, ' ')) {
    const code = WIN[ch] ?? ch.charCodeAt(0)
    const c = code > 255 ? 63 : code
    if (c === 40 || c === 41 || c === 92) out += '\\' + ch
    else if (c > 126 || c < 32) out += '\\' + c.toString(8).padStart(3, '0')
    else out += ch
  }
  return out
}
// Helvetica widths are ~0.5 em on average; good enough for wrapping.
const fits = (size, width) => Math.floor(width / (size * 0.52))
const wrap = (text, max) => {
  const lines = []
  let cur = ''
  for (const w of String(text).split(/\s+/)) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

/**
 * pages: [{ blocks, slide?, diagram? }]
 * blocks like docx, plus { title } for slides; diagram: { boxes: [{x,y,w,h,label}], arrows: [[x1,y1,x2,y2]] }
 */
export function pdf(pages, meta) {
  const landscape = pages.some((p) => p.slide)
  const W = landscape ? 842 : 595
  const H = landscape ? 595 : 842
  const M = landscape ? 60 : 56
  const streams = pages.map((page, pi) => {
    const ops = []
    let y = H - M
    const text = (t, x0, y0, size, bold, gray) => ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${gray ? '0.45 g' : '0 g'} ${x0} ${y0} Td (${winAnsi(t)}) Tj ET`)
    const lines = (t, size, bold, indent = 0, lead = 1.35) => {
      for (const l of wrap(t, fits(size, W - 2 * M - indent))) {
        text(l, M + indent, y, size, bold)
        y -= size * lead
      }
    }
    if (page.slide) {
      ops.push(`0.114 0.306 0.847 rg 0 ${H - 8} ${W} 8 re f 0 g`)
    }
    for (const b of page.blocks ?? []) {
      if (b.title) {
        y -= 10
        lines(b.title, 26, true)
        y -= 14
      } else if (b.h1) {
        y -= 8
        ops.push(`0.114 0.306 0.847 rg`)
        lines(b.h1, 18, true)
        ops.push('0 g')
        y -= 4
      } else if (b.h2) {
        y -= 6
        lines(b.h2, 13, true)
        y -= 2
      } else if (b.p) {
        lines(b.p, page.slide ? 16 : 10.5, false)
        y -= 6
      } else if (b.note) {
        const ls = wrap('Hinweis: ' + b.note, fits(10, W - 2 * M - 20))
        const h = ls.length * 13.5 + 10
        ops.push(`1 0.957 0.898 rg ${M} ${y - h + 10} ${W - 2 * M} ${h} re f 0 g`)
        for (const l of ls) {
          text(l, M + 10, y, 10, false)
          y -= 13.5
        }
        y -= 12
      } else if (b.bullets) {
        const size = page.slide ? 17 : 10.5
        for (const t of b.bullets) {
          const ls = wrap(t, fits(size, W - 2 * M - 22))
          text('•', M + 4, y, size, false)
          for (const l of ls) {
            text(l, M + 22, y, size, false)
            y -= size * (page.slide ? 1.5 : 1.4)
          }
          if (page.slide) y -= 6
        }
        y -= 6
      } else if (b.table) {
        const cols = b.table.head.length
        const widths = b.table.widths ?? Array(cols).fill(1)
        const total = widths.reduce((a, c) => a + c, 0)
        const cw = widths.map((w) => ((W - 2 * M) * w) / total)
        const size = 9
        const rows = [b.table.head, ...b.table.rows]
        rows.forEach((r, ri) => {
          const cellLines = r.map((c, ci) => wrap(c, fits(size, cw[ci] - 8)))
          const h = Math.max(...cellLines.map((l) => l.length)) * 11.5 + 8
          let x0 = M
          if (ri === 0) ops.push(`0.906 0.933 0.984 rg ${M} ${y - h + 11} ${W - 2 * M} ${h} re f 0 g`)
          ops.push(`0.75 G 0.5 w`)
          cellLines.forEach((ls, ci) => {
            ops.push(`${x0} ${y - h + 11} ${cw[ci]} ${h} re S`)
            ls.forEach((l, li) => text(l, x0 + 4, y - li * 11.5, size, ri === 0))
            x0 += cw[ci]
          })
          y -= h
        })
        y -= 14
      }
    }
    if (page.diagram) {
      ops.push('0.75 G 1 w')
      for (const bx of page.diagram.boxes) {
        ops.push(`${bx.fill ?? '0.95 0.96 0.99'} rg ${bx.x} ${bx.y} ${bx.w} ${bx.h} re B 0 g`)
        const ls = String(bx.label).split('\n')
        ls.forEach((l, i) => text(l, bx.x + 8, bx.y + bx.h / 2 + (ls.length - 1) * 6 - i * 12 - 3, 10, i === 0))
      }
      ops.push('0.3 G 1.2 w')
      for (const [x1, y1, x2, y2] of page.diagram.arrows) {
        const a = Math.atan2(y2 - y1, x2 - x1)
        const hx1 = x2 - 8 * Math.cos(a - 0.4)
        const hy1 = y2 - 8 * Math.sin(a - 0.4)
        const hx2 = x2 - 8 * Math.cos(a + 0.4)
        const hy2 = y2 - 8 * Math.sin(a + 0.4)
        ops.push(`${x1} ${y1} m ${x2} ${y2} l S ${x2} ${y2} m ${hx1.toFixed(1)} ${hy1.toFixed(1)} l ${hx2.toFixed(1)} ${hy2.toFixed(1)} l h f`)
      }
      for (const c of page.diagram.captions ?? []) text(c.text, c.x, c.y, 9, false, true)
    }
    text(`${meta.title} · Seite ${pi + 1} von ${pages.length}`, M, 28, 8, false, true)
    return ops.join('\n')
  })

  const objs = []
  const add = (s) => objs.push(s) // object number = index + 1
  add('<< /Type /Catalog /Pages 2 0 R >>')
  add('PAGES')
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const pageIds = []
  for (const s of streams) {
    const content = Buffer.from(s, 'latin1')
    add(`<< /Length ${content.length} >>\nstream\n${s}\nendstream`)
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${objs.length} 0 R >>`)
    pageIds.push(objs.length)
  }
  objs[1] = `<< /Type /Pages /Kids [${pageIds.map((i) => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  const d = meta.modified.replace(/[-:T]/g, '').slice(0, 14)
  add(`<< /Title (${winAnsi(meta.title)}) /Author (${winAnsi(meta.author)}) /Creator (Microsoft Word) /CreationDate (D:${d}) /ModDate (D:${d}) >>`)

  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
  const offsets = []
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'))
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(out, 'latin1')
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}
