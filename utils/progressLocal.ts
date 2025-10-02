// utils/progressLocal.ts
export type LocalProgress = Record<
  string,
  { chapterNumber: number | null; chapterId: number; updatedAt: string }
>

const KEY = 'reading_progress_v1'
const ANON_KEY = 'anon_id'

export function getAnonId() {
  if (typeof window === 'undefined') return ''
  const exist = localStorage.getItem(ANON_KEY)
  if (exist) return exist
  const newId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2)
  localStorage.setItem(ANON_KEY, newId)
  return newId
}

export function loadLocalProgress(): LocalProgress {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function saveLocalProgress(p: LocalProgress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function upsertLocalProgress(
  mangaId: number,
  chapterId: number,
  chapterNumber: number | null
) {
  const p = loadLocalProgress()
  const now = new Date().toISOString()
  p[mangaId] = { chapterNumber, chapterId, updatedAt: now }
  saveLocalProgress(p)
}
