import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, CircleHelp, X, type LucideIcon } from 'lucide-react'
import { statusLabels, type Status } from '../lib/report'

export function Logo() {
  return <svg className="brand-mark" width="35" height="39" viewBox="0 0 36 40" fill="none" aria-hidden="true"><path d="M18 1.5 33.1 7v11.8c0 8.8-6.2 15.1-15.1 19.6C9.1 33.9 2.9 27.6 2.9 18.8V7L18 1.5Z" fill="#5044D8" /><path d="M18 1.5 33.1 7v11.8c0 8.8-6.2 15.1-15.1 19.6V1.5Z" fill="#7263EF"/><path d="m9.9 18.7 5.3 5.4L26.8 12" stroke="white" strokeWidth="3.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
export function StatusBadge({ status, full = false }: { status: Status; full?: boolean }) {
  return <span className={`status-badge ${status}`}>{status === 'supported' ? <Check size={11} strokeWidth={2.7} /> : status === 'partly' ? <CircleHelp size={11} /> : <i className={`dot ${status}`} />}{statusLabels[status]}{full && status === 'partly' ? ' / Needs review' : ''}</span>
}
const graphLines = [
  'M1 38 C8 39 11 31 18 33 S29 29 35 30 S45 17 53 21 S63 25 70 18 S81 17 86 10 L94 5',
  'M1 39 C9 37 12 39 18 34 S30 37 37 28 S48 25 54 21 S65 25 72 16 S86 14 94 5',
  'M1 34 C8 35 10 27 17 27 S25 34 33 29 S44 19 51 22 S62 32 69 23 S80 20 85 16 L94 15',
  'M1 17 C8 17 10 21 18 19 S30 10 36 14 S46 28 53 23 S62 19 69 25 S81 30 86 26 L94 28',
]
export function MetricCard({ theme, icon: Icon, title, value, hint, graph, onClick }: { theme: string; icon: LucideIcon; title: string; value: number; hint: string; graph: number; onClick: () => void }) {
  const id = useId().replace(/:/g, '')
  const path = graphLines[graph]
  return <button className={`metric-card ${theme}`} onClick={onClick} title={`View ${title.toLowerCase()}`}><div className="metric-label"><span className="metric-icon"><Icon size={17} strokeWidth={1.8} /></span><span>{title}</span></div><div className="metric-bottom"><span className="metric-value">{value}</span><span className={graph === 0 ? 'metric-hint' : 'percentage-badge'}>{hint}</span></div><svg className="sparkline" viewBox="0 0 99 49" fill="none" aria-hidden="true"><defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop stopColor="currentColor" stopOpacity=".24" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><path d={`${path} L94 49 H1 Z`} fill={`url(#${id})`} /><path d={path} stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" /><circle cx="94" cy={[5, 5, 15, 28][graph]} r="2.9" fill="currentColor" stroke="white" strokeWidth="1.2" /></svg></button>
}
export function SectionTitle({ letter, title, children }: { letter: string; title: string; children?: ReactNode }) {
  return <div className="inspector-section-heading"><span className="section-letter">{letter}</span><h3>{title}</h3>{children && <span className="section-heading-extra">{children}</span>}</div>
}
export function Modal({ title, description, icon: Icon, onClose, children, className = '', hideHeader = false }: { title: string; description?: string; icon?: LucideIcon; onClose: () => void; children: ReactNode; className?: string; hideHeader?: boolean }) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = 'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]'
    const timeout = window.setTimeout(() => (root.current?.querySelector<HTMLElement>('[data-autofocus]') ?? root.current)?.focus(), 30)
    function keys(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current() }
      if (e.key === 'Tab') {
        const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>(focusable) ?? []).filter(el => el.offsetParent !== null)
        if (!nodes.length) return
        if (e.shiftKey && (document.activeElement === nodes[0] || document.activeElement === root.current)) { e.preventDefault(); nodes[nodes.length - 1].focus() }
        else if (!e.shiftKey && (document.activeElement === nodes[nodes.length - 1] || document.activeElement === root.current)) { e.preventDefault(); nodes[0].focus() }
      }
    }
    document.addEventListener('keydown', keys)
    return () => { window.clearTimeout(timeout); document.body.style.overflow = overflow; document.removeEventListener('keydown', keys); previous?.focus() }
  }, [])
  return createPortal(<div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={hideHeader ? undefined : id} aria-label={hideHeader ? title : undefined} tabIndex={-1} ref={root}>{!hideHeader && <div className="modal-heading"><div>{Icon && <span className="modal-icon"><Icon size={22} /></span>}<h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button close-modal" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>}{children}</div></div>, document.body)
}
