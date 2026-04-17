import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export type RelierRole = 'pere' | 'mere' | 'conjoint' | 'enfant' | 'same'

export interface Person {
  id: string
  prenom: string
  nom?: string | null
  genre?: string | null
  clan?: string | null
  prefix_lignee?: string | null
  localite?: string | null
  owner_id?: string | null
  created_by_name?: string | null
}

export interface Union {
  id: string
  pere_id?: string | null
  mere_id?: string | null
  enfants_ids: string[]
  owner_id?: string
  created_by_name?: string | null
}

interface UseRelierProps {
  currentUserId: string
  currentUserName: string
  myPersons: Person[]
  myUnions: Union[]
  allUnions: Union[]
  onSuccess: () => Promise<void>
}

export function useRelier({
  currentUserId,
  currentUserName,
  myPersons,
  myUnions,
  allUnions,
  onSuccess,
}: UseRelierProps) {
  const supa = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Récupère l'union parente d'une personne dans mon arbre
  const getParentOf = (personId: string): Union | null => {
    return allUnions.find(u => u.enfants_ids?.includes(personId)) ?? null
  }

  // Récupère les unions où une personne est parent
  const getUnionsOf = (personId: string): Union[] => {
    return allUnions.filter(u => u.pere_id === personId || u.mere_id === personId)
  }

  // 🎯 Garbage Collector — analyse la branche à supprimer lors d'une fusion
  const analyzeTrash = (startPersonId: string): Person[] => {
    const toDelete: Person[] = []
    let currentId: string | null = startPersonId

    while (currentId) {
      const p = myPersons.find(x => x.id === currentId)
      if (!p || p.owner_id !== currentUserId) break // Limite 1 : propriété

      toDelete.push(p)

      const parentUnion = getParentOf(currentId)
      if (!parentUnion) break

      // Limite 2 : enfant unique
      if (parentUnion.enfants_ids && parentUnion.enfants_ids.length > 1) break

      const nextParentId = parentUnion.pere_id || parentUnion.mere_id || null
      if (!nextParentId) break

      // Limite 3 : conjoint avec autre famille
      const otherParentId = nextParentId === parentUnion.pere_id
        ? parentUnion.mere_id
        : parentUnion.pere_id

      if (otherParentId) {
        const otherParentUnions = getUnionsOf(otherParentId)
        if (otherParentUnions.length > 1) break
      }

      currentId = nextParentId
    }

    return toDelete
  }

  const confirm = async (
    myPersonId: string,
    targetPerson: Person,
    role: RelierRole,
    myPerson: Person
  ): Promise<{ success: boolean; message: string }> => {
    setLoading(true)
    setError(null)

    try {
      // 🔄 FUSION INTELLIGENTE
      if (role === 'same') {
        const trashBin = analyzeTrash(myPersonId)
        const namesToDelete = trashBin.map(p => `${p.prenom} ${p.nom ?? ''}`).join(', ')

        const confirmed = window.confirm(
          `Attention ! Vous allez remplacer votre fiche par la fiche publique.\n\nLes fiches suivantes seront SUPPRIMÉES définitivement :\n- ${namesToDelete}\n\nVos conjoints et frères/sœurs seront automatiquement rattachés à la nouvelle fiche.\n\nConfirmez-vous la fusion ?`
        )
        if (!confirmed) { setLoading(false); return { success: false, message: '' } }

        // 1. Transférer les unions où myPerson est parent
        const myUnionsAsParent = getUnionsOf(myPersonId)
        for (const u of myUnionsAsParent) {
          const updateData: Partial<Union> = {}
          if (u.pere_id === myPersonId) updateData.pere_id = targetPerson.id
          if (u.mere_id === myPersonId) updateData.mere_id = targetPerson.id
          await supa.from('unions').update(updateData).eq('id', u.id)
        }

        // 2. Transférer dans l'union parente
        const parentUnion = getParentOf(myPersonId)
        if (parentUnion) {
          const newKids = parentUnion.enfants_ids.map(id => id === myPersonId ? targetPerson.id : id)
          await supa.from('unions').update({ enfants_ids: newKids }).eq('id', parentUnion.id)
        }

        // 3. Garbage Collector
        for (const p of trashBin) {
          const unionsToClean = getUnionsOf(p.id)
          for (const u of unionsToClean) {
            await supa.from('unions').delete().eq('id', u.id)
          }
          await supa.from('persons').delete().eq('id', p.id)
        }

        await onSuccess()
        setLoading(false)
        return { success: true, message: 'Fusion réussie et arbre nettoyé !' }
      }

      // 🎯 COMPORTEMENT NORMAL
      let newUnion: Partial<Union> | null = null

      if (role === 'pere') {
        const existingParent = getParentOf(myPersonId)
        if (existingParent?.pere_id) {
          setLoading(false)
          return { success: false, message: 'Vous avez déjà un père dans votre arbre.' }
        }
        if (existingParent) {
          await supa.from('unions').update({ pere_id: targetPerson.id }).eq('id', existingParent.id)
        } else {
          newUnion = { pere_id: targetPerson.id, mere_id: null, enfants_ids: [myPersonId], owner_id: currentUserId, created_by_name: currentUserName }
        }
      }

      else if (role === 'mere') {
        const existingParent = getParentOf(myPersonId)
        if (existingParent?.mere_id) {
          setLoading(false)
          return { success: false, message: 'Vous avez déjà une mère dans votre arbre.' }
        }
        if (existingParent) {
          await supa.from('unions').update({ mere_id: targetPerson.id }).eq('id', existingParent.id)
        } else {
          newUnion = { pere_id: null, mere_id: targetPerson.id, enfants_ids: [myPersonId], owner_id: currentUserId, created_by_name: currentUserName }
        }
      }

      else if (role === 'conjoint') {
        const isTargetHomme = targetPerson.genre === 'M'
        newUnion = {
          pere_id: isTargetHomme ? targetPerson.id : (myPerson.genre === 'M' ? myPersonId : null),
          mere_id: isTargetHomme ? (myPerson.genre === 'F' ? myPersonId : null) : targetPerson.id,
          enfants_ids: [],
          owner_id: currentUserId,
          created_by_name: currentUserName,
        }
      }

      else if (role === 'enfant') {
        const myUnionsAsParent = getUnionsOf(myPersonId)
        if (myUnionsAsParent.length) {
          const u = myUnionsAsParent[0]
          const newKids = [...(u.enfants_ids ?? []), targetPerson.id]
          await supa.from('unions').update({ enfants_ids: newKids }).eq('id', u.id)
        } else {
          const isHomme = myPerson.genre === 'M'
          newUnion = {
            pere_id: isHomme ? myPersonId : null,
            mere_id: isHomme ? null : myPersonId,
            enfants_ids: [targetPerson.id],
            owner_id: currentUserId,
            created_by_name: currentUserName,
          }
        }
      }

      if (newUnion) {
        await supa.from('unions').insert([newUnion])
      }

      await onSuccess()
      setLoading(false)

      const messages: Record<RelierRole, string> = {
        pere: `👨 ${targetPerson.prenom} relié comme père !`,
        mere: `👩 ${targetPerson.prenom} reliée comme mère !`,
        conjoint: `💍 ${targetPerson.prenom} relié·e comme conjoint·e !`,
        enfant: `🌱 ${targetPerson.prenom} relié·e comme enfant !`,
        same: '',
      }

      return { success: true, message: messages[role] }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setError(msg)
      setLoading(false)
      return { success: false, message: `Erreur : ${msg}` }
    }
  }

  return { confirm, loading, error, analyzeTrash }
}
