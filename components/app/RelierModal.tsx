'use client'

import { useState } from 'react'
import { useRelier, RelierRole, Person, Union } from '@/hooks/useRelier'

interface RelierModalProps {
  isOpen: boolean
  targetPerson: Person | null
  myPersons: Person[]
  myUnions: Union[]
  allUnions: Union[]
  currentUserId: string
  currentUserName: string
  onClose: () => void
  onSuccess: () => Promise<void>
  onToast: (message: string, type: 'success' | 'error') => void
  onDone: (linkedId: string) => void
}

const ROLES: { value: RelierRole; label: string; desc: string; icon: string; gold?: boolean }[] = [
  { value: 'pere',     icon: '👨', label: 'Définir comme père de...',      desc: 'Il sera ajouté comme père dans votre arbre' },
  { value: 'mere',     icon: '👩', label: 'Définir comme mère de...',      desc: 'Elle sera ajoutée comme mère dans votre arbre' },
  { value: 'conjoint', icon: '💍', label: 'Définir comme conjoint·e de...', desc: 'Un mariage sera créé entre vous deux' },
  { value: 'enfant',   icon: '🌱', label: 'Définir comme enfant de...',    desc: 'Il/Elle sera ajouté·e comme enfant dans un mariage' },
  { value: 'same',     icon: '🔄', label: 'Il s\'agit de la même personne', desc: 'Fusionner : remplacez votre brouillon par cette fiche publique (vos enfants et conjoints seront transférés).', gold: true },
]

export default function RelierModal({
  isOpen,
  targetPerson,
  myPersons,
  myUnions,
  allUnions,
  currentUserId,
  currentUserName,
  onClose,
  onSuccess,
  onToast,
  onDone,
}: RelierModalProps) {
  const [selectedRole, setSelectedRole] = useState<RelierRole | null>(null)
  const [selectedMyPersonId, setSelectedMyPersonId] = useState<string>('')

  const { confirm, loading } = useRelier({
    currentUserId,
    currentUserName,
    myPersons,
    myUnions,
    allUnions,
    onSuccess,
  })

  const myOwnPersons = [...myPersons]
    .sort((a, b) => (a.prenom ?? '').localeCompare(b.prenom ?? ''))

  const handleConfirm = async () => {
    if (!selectedMyPersonId || !targetPerson || !selectedRole) return
    const myPerson = myPersons.find(p => p.id === selectedMyPersonId)
    if (!myPerson) return

    const result = await confirm(selectedMyPersonId, targetPerson, selectedRole, myPerson)
    if (result.message) onToast(result.message, result.success ? 'success' : 'error')
    if (result.success) {
      if (selectedRole === 'same') {
        onDone(targetPerson.id)
      } else {
        onDone(selectedMyPersonId)
      }
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedRole(null)
    setSelectedMyPersonId('')
    onClose()
  }

  if (!isOpen || !targetPerson) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(9,30,18,0.72)', backdropFilter: 'blur(8px)',
      padding: '16px',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%', maxWidth: '448px', maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: '#F0FDF4',
          borderBottom: '1px solid #BBF7D0', borderRadius: '16px 16px 0 0',
        }}>
          <span style={{ fontWeight: 600, color: '#166534', fontSize: '14px' }}>
            🔗 Relier à ma famille
          </span>
          <button onClick={handleClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6B7280', fontSize: '18px', lineHeight: 1, padding: '2px 6px',
          }}>✕</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Fiche de la personne cible */}
          <div style={{
            background: '#FAFAF9', border: '1px solid #E7E5E4',
            borderRadius: '8px', padding: '12px',
          }}>
            <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontWeight: 700, color: '#1C1917', margin: 0 }}>
              {targetPerson.prenom} {targetPerson.nom ?? ''}
            </p>
            <p style={{ fontSize: '12px', color: '#78716C', marginTop: '4px', marginBottom: 0 }}>
              {[
                targetPerson.clan ? `${targetPerson.prefix_lignee ?? 'Lenyol'} ${targetPerson.clan}` : null,
                targetPerson.localite
              ].filter(Boolean).join(' · ')}
            </p>
            <p style={{ fontSize: '12px', color: '#A8A29E', marginTop: '4px', marginBottom: 0, fontStyle: 'italic' }}>
              Fiche de {targetPerson.created_by_name ?? 'inconnu'} — lecture seule
            </p>
          </div>

          {/* Question */}
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#44403C', margin: 0 }}>
            Comment êtes-vous lié·e à cette personne ?
          </p>

          {/* Choix du rôle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ROLES.map(role => {
              const isSelected = selectedRole === role.value
              return (
                <button
                  key={role.value}
                  onClick={() => { setSelectedRole(role.value); setSelectedMyPersonId('') }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                    border: `1.5px solid ${
                      role.gold
                        ? isSelected ? '#FBBF24' : '#FCD34D'
                        : isSelected ? '#16A34A' : '#E7E5E4'
                    }`,
                    background: role.gold
                      ? isSelected ? '#FFFBEB' : 'rgba(254,243,199,0.5)'
                      : isSelected ? '#F0FDF4' : 'white',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{role.icon}</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: role.gold ? '#92400E' : '#1C1917', margin: 0 }}>
                      {role.label}
                    </p>
                    <p style={{ fontSize: '12px', color: '#78716C', marginTop: '2px', marginBottom: 0 }}>
                      {role.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Sélecteur de ma fiche */}
          {selectedRole && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ma fiche dans mon arbre
              </label>
              <select
                value={selectedMyPersonId}
                onChange={e => setSelectedMyPersonId(e.target.value)}
                style={{
                  width: '100%', border: '1px solid #E7E5E4', borderRadius: '8px',
                  padding: '8px 12px', fontSize: '14px', background: 'white',
                  outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                <option value="">— Choisir ma fiche —</option>
                {myOwnPersons.map(p => (
                  <option key={p.id} value={p.id}>
                    {[p.prenom, p.nom, p.localite].filter(Boolean).join(' · ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '8px',
          padding: '16px 20px', borderTop: '1px solid #F5F5F4',
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
              border: '1px solid #E7E5E4', borderRadius: '8px',
              background: 'none', fontFamily: 'inherit', transition: '0.15s',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMyPersonId || !selectedRole || loading}
            style={{
              padding: '8px 16px', fontSize: '14px', cursor: !selectedMyPersonId || !selectedRole || loading ? 'not-allowed' : 'pointer',
              border: 'none', borderRadius: '8px',
              background: '#1A5C3E', color: 'white',
              opacity: !selectedMyPersonId || !selectedRole || loading ? 0.4 : 1,
              fontFamily: 'inherit', transition: '0.15s',
            }}
          >
            {loading ? 'En cours...' : 'Confirmer'}
          </button>
        </div>

      </div>
    </div>
  )
}
