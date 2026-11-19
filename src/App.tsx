import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, BookOpen, Check, CheckCheck, ChevronDown, CircleCheck, CloudCheck, Code2, FileJson, FileText, Flag, Info, Keyboard, Layers3, LoaderCircle, ScanLine, Search, ShieldCheck, SlidersHorizontal, Sparkles, UserRound, X } from 'lucide-react'
import { Logo, MetricCard, Modal } from './components/UI'
import { DocumentReader } from './components/DocumentReader'
import { EvidenceInspector } from './components/EvidenceInspector'
import { CompareDialog, NoteDialog, OverrideDialog, ProfileDialog, SourceDialog, UploadDialog, WorkflowDialog } from './components/Dialogs'
import { createExampleReport, effectiveStatus, getDistribution, loadWorkspace, matchesClaim, filterLabels as statusLabels, type Claim, type ClaimFilter, type Report, type Review } from './lib/report'
import { exportReport } from './lib/files'
import './App.css'

type Dialog = 'upload' | 'note' | 'override' | 'compare' | 'profile' | 'shortcuts' | 'workflow' | 'source' | null
const filters: ClaimFilter[] = ['all', 'supported', 'partly', 'unsupported', 'contradictory', 'outdated']
const steps = ['Upload', 'Extract', 'Retrieve', 'Compare', 'Report']

function getWorkflowStage(report: Report, reviews: Record<number, Review>) {
  if (report.kind === 'sample') return 4
  const reviewed = report.claims.some(claim => Boolean(reviews[claim.id]?.decision))
  if (reviewed) return 4
  const hasSources = report.claims.some(claim => Boolean(reviews[claim.id]?.source ?? claim.source))
  return hasSources ? 3 : 2
}

function App() {
  const [initial] = useState(loadWorkspace)
  const [report, setReport] = useState<Report>(initial.report)
  const [reviews, setReviews] = useState<Record<number, Review>>(initial.reviews)
  const [profile, setProfile] = useState(initial.profile)
  const [selectedId, setSelectedId] = useState(initial.report.kind === 'sample' ? 4 : 1)
  const [filter, setFilter] = useState<ClaimFilter>('all')
  const [query, setQuery] = useState('')
  const [readerTab, setReaderTab] = useState<'document' | 'index'>('document')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(false)
  const [mobilePane, setMobilePane] = useState<'document' | 'evidence'>('document')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [menu, setMenu] = useState<'export' | 'profile' | null>(null)
  const [workflowStep, setWorkflowStep] = useState(initial.report.kind === 'sample' ? 4 : 2)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')
  const [saved, setSaved] = useState(true)
  const searchRef = useRef<HTMLInputElement>(null)
  const topActionsRef = useRef<HTMLDivElement>(null)
  const counts = useMemo(() => getDistribution(report.claims, reviews), [report.claims, reviews])
  const visibleClaims = useMemo(() => report.claims.filter(c => matchesClaim(c, reviews[c.id], filter, query)), [report.claims, reviews, filter, query])
  const selected = visibleClaims.find(c => c.id === selectedId) ?? visibleClaims[0] ?? report.claims[0]
  const currentReview = selected ? reviews[selected.id] : undefined
  const workflowStage = getWorkflowStage(report, reviews)
  const reviewedCount = report.claims.filter(claim => Boolean(reviews[claim.id]?.decision)).length
  const workspaceLabel = report.kind === 'sample' ? 'Illustrative sample' : reviewedCount === report.claims.length && reviewedCount > 0 ? 'All reviewed · local' : reviewedCount ? `${reviewedCount} reviewed · local` : 'Unverified · local'
  const workspaceStateClass = report.kind === 'sample' ? 'sample' : reviewedCount === report.claims.length && reviewedCount > 0 ? 'reviewed' : 'pending'
  const activeFilters: ClaimFilter[] = [...filters, ...(counts.unverified > 0 ? ['unverified' as const] : []), ...(filter === 'flagged' || filter === 'needs-review' ? [filter] : [])]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem('citeverify-workspace-v1', JSON.stringify({ report, reviews, profile }))
        setSaved(true)
      } catch { setSaved(false) }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [report, reviews, profile])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!topActionsRef.current?.contains(e.target as Node)) setMenu(null)
    }
    function handleKeys(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (!dialog) searchRef.current?.focus()
      }
      if (e.key === 'Escape') { setMenu(null); setExpanded(false) }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKeys)
    return () => { document.removeEventListener('mousedown', handleOutside); document.removeEventListener('keydown', handleKeys) }
  }, [dialog])

  const closeDialog = useCallback(() => setDialog(null), [])
  const selectClaim = (claim: Claim, fromReader = true) => {
    setSelectedId(claim.id)
    setPage(claim.page)
    if (fromReader) {
      setMobilePane('evidence')
      if (window.innerWidth <= 760 && !expanded) requestAnimationFrame(() => document.querySelector('.workspace')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
    }
  }
  function changeFilter(next: ClaimFilter) {
    setFilter(next)
    setReaderTab(next === 'all' && !query ? 'document' : 'index')
    const matching = report.claims.filter(c => matchesClaim(c, reviews[c.id], next, query))
    if (matching.length && !matching.some(c => c.id === selectedId)) selectClaim(matching[0], false)
    setMobilePane('document')
  }
  function search(value: string) {
    setQuery(value)
    setReaderTab(value || filter !== 'all' ? 'index' : 'document')
    setMobilePane('document')
  }
  function replaceReport(next: Report) {
    setReport(next); setReviews({}); setSelectedId(next.kind === 'sample' ? 4 : 1)
    setPage(1); setFilter('all'); setQuery(''); setReaderTab('document'); setDialog(null); setMobilePane('document'); setWorkflowStep(next.kind === 'sample' ? 4 : 2)
    setToast(next.kind === 'sample' ? 'Example verification report opened.' : `${next.claims.length} candidate claims extracted. Ready for source review.`)
  }
  function recordReview(action: 'approved' | 'supported' | 'flagged' | 'note' | 'reset', note = '') {
    if (!selected) return
    const before = currentReview ?? { decision: null, notes: [], history: [] }
    const at = new Date().toISOString()
    const id = crypto.randomUUID()
    const detail = action === 'note' ? 'Added a reviewer note' : action === 'supported' ? 'Overrode the finding as supported' : action === 'flagged' ? 'Marked the claim for further review' : action === 'reset' ? 'Restored the original assessment' : effectiveStatus(selected, before) === 'supported' ? 'Confirmed the supporting evidence' : 'Approved the verification flag'
    const finalStatus = action === 'supported' ? 'supported' : action === 'flagged' ? 'partly' : action === 'reset' ? undefined : effectiveStatus(selected, before)
    setReviews(prev => ({ ...prev, [selected.id]: { ...before, finalStatus, decision: action === 'note' ? before.decision : action === 'reset' ? null : action, history: [{ id, at, author: profile.name, detail, note }, ...before.history], notes: note ? [{ id, at, author: profile.name, text: note }, ...before.notes] : before.notes } }))
    setDialog(null)
    setToast(action === 'note' ? 'Reviewer note saved to the audit trail.' : 'Review decision saved. Report updated.')
  }
  async function download(format: 'pdf' | 'json') {
    setMenu(null); setExporting(true)
    try { await exportReport(format, report, reviews, profile.name); setToast(`${format.toUpperCase()} verification report downloaded.`) }
    catch { setToast('The download could not be prepared. Please try again.') }
    finally { setExporting(false) }
  }
  function switchReaderTab(tab: 'document' | 'index') {
    setReaderTab(tab)
    if (tab === 'document') { setFilter('all'); setQuery('') }
  }
  const reader = <DocumentReader report={report} reviews={reviews} selected={selected} visibleClaims={visibleClaims} onSelect={selectClaim} tab={readerTab} onTab={switchReaderTab} page={page} onPage={setPage} expanded={expanded} onExpand={() => setExpanded(v => !v)} onClear={() => { setQuery(''); changeFilter('all'); setReaderTab('index') }} query={query} filter={filter} />

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="topbar shell-width">
          <div className="brand-group"><div className="brand" aria-label="CiteVerify"><Logo /><span>CiteVerify</span></div><span className="brand-divider" /><span className="hackathon-badge"><Sparkles size={12} />Hackathon 2026</span></div>
          <div className="top-actions" ref={topActionsRef}>
            <button className="button secondary upload-button" aria-label="Upload new paper" onClick={() => { setMenu(null); setDialog('upload') }}><ArrowUpFromLine size={15} /><span>Upload new paper</span></button>
            <div className="menu-anchor"><button className="button primary export-button" aria-label="Export verification report" aria-expanded={menu === 'export'} onClick={() => setMenu(menu === 'export' ? null : 'export')} disabled={exporting}>{exporting ? <LoaderCircle className="spin" size={15} /> : <ArrowDownToLine size={15} />}<span>Export report</span><ChevronDown size={13} /></button>
              {menu === 'export' && <div className="dropdown export-menu"><div className="menu-eyebrow">DOWNLOAD REPORT</div><button onClick={() => download('pdf')}><span className="menu-icon"><FileText size={17} /></span><span><strong>PDF report</strong><small>Formatted for reading and sharing</small></span><ArrowDownToLine size={14} /></button><button onClick={() => download('json')}><span className="menu-icon"><FileJson size={17} /></span><span><strong>JSON data</strong><small>Claims, evidence, and review history</small></span><Code2 size={14} /></button></div>}
            </div>
            <span className="action-divider" />
            <div className="menu-anchor"><button className="avatar-button" aria-label="Open reviewer profile" aria-expanded={menu === 'profile'} onClick={() => setMenu(menu === 'profile' ? null : 'profile')}><img src="/images/reviewer.jpg" alt="" /><span className="online-dot" /></button>
              {menu === 'profile' && <div className="dropdown profile-menu"><div className="profile-identity"><img src="/images/reviewer.jpg" alt="" /><span><strong>{profile.name}</strong><small>{profile.role}</small></span></div><button onClick={() => { setMenu(null); setDialog('profile') }}><UserRound size={16} />Reviewer profile</button><button onClick={() => { setMenu(null); setDialog('shortcuts') }}><Keyboard size={16} />Keyboard shortcuts</button><div className="menu-foot"><CloudCheck size={13} />Local research workspace</div></div>}
            </div>
          </div>
        </div>
        <div className="document-bar"><div className="document-bar-inner shell-width"><div className="current-document"><span className="file-tile"><FileText size={22} strokeWidth={1.6} /></span><div><span className="eyebrow">CURRENT DOCUMENT</span><p title={report.filename}>{report.filename}</p></div></div>
          <nav className="workflow" aria-label="Verification workflow">{steps.map((step, i) => {
            const illustrative = report.kind === 'sample' && (i === 2 || i === 3)
            const complete = report.kind === 'sample' ? i < 2 : i < workflowStage
            return <div className="workflow-item" key={step}>{i > 0 && <span className="step-connector" />}<button className={`workflow-step ${i === workflowStage ? 'current' : ''} ${illustrative ? 'illustrative' : ''}`} onClick={() => { setWorkflowStep(i); setDialog('workflow') }} aria-label={`${step}: view stage details`} aria-current={i === workflowStage ? 'step' : undefined}><span className="step-number">{complete ? <Check size={11} strokeWidth={2.6} /> : illustrative ? 'i' : i + 1}</span><span>{step}</span></button></div>
          })}</nav>
        </div></div>
      </header>

      <main className="main-content shell-width">
        <section className="overview" aria-labelledby="overview-title"><div className="overview-heading"><div><div className="section-kicker"><span />RESEARCH WORKSPACE</div><h1 id="overview-title">Verification overview</h1><p>Review extracted claims, original passages, and human decisions in one workspace.</p></div><span className={`completion-chip ${workspaceStateClass}`}><span className="status-dot" />{workspaceLabel}</span></div>
          {report.kind === 'sample' ? <div className="report-notice" role="note"><Info size={15} /><p><strong>Illustrative sample data.</strong> Example citations, evidence scores, and assessment labels are demonstration content, not independently verified in this session. Uploaded claims stay unverified until a reviewer supplies source evidence.</p></div> : <div className="report-notice" role="note"><Info size={15} /><p><strong>Local extraction only.</strong> No source search or independent verification has happened. Attach an original passage and record a human decision to review each candidate claim.</p></div>}
          <div className="metrics-grid"><MetricCard theme="indigo" icon={Layers3} title="Total claims extracted" value={report.claims.length} hint="claims" onClick={() => { setQuery(''); setFilter('all'); setReaderTab('index'); setMobilePane('document') }} /><MetricCard theme="green" icon={CircleCheck} title="Supported claims" value={counts.supported} hint={`${counts.percentages[0]}%`} onClick={() => changeFilter('supported')} /><MetricCard theme="amber" icon={ScanLine} title="Needs review" value={counts.review} hint={`${counts.percentages[1]}%`} onClick={() => changeFilter('needs-review')} /><MetricCard theme="rose" icon={Flag} title="Flagged claims" value={counts.flagged} hint={`${counts.percentages[2]}%`} onClick={() => changeFilter('flagged')} /></div>
        </section>
        <section className="filter-bar" aria-label="Filter and search claims"><div className="filter-pills"><SlidersHorizontal className="filter-symbol" size={16} />{activeFilters.map(f => <button key={f} onClick={() => changeFilter(f)} aria-pressed={filter === f} className={`filter-pill ${filter === f ? 'active' : ''} ${f}`}>{f !== 'all' && <i className={`dot ${f}`} />}{f === 'all' ? 'All claims' : statusLabels[f]}{f === 'all' && <span className="filter-count">{report.claims.length}</span>}</button>)}</div><div className="search-box"><Search size={15} /><input ref={searchRef} value={query} onChange={e => search(e.target.value)} placeholder="Search claims or sources" aria-label="Search claims" />{query ? <button className="clear-search" aria-label="Clear search" onClick={() => search('')}><X size={13} /></button> : <kbd>Ctrl / ⌘ K</kbd>}</div></section>
        <div className="mobile-workspace-tabs" role="tablist" aria-label="Workspace panel"><button role="tab" aria-selected={mobilePane === 'document'} className={mobilePane === 'document' ? 'active' : ''} onClick={() => setMobilePane('document')}><BookOpen size={15} />Document</button><button role="tab" aria-selected={mobilePane === 'evidence'} className={mobilePane === 'evidence' ? 'active' : ''} onClick={() => setMobilePane('evidence')}><ScanLine size={15} />Evidence inspector</button></div>
        <section className={`workspace mobile-${mobilePane}`} aria-label="Claim verification workspace"><div className="reader-column">{!expanded && reader}</div><div className="inspector-column">{visibleClaims.length && selected ? <EvidenceInspector key={`${report.id}-${selected.id}`} claim={selected} reportKind={report.kind} locationLabel={report.locationLabel} total={report.claims.length} review={currentReview} onNote={() => setDialog('note')} onApprove={() => recordReview('approved')} onOverride={() => setDialog('override')} onFlag={() => recordReview('flagged')} onReset={() => recordReview('reset')} onCompare={() => setDialog('compare')} onSource={() => setDialog('source')} onNavigate={direction => { const index = visibleClaims.findIndex(c => c.id === selected.id); selectClaim(visibleClaims[(index + direction + visibleClaims.length) % visibleClaims.length], false) }} canNavigate={visibleClaims.length > 1} /> : <section className="panel"><div className="panel-header"><div className="panel-title"><ScanLine size={17} /><h2>Evidence inspector</h2></div></div><div className="empty-state"><span><BookOpen size={25} /></span><h4>No claim to inspect</h4><p>{report.claims.length ? 'Change your filters or search to explore matching evidence.' : 'Upload a paper to extract candidate claims for review.'}</p></div></section>}</div></section>
        <footer className="app-footer"><span><ShieldCheck size={14} />CiteVerify <i />Evidence-informed, human-reviewed.</span><span><CloudCheck size={14} />{saved ? 'All changes saved locally' : 'Session only · browser storage unavailable'}</span></footer>
      </main>

      {expanded && <Modal className="expanded-reader-modal" title="Expanded document reader" onClose={() => setExpanded(false)} hideHeader>{reader}</Modal>}
      {dialog === 'upload' && <UploadDialog onClose={closeDialog} onLoad={replaceReport} onExample={() => replaceReport(createExampleReport())} />}
      {dialog === 'note' && selected && <NoteDialog claim={selected} onClose={closeDialog} onSave={text => recordReview('note', text)} />}
      {dialog === 'override' && selected && <OverrideDialog claim={selected} onClose={closeDialog} onConfirm={text => recordReview('supported', text)} />}
      {dialog === 'compare' && selected && <CompareDialog claim={selected} reportKind={report.kind} locationLabel={report.locationLabel} source={currentReview?.source ?? selected.source} onClose={closeDialog} />}
      {dialog === 'source' && selected && <SourceDialog claim={selected} source={currentReview?.source ?? selected.source} onClose={closeDialog} onSave={source => { const before = reviews[selected.id] ?? { decision: null, notes: [], history: [] }; setReviews(prev => ({ ...prev, [selected.id]: { ...before, source, history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), author: profile.name, detail: 'Attached a source passage' }, ...before.history] } })); setDialog(null); setToast('Source attached. Review the passages to make a decision.') }} />}
      {dialog === 'profile' && <ProfileDialog profile={profile} onClose={closeDialog} onSave={next => { setProfile(next); setDialog(null); setToast('Reviewer profile updated.') }} />}
      {dialog === 'workflow' && <WorkflowDialog step={workflowStep} report={report} onStep={setWorkflowStep} onClose={closeDialog} />}
      {dialog === 'shortcuts' && <Modal title="Keyboard shortcuts" description="Move through your research workspace." icon={Keyboard} onClose={closeDialog}><div className="shortcut-list"><div><span>Search claims</span><kbd>Ctrl / ⌘ + K</kbd></div><div><span>Close a dialog or menu</span><kbd>Esc</kbd></div><div><span>Move between controls</span><kbd>Tab</kbd></div><div><span>Select a focused claim</span><kbd>Enter</kbd></div></div></Modal>}
      {toast && <div className="toast" role="status"><CheckCheck size={17} /><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={14} /></button></div>}
    </div>
  )
}

export default App
