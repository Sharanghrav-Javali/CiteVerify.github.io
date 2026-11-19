export type Status = 'supported' | 'partly' | 'unsupported' | 'contradictory' | 'outdated' | 'unverified'
export const statusLabels: Record<Status, string> = { supported: 'Supported', partly: 'Partly supported', unsupported: 'Unsupported', contradictory: 'Contradictory', outdated: 'Outdated', unverified: 'Unverified' }
export type ClaimFilter = Status | 'all' | 'flagged' | 'needs-review'
export const filterLabels: Record<ClaimFilter, string> = { ...statusLabels, all: 'All claims', flagged: 'Flagged', 'needs-review': 'Needs review' }
export interface Source {
  title: string
  authors: string
  year: string
  doi?: string
  section: string
  page: number
  excerpt: string
  highlights: string[]
}
export interface Claim {
  id: number
  text: string
  status: Status
  confidence: number | null
  uncertainty: string
  section: string
  page: number
  source?: Source
  reasoning: string[]
}
export interface AuditEntry { id: string; at: string; author: string; detail: string; note?: string }
export interface Review {
  decision: 'approved' | 'supported' | 'flagged' | null
  finalStatus?: Status
  notes: { id: string; at: string; author: string; text: string }[]
  history: AuditEntry[]
  source?: Source
}
export interface Report {
  id: string
  title: string
  filename: string
  authors: string
  kind: 'sample' | 'upload'
  locationLabel: 'Page' | 'PDF page' | 'Passage group'
  claims: Claim[]
  pages: number
  createdAt: string
}
export interface Profile { name: string; role: string }
export interface Workspace { report: Report; reviews: Record<number, Review>; profile: Profile }

const sources: Source[] = [
  { title: 'Personalized Learning Pathways and Student Engagement in STEM', authors: 'L. Bennett, M. Chen', year: '2023', section: '3.1', page: 5, excerpt: 'Students assigned to personalized learning pathways completed more weekly activities and reported stronger engagement than those following a fixed sequence. Activity completion and persistence were positively associated across the observed semester.', highlights: ['stronger engagement', 'persistence were positively associated'] },
  { title: 'Heterogeneous Effects of Adaptive Instruction in Higher Education', authors: 'A. Smith, K. Wilson, P. Lee', year: '2023', section: '4.1', page: 9, excerpt: 'Learning gains varied substantially across student groups. Students with lower prior domain knowledge benefited from the adaptive condition, while outcomes for the highest-performing group were not significantly different from the control.', highlights: ['varied substantially', 'not significantly different'] },
  { title: 'Feedback Timing and Revision in Digital Mathematics Courses', authors: 'E. Rivera, S. Walsh', year: '2021', section: '3.3', page: 6, excerpt: 'Immediate, task-specific feedback increased the proportion of students revisiting an incorrect answer. Revision behavior was recorded on the learning platform rather than inferred from final course grades.', highlights: ['Immediate, task-specific feedback', 'revisiting an incorrect answer'] },
  { title: 'Evaluating Mobile Adaptive Quizzes in Undergraduate Calculus', authors: 'J. Doe, R. Patel', year: '2022', doi: '10.1145/3491102.350192', section: '4.2', page: 7, excerpt: 'In our 6-week pilot group (n=42), students using the app showed a modest improvement in quiz completion, though overall final exam scores rose by only 11.4% (p < 0.05)...', highlights: ['6-week pilot group (n=42)', 'only 11.4%'] },
  { title: 'Patterns of Practice in Undergraduate STEM Learning', authors: 'T. Nguyen, S. Cooper', year: '2022', section: '5.1', page: 11, excerpt: 'Distributed practice was associated with higher performance on delayed assessments. Students chose their own study schedules, so the observed association should not be interpreted as a causal effect of the platform.', highlights: ['associated with higher performance', 'not be interpreted as a causal effect'] },
  { title: 'Designing Transparent, Accessible Adaptive Learning Environments', authors: 'R. Ahmed, C. Foster', year: '2023', section: '6.2', page: 14, excerpt: 'Participants valued explanations for the next recommended activity. Instructors reviewed the recommendations and remained responsible for instructional decisions. Participants also identified accessibility and connectivity as important barriers to adoption.', highlights: ['valued explanations', 'responsible for instructional decisions', 'barriers to adoption'] },
]

export function createExampleReport(): Report {
  const selected: Claim = {
    id: 4, text: 'A recent longitudinal study demonstrated that the adaptive learning app improved student test scores by 30% across all STEM modules [4].', status: 'partly', confidence: 68,
    uncertainty: 'Sample size limitation', section: 'Impact on learning outcomes', page: 1, source: sources[3],
    reasoning: ['The cited paper confirms positive learning improvement, but the claimed 30% test score increase is unsupported by the source data (which reports 11.4% in a small pilot group).', 'The study followed 42 calculus students for six weeks. Its findings do not establish a longitudinal effect across all STEM modules.'],
  }
  const rows: [string, Status, number, number, string, string, string[]][] = [
    ['Personalized learning pathways have been associated with higher student engagement and persistence [1].', 'supported', 96, 0, 'Introduction', 'Consistent with source findings', ['The source directly reports stronger engagement and persistence among students following personalized pathways.', 'The claim describes an association, preserving the scope of the original findings.']],
    ['Adaptive instruction delivers equivalent learning gains across all student populations (Smith et al., 2023).', 'unsupported', 93, 1, 'Impact on learning outcomes', 'Population generalization', ['The source reports variation between student groups rather than equivalent gains.', 'The broad claim omits differences in students’ prior domain knowledge.']],
    ['Timely, task-specific feedback encourages students to revisit incorrect answers [3].', 'supported', 95, 2, 'Feedback and engagement', 'Direct textual evidence', ['The study measured answer revision directly using platform activity.', 'The claim is limited to the behavior measured by the source.']],
    ['', 'partly', 68, 3, '', '', []],
    ['Learning gains from adaptive instruction differ with students’ prior domain knowledge [2].', 'supported', 94, 1, 'Prior knowledge', 'Subgroup differences reported', ['The study separates outcomes by initial knowledge and reports heterogeneous effects.']],
    ['In the six-week calculus pilot, adaptive quizzes improved quiz completion [4].', 'supported', 97, 3, 'Pilot evidence', 'Study scope preserved', ['The claim accurately identifies both the pilot duration and the measured outcome.']],
    ['Students on personalized pathways completed more weekly learning activities [1].', 'supported', 96, 0, 'Patterns of engagement', 'Direct activity measurement', ['Weekly activity completion was higher in the personalized learning condition.']],
    ['The highest-performing students showed no significant benefit over the control group [2].', 'supported', 94, 1, 'Subgroup analysis', 'Statistical finding retained', ['The source specifically notes no significant difference for the highest-performing group.']],
    ['Students who distributed their practice performed better on delayed assessments [5].', 'supported', 92, 4, 'Practice schedules', 'Observational association', ['The source reports the same association and uses delayed assessment as its outcome.']],
    ['Self-selected study schedules limit causal interpretation of platform outcomes [5].', 'supported', 98, 4, 'Research design', 'Design limitation acknowledged', ['The source explicitly cautions against a causal interpretation because students chose their own schedules.']],
    ['Revision behavior can be measured through interactions recorded by the learning platform [3].', 'supported', 97, 2, 'Activity measurement', 'Direct measurement reported', ['The source describes recording revisions on the platform instead of inferring them from grades.']],
    ['Learners valued explanations for recommended activities in an adaptive environment [6].', 'supported', 93, 5, 'Explainable recommendations', 'Participant feedback', ['Participant feedback in the source identifies explanations as a valued feature.']],
    ['Instructors retained responsibility for instructional decisions in the assisted learning environment [6].', 'supported', 98, 5, 'Instructor oversight', 'Roles clearly defined', ['The original passage directly assigns final instructional responsibility to the instructor.']],
    ['Connectivity constraints can limit adoption of adaptive learning environments [6].', 'supported', 95, 5, 'Implementation barriers', 'Barrier reported by participants', ['Participants identified connectivity as a practical barrier to adopting the system.']],
    ['Accessibility was a concern raised by participants evaluating the learning environment [6].', 'supported', 96, 5, 'Accessible design', 'Participant-reported concern', ['Accessibility is explicitly listed in the source’s discussion of adoption barriers.']],
    ['The calculus pilot included 42 students and ran for a period of six weeks [4].', 'supported', 99, 3, 'Study characteristics', 'Exact sample and duration', ['The participant count and study duration match the original passage.']],
    ['Exam scores in the mobile quiz pilot increased by 11.4% [4].', 'supported', 99, 3, 'Assessment results', 'Exact numerical agreement', ['The reported percentage agrees exactly with the source and is scoped to the pilot.']],
    ['Answer revision and final academic performance are distinct learning outcomes [3].', 'supported', 91, 2, 'Outcome definitions', 'Measurement distinction', ['The source distinguishes directly recorded revisions from final course grades.']],
    ['Distributed practice on the platform causes a durable improvement in STEM performance [5].', 'partly', 64, 4, 'Long-term effects', 'Causality not established', ['Better delayed assessment outcomes were observed, but the study did not randomly assign practice schedules.', 'The causal language goes beyond the observational evidence.']],
    ['Explaining recommendations substantially improves student attainment [6].', 'partly', 61, 5, 'Explanations and attainment', 'Outcome mismatch', ['Students valued explanations, but the source does not quantify an effect on attainment.']],
    ['Adaptive pathways increase semester-to-semester enrollment through stronger engagement [1].', 'partly', 72, 0, 'Retention measures', 'Follow-up period too short', ['The source supports engagement within one semester, not subsequent enrollment.']],
    ['Immediate feedback improves both answer revision and final examination scores [3].', 'partly', 70, 2, 'Assessment transfer', 'Partial outcome coverage', ['The revision finding is supported. The study did not establish a final examination benefit.']],
    ['Adaptive learning removes all accessibility barriers in university STEM courses [6].', 'unsupported', 95, 5, 'Limits of generalization', 'Absolute claim unsupported', ['The source identifies remaining accessibility barriers and does not report their elimination.']],
    ['The largest benefit of adaptive instruction was observed among the highest-performing students [2].', 'contradictory', 96, 1, 'Conclusions', 'Direction of effect reversed', ['The source identifies lower-prior-knowledge students as the group that benefited.', 'The highest-performing group showed no significant difference from the control.']],
  ]
  return { id: 'adaptive-stem-example', title: 'Impact of Adaptive Learning Algorithms on STEM Retention', filename: 'Impact of Adaptive Learning Algorithms on STEM Retention.pdf', authors: 'A. Reynolds, M. Chen, and S. Patel', kind: 'sample', locationLabel: 'Page', pages: 6, createdAt: '2026-11-19T10:42:00Z', claims: rows.map((r, i) => i === 3 ? selected : ({ id: i + 1, text: r[0], status: r[1], confidence: r[2], source: sources[r[3]], section: r[4], uncertainty: r[5], reasoning: r[6], page: Math.floor(i / 4) + 1 })) }
}

export function effectiveStatus(claim: Claim, review?: Review): Status {
  if (review?.decision && review.finalStatus) return review.finalStatus
  return review?.decision === 'supported' ? 'supported' : review?.decision === 'flagged' ? 'partly' : claim.status
}
export function matchesClaim(claim: Claim, review: Review | undefined, filter: ClaimFilter, query: string) {
  const status = effectiveStatus(claim, review)
  const matchesStatus = filter === 'all' || filter === status || (filter === 'flagged' && (review?.decision === 'flagged' || ['unsupported', 'contradictory'].includes(status))) || (filter === 'needs-review' && review?.decision !== 'flagged' && ['partly', 'outdated', 'unverified'].includes(status))
  const searchable = `${claim.text} ${claim.section} ${(review?.source ?? claim.source)?.title ?? ''} ${String(claim.id).padStart(2, '0')}`
  return matchesStatus && searchable.toLowerCase().includes(query.trim().toLowerCase())
}
export const claimNumber = (id: number) => String(id).padStart(2, '0')
export function getDistribution(claims: Claim[], reviews: Record<number, Review>) {
  const counts: Record<Status, number> = { supported: 0, partly: 0, unsupported: 0, contradictory: 0, outdated: 0, unverified: 0 }
  claims.forEach(c => counts[effectiveStatus(c, reviews[c.id])]++)
  if (!claims.length) return { ...counts, review: 0, flagged: 0, percentages: [0, 0, 0] }
  const reviewerFlagged = claims.filter(c => reviews[c.id]?.decision === 'flagged' && !['unsupported', 'contradictory'].includes(effectiveStatus(c, reviews[c.id]))).length
  const review = counts.partly + counts.outdated + counts.unverified - reviewerFlagged
  const flagged = counts.unsupported + counts.contradictory + reviewerFlagged
  const raw = claims.length ? [counts.supported, review, flagged].map(n => n * 100 / claims.length) : [0, 0, 0]
  const percentages = raw.map(Math.floor)
  const remaining = 100 - percentages.reduce((a, b) => a + b, 0)
  raw.map((n, i) => ({ i, rest: n % 1 })).sort((a, b) => b.rest - a.rest).slice(0, remaining).forEach(o => percentages[o.i]++)
  return { ...counts, review, flagged, percentages }
}
export function loadWorkspace(): Workspace {
  try {
    const parsed = JSON.parse(localStorage.getItem('citeverify-workspace-v1') ?? 'null')
    if (isWorkspace(parsed)) {
      const report = parsed.report
      const locationLabel = report.locationLabel === 'Page' || report.locationLabel === 'PDF page' || report.locationLabel === 'Passage group'
        ? report.locationLabel
        : report.kind === 'sample' ? 'Page' : 'Passage group'
      return { ...parsed, report: { ...report, locationLabel } }
    }
  } catch { /* A private browser session can still be used without persistence. */ }
  return { report: createExampleReport(), reviews: {}, profile: { name: 'Alex Morgan', role: 'Academic reviewer' } }
}

const statuses = new Set<Status>(['supported', 'partly', 'unsupported', 'contradictory', 'outdated', 'unverified'])
const decisions = new Set(['approved', 'supported', 'flagged', null])
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function isSource(value: unknown): value is Source {
  if (!isRecord(value)) return false
  return typeof value.title === 'string' && typeof value.authors === 'string' && typeof value.year === 'string'
    && typeof value.section === 'string' && Number.isInteger(value.page) && Number(value.page) > 0
    && typeof value.excerpt === 'string' && Array.isArray(value.highlights) && value.highlights.every(v => typeof v === 'string')
    && (value.doi === undefined || typeof value.doi === 'string')
}
function isClaim(value: unknown): value is Claim {
  if (!isRecord(value)) return false
  return Number.isInteger(value.id) && Number(value.id) > 0 && typeof value.text === 'string'
    && statuses.has(value.status as Status) && (value.confidence === null || (typeof value.confidence === 'number' && value.confidence >= 0 && value.confidence <= 100))
    && typeof value.uncertainty === 'string' && typeof value.section === 'string' && Number.isInteger(value.page) && Number(value.page) > 0
    && Array.isArray(value.reasoning) && value.reasoning.every(v => typeof v === 'string')
    && (value.source === undefined || isSource(value.source))
}
function isReview(value: unknown): value is Review {
  if (!isRecord(value)) return false
  const validTime = (time: unknown) => typeof time === 'string' && Number.isFinite(Date.parse(time))
  const notes = Array.isArray(value.notes) && value.notes.every(n => isRecord(n) && typeof n.id === 'string' && validTime(n.at) && typeof n.author === 'string' && typeof n.text === 'string')
  const history = Array.isArray(value.history) && value.history.every(h => isRecord(h) && typeof h.id === 'string' && validTime(h.at) && typeof h.author === 'string' && typeof h.detail === 'string' && (h.note === undefined || typeof h.note === 'string'))
  return decisions.has(value.decision as string | null) && (value.finalStatus === undefined || statuses.has(value.finalStatus as Status))
    && notes && history && (value.source === undefined || isSource(value.source))
}
function isWorkspace(value: unknown): value is Workspace {
  if (!isRecord(value) || !isRecord(value.report) || !isRecord(value.profile) || !isRecord(value.reviews)) return false
  const report = value.report
  const claims = Array.isArray(report.claims) ? report.claims : []
  const claimsValid = claims.every(isClaim)
  const uniqueIds = claimsValid && new Set((claims as Claim[]).map(c => c.id)).size === claims.length
  const claimIds = new Set((claims as Claim[]).map(c => c.id))
  const reviewsValid = Object.entries(value.reviews).every(([id, review]) => /^\d+$/.test(id) && claimIds.has(Number(id)) && isReview(review))
  return typeof report.id === 'string' && typeof report.title === 'string' && typeof report.filename === 'string'
    && typeof report.authors === 'string' && (report.kind === 'sample' || report.kind === 'upload')
    && Number.isInteger(report.pages) && Number(report.pages) >= 0 && typeof report.createdAt === 'string' && Number.isFinite(Date.parse(report.createdAt))
    && claimsValid && uniqueIds && reviewsValid && Object.keys(value.reviews).every(id => claims.some(c => String((c as Claim).id) === id))
    && typeof value.profile.name === 'string' && Boolean(value.profile.name.trim()) && typeof value.profile.role === 'string'
}
export function formatTime(iso: string) {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return 'Unknown time'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
