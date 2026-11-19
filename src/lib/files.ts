import { effectiveStatus, getDistribution, statusLabels, type Claim, type Report, type Review } from './report'

export async function readPaper(file: File, onProgress: (message: string) => void): Promise<Report> {
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose a document smaller than 15 MB.')
  const pdfFile = /\.pdf$/i.test(file.name)
  const textFile = /\.(txt|md)$/i.test(file.name)
  if (!pdfFile && !textFile) throw new Error('Please select a PDF, TXT, or Markdown document.')
  let extracted: { text: string; page: number }[] = []
  let pages = 0
  if (pdfFile) {
    onProgress('Reading PDF pages…')
    const pdfjs = await import('pdfjs-dist')
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    const pdf = await task.promise
    try {
      if (pdf.numPages > 150) throw new Error('This PDF has more than 150 pages. Split it into smaller sections before uploading.')
      pages = pdf.numPages
      for (let i = 1; i <= pdf.numPages; i++) {
        onProgress(`Reading page ${i} of ${pdf.numPages}…`)
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const text = content.items.map(item => 'str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : '').join('')
        extracted.push({ text, page: i })
      }
    } finally { await task.destroy() }
  } else {
    extracted = [{ text: await file.text(), page: 1 }]
  }
  if (extracted.reduce((total, item) => total + item.text.trim().length, 0) < 35) throw new Error('No readable passages found. For scanned PDFs, use a text-searchable PDF or upload a text file.')
  onProgress('Identifying candidate claims…')
  const candidates = extracted.flatMap(({ text, page }) => {
    const clean = text.replace(/-\n(?=[a-z])/g, '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim()
    if (!clean) return []
    const sentences = clean.replace(/\bet al\./gi, 'et al∯').replace(/\b(e\.g|i\.e)\./gi, '$1∯').replace(/\b(Dr|Prof|Mr|Ms)\./g, '$1∯').split(/(?<=[.!?])\s+(?=[A-Z(“"[])|\n\s*\n/).map(s => s.replace(/∯/g, '.').replace(/\s+/g, ' ').trim()).filter(s => s.length >= 35)
    return (sentences.length ? sentences : clean.length >= 35 ? [clean] : []).map(sentence => ({ text: sentence, page }))
  })
  const uniqueCandidates = [...new Map(candidates.map(candidate => [`${candidate.page}:${candidate.text}`, candidate])).values()]
  if (!uniqueCandidates.length) throw new Error('No candidate passages of 35 characters or more were found in this document.')
  const claims: Claim[] = uniqueCandidates.map(({ text, page }, i) => ({ id: i + 1, text: text.slice(0, 5000), status: 'unverified', confidence: null, uncertainty: 'Source evidence required', section: `Extracted passage ${i + 1}`, page: pdfFile ? page : Math.floor(i / 4) + 1, reasoning: ['This passage was extracted locally from the uploaded document. No independent source verification has been performed.', 'Attach an original source passage, compare the evidence, and record your review decision.'] }))
  const locationLabel = pdfFile ? 'PDF page' : 'Passage group'
  return { id: crypto.randomUUID(), title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '), filename: file.name, authors: 'Uploaded document', kind: 'upload', locationLabel, pages: pdfFile ? pages : Math.ceil(claims.length / 4), createdAt: new Date().toISOString(), claims }
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
    const payload = { schemaVersion: '1.0', application: 'CiteVerify', exportedAt: new Date().toISOString(), reviewer, document: report.filename, documentLocation: { label: report.locationLabel, pages: report.pages }, reportType: report.kind === 'sample' ? 'Illustrative example report' : 'Local human-review report', verificationNote: report.kind === 'sample' ? 'Demonstration data only; citations, confidence values, and assessments were not independently verified in this session.' : 'Claims were extracted locally. No external literature search was performed; source evidence and decisions are reviewer supplied.', summary: { total: report.claims.length, supported: dist.supported, needsReview: dist.review, flagged: dist.flagged }, claims: report.claims.map(c => ({ ...c, originalStatus: c.status, status: effectiveStatus(c, reviews[c.id]), source: reviews[c.id]?.source ?? c.source ?? null, review: reviews[c.id] ?? { decision: null, notes: [], history: [] } })) }
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
  if (report.kind === 'sample') line('Illustrative example report. Citations, confidence values, and assessment labels are demonstration data, not independently verified in this session.', 9, false, [100, 110, 130])
  else line('Local extraction only. No external literature search was performed; source evidence and decisions are reviewer supplied.', 9, false, [100, 110, 130])
  y += 3; line('Executive summary', 13, true)
  line(`${report.claims.length} claims extracted  |  ${dist.supported} supported  |  ${dist.review} need review  |  ${dist.flagged} flagged`)
  report.claims.forEach(c => {
    if (y > 218) newPage()
    y += 4; doc.setDrawColor(222, 225, 236); doc.line(margin, y, 191, y); y += 8
    const r = reviews[c.id], source = r?.source ?? c.source
    line(`Claim ${String(c.id).padStart(2, '0')}  /  ${statusLabels[effectiveStatus(c, r)]}`, 12, true, [79, 70, 180])
    line(`${report.locationLabel} ${c.page} · ${c.section}`, 9, false, [100, 110, 130])
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
