/**
 * Convertit une chaîne en slug URL-safe.
 * Ex : "Grande Comore (Ngazidja)" → "grande-comore-ngazidja"
 * Ex : "Bambao" → "bambao"
 */
export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les diacritiques
    .toLowerCase()
    .replace(/[()]/g, '')            // supprime parenthèses
    .replace(/[^a-z0-9]+/g, '-')    // remplace tout non-alphanumérique par -
    .replace(/^-|-$/g, '')           // trim les tirets en bord
}

/**
 * Trouve la valeur brute correspondant à un slug dans une liste.
 * Retourne undefined si aucun match.
 */
export function matchSlug<T extends string>(
  slug: string,
  candidates: T[]
): T | undefined {
  return candidates.find(c => slugify(c) === slug)
}
