'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import TreeView from '@/components/app/TreeView';
import RelierModal from '@/components/app/RelierModal';
import { exportPersonPDF } from '@/lib/exportPDF';
import type { Person } from '@/lib/types';

export default function PersonView({ id }: { id: string }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { state, showToast } = useAppState();
  const { fetchPerson, fetchParentUnionOf } = useDB();
  const [relierTarget, setRelierTarget] = useState<Person | null>(null);

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

  return (
    <>
      <TreeView
        personId={id}
        scope="reg"
        onBack={() => router.back()}
        onNavigateTo={(newId) => router.push(`/registre/${newId}`)}
        onExportPDF={(pid) => exportPersonPDF(pid, 'reg', makeExportCtx())}
        onRelier={(person) => {
          if (!user) { router.push('/'); return; }
          setRelierTarget(person);
        }}
      />

      {relierTarget && (
        <RelierModal
          isOpen={true}
          targetPerson={relierTarget}
          myPersons={state.myPersons}
          myUnions={state.myUnions}
          allUnions={state.allUnions}
          currentUserId={user?.id ?? ''}
          currentUserName={[profile?.prenom, profile?.nom].filter(Boolean).join(' ')}
          onSuccess={async () => {}}
          onToast={(msg, type) => showToast(msg, type)}
          onClose={() => setRelierTarget(null)}
          onDone={(linkedId) => {
            setRelierTarget(null);
            router.push(`/monarbre/${linkedId}`);
          }}
        />
      )}
    </>
  );
}
