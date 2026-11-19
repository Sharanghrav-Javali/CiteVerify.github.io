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
export function MetricCard({ theme, icon: Icon, title, value, hint, onClick }: { theme: string; icon: LucideIcon; title: string; value: number; hint: string; onClick: () => void }) {
  return <button className={`metric-card ${theme}`} onClick={onClick} aria-label={`View ${title.toLowerCase()}: ${value}`} title={`View ${title.toLowerCase()}`}><div className="metric-label"><span className="metric-icon"><Icon size={17} strokeWidth={1.8} /></span><span>{title}</span></div><div className="metric-bottom"><span className="metric-value">{value}</span><span className={title === 'Total claims extracted' ? 'metric-hint' : 'percentage-badge'}>{hint}</span></div></button>
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
