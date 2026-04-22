/**
 * Nettoie un objet avant envoi à Supabase :
 * - convertit les chaînes vides en null
 * - convertit naiss_annee / deces_annee en integer
 */
export function cleanPayload<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (v === '' || v === undefined) return [k, null]
      if ((k === 'naiss_annee' || k === 'deces_annee') && v !== null)
        return [k, parseInt(String(v))]
      return [k, v]
    })
  ) as T
}
