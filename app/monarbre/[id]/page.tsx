'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import TreeView from '@/components/app/TreeView';
import AddRelationModal from '@/components/app/AddRelationModal';
import { exportPersonPDF } from '@/lib/exportPDF';
import type { Person } from '@/lib/types';

type Role = 'pere' | 'mere' | 'enfant' | 'conjoint';

export default function MonArbrePersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { state } = useAppState();
  const { fetchPerson, fetchParentUnionOf } = useDB();

  function makeExportCtx() {
    const allPersons = [...state.myPersons, ...state.allPersons];
    const allUnions  = [...state.myUnions, ...state.allUnions];
    return {
      getPersonById: (pid: string) => allPersons.find(p => p.id === pid) ?? null,
      getParentUnionOf: (pid: string) => allUnions.find(u => (u.enfants_ids || []).includes(pid)) ?? null,
      fetchPerson,
      fetchParentUnionOf,
    };
  }

  const [modal, setModal] = useState<{ role: Role; personId: string } | null>(null);

  const modalPerson = modal
    ? [...state.myPersons, ...state.allPersons].find(p => p.id === modal.personId) ?? null
    : null;

  return (
    <>
      <TreeView
        personId={id}
        scope="ma"
        onBack={() => router.back()}
        onNavigateTo={(newId) => router.push(`/monarbre/${newId}`)}
        onEditPerson={(p: Person) => router.push(`/monarbre/${p.id}/modifier`)}
        onAddUnion={(forId) => router.push(`/monarbre/${forId || id}/mariage`)}
        onModifyUnion={(unionId) => router.push(`/monarbre/${id}/mariage?unionId=${unionId}`)}
        onAddRelation={(role, personId) => setModal({ role: role as Role, personId })}
        onExportPDF={(pid) => exportPersonPDF(pid, 'ma', makeExportCtx())}
      />

      {modal && modalPerson && (
        <AddRelationModal
          role={modal.role}
          forPerson={modalPerson}
          onClose={() => setModal(null)}
          onCreateNew={(unionId) => {
            setModal(null);
            const params = new URLSearchParams({ relation: modal.role, relatedId: modal.personId });
            if (unionId) params.set('unionId', unionId);
            router.push(`/monarbre/nouveau?${params.toString()}`);
          }}
          onDone={(linkedId) => {
            setModal(null);
            router.push(`/monarbre/${linkedId}`);
          }}
        />
      )}
    </>
  );
}
