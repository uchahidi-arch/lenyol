import type { Union, Person } from './types'

export type ReliabilityLevel = 'faible' | 'moyen' | 'élevé'

export interface UnionScore {
  score: number
  level: ReliabilityLevel
  label: string
}

export function computeUnionScore(union: Union, persons: Map<string, Person>): UnionScore {
  let score = 0

  const pere = union.pere_id ? persons.get(union.pere_id) ?? null : null
  const mere = union.mere_id ? persons.get(union.mere_id) ?? null : null

  if (union.pere_id) score += 20
  if (union.mere_id) score += 20
  if (union.enfants_ids.length > 0) score += 20
  if (pere?.naiss_annee) score += 10
  if (mere?.naiss_annee) score += 10

  // +10 if at least one child's birth year is coherent with at least one parent
  const parentYear = pere?.naiss_annee ?? mere?.naiss_annee ?? null
  if (parentYear) {
    const hasCoherentChild = union.enfants_ids.some(cid => {
      const child = persons.get(cid)
      if (!child?.naiss_annee) return false
      const diff = child.naiss_annee - parentYear
      return diff >= 12 && diff <= 70
    })
    if (hasCoherentChild) score += 10
  }

  // +10 if both parents have region or localite
  if (pere && mere) {
    if ((pere.region || pere.localite) && (mere.region || mere.localite)) score += 10
  }

  const level: ReliabilityLevel =
    score <= 40 ? 'faible' : score <= 70 ? 'moyen' : 'élevé'

  const label =
    level === 'élevé' ? 'Données complètes'
    : level === 'moyen' ? 'Quelques données manquantes'
    : 'Données insuffisantes'

  return { score, level, label }
}
