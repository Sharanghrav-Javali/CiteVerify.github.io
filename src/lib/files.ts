import { effectiveStatus, getDistribution, statusLabels, type Claim, type Report, type Review } from './report'

export async function readPaper(file: File, onProgress: (message: string) => void): Promise<Report> {
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose a document smaller than 15 MB.')
  let text = ''
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    onProgress('Reading PDF pages…')
    const pdfjs = await import('pdfjs-dist')
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    const pdf = await task.promise
    try {
      for (let i = 1; i <= Math.min(pdf.numPages, 150); i++) {
        onProgress(`Reading page ${i} of ${Math.min(pdf.numPages, 150)}…`)
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map(item => 'str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : '').join('') + '\n\n'
      }
    } finally { await task.destroy() }
  } else if (/\.(txt|md)$/i.test(file.name)) { text = await file.text() }
  else throw new Error('Please select a PDF, TXT, or Markdown document.')
  if (text.trim().length < 35) throw new Error('No readable passages found. For scanned PDFs, use a text-searchable PDF or upload a text file.')
  onProgress('Identifying candidate claims…')
  const clean = text.replace(/-\n(?=[a-z])/g, '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim()
  const sentences = clean.replace(/\bet al\./gi, 'et al∯').replace(/\b(e\.g|i\.e)\./gi, '$1∯').replace(/\b(Dr|Prof|Mr|Ms)\./g, '$1∯').split(/(?<=[.!?])\s+(?=[A-Z(“"[])|\n\s*\n/).map(s => s.replace(/∯/g, '.').replace(/\s+/g, ' ').trim()).filter(s => s.length >= 35)
  const deduplicated = [...new Set(sentences.length ? sentences : [clean])].slice(0, 200)
  const claims: Claim[] = deduplicated.map((s, i) => ({ id: i + 1, text: s.slice(0, 5000), status: 'unverified', confidence: null, uncertainty: 'Source evidence required', section: `Extracted passage ${i + 1}`, page: Math.floor(i / 4) + 1, reasoning: ['This passage was extracted locally from the uploaded document. No independent source verification has been performed.', 'Attach an original source passage, compare the evidence, and record your review decision.'] }))
  return { id: crypto.randomUUID(), title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '), filename: file.name, authors: 'Uploaded document', kind: 'upload', pages: Math.ceil(claims.length / 4), createdAt: new Date().toISOString(), claims }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename
  document.body.appendChild(anchor); anchor.click(); anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function exportReport(format: 'pdf' | 'json', report: Report, reviews: Record<number, Review>, reviewer: string) {
  const name = `CiteVerify-${report.title.replace(/[^a-z0-9 -]/gi, '').slice(0, 75).replace(/\s+/g, '-')}`
  const dist = getDistribution(report.claims, reviews)
  if (format === 'json') {
    const payload = { schemaVersion: '1.0', application: 'CiteVerify', exportedAt: new Date().toISOString(), reviewer, document: report.filename, reportType: report.kind === 'sample' ? 'Illustrative example report' : 'Local human-review report', summary: { total: report.claims.length, supported: dist.supported, needsReview: dist.review, flagged: dist.flagged }, claims: report.claims.map(c => ({ ...c, originalStatus: c.status, status: effectiveStatus(c, reviews[c.id]), source: reviews[c.id]?.source ?? c.source ?? null, review: reviews[c.id] ?? { decision: null, notes: [], history: [] } })) }
    saveBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${name}.json`)
    return
  }
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 19, width = 172
  let y = 22
  const newPage = () => { doc.addPage(); y = 22 }
  const line = (text: string, size = 10, bold = false, color: [number, number, number] = [38, 47, 64], gap = 3) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color)
    const rows: string[] = doc.splitTextToSize(text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/—/g, ' - '), width)
    rows.forEach(row => { if (y > 274) newPage(); doc.text(row, margin, y); y += size * 0.45 })
    y += gap
  }
  line('CiteVerify', 23, true, [79, 70, 229], 4)
  line('Scientific claim verification report', 16, true)
  line(report.title, 12, false)
  line(`Reviewer: ${reviewer}  |  Exported: ${new Date().toLocaleDateString()}`, 9, false, [100, 110, 130])
  if (report.kind === 'sample') line('Illustrative example report. The included academic excerpts are demonstration data.', 9, false, [100, 110, 130])
  y += 3; line('Executive summary', 13, true)
  line(`${report.claims.length} claims extracted  |  ${dist.supported} supported  |  ${dist.review} need review  |  ${dist.flagged} flagged`)
  report.claims.forEach(c => {
    if (y > 218) newPage()
    y += 4; doc.setDrawColor(222, 225, 236); doc.line(margin, y, 191, y); y += 8
    const r = reviews[c.id], source = r?.source ?? c.source
    line(`Claim ${String(c.id).padStart(2, '0')}  /  ${statusLabels[effectiveStatus(c, r)]}`, 12, true, [79, 70, 180])
    line(c.text, 10)
    line(`Evidence confidence: ${c.confidence == null ? 'Not assessed' : `${c.confidence}%`}  |  ${c.uncertainty}`, 9)
    if (source) { line('Matched original source', 10, true); line(`${source.title} — ${source.authors} (${source.year || 'year not supplied'})`, 9); if (source.doi) line(`DOI: ${source.doi}`, 9); line(`Section ${source.section}, page ${source.page}: "${source.excerpt}"`, 9) }
    line('Assessment', 10, true); c.reasoning.forEach(t => line(`- ${t}`, 9))
    line(`Reviewer decision: ${r?.decision ?? 'Pending human review'}`, 9, true)
    r?.history.forEach(h => line(`${new Date(h.at).toLocaleString()} / ${h.author}: ${h.detail}${h.note ? ` — ${h.note}` : ''}`, 8))
  })
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(126, 135, 152); doc.text('CiteVerify  /  Research verification workspace', margin, 287); doc.text(`${i} / ${pageCount}`, 191, 287, { align: 'right' }) }
  doc.save(`${name}.pdf`)
}
