'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import type { Person, Union } from '@/lib/types';

export function useDB() {
  const { user, profile } = useAuth();
  const { state, setLoading, showToast } = useAppState();

  const displayName = profile
    ? [profile.prenom, profile.nom].filter(Boolean).join(' ')
    : user?.email?.split('@')[0] || '?';

  // ── LOAD ──

  const loadMyData = useCallback(async () => {
    if (!user) return;
    const [pr, ur] = await Promise.all([
      supabase.from('persons').select('*').eq('owner_id', user.id).order('prenom'),
      supabase.from('unions').select('*').eq('owner_id', user.id),
    ]);
    state.setMyPersons(pr.data || []);
    state.setMyUnions(ur.data || []);
  }, [user]);

  // ── FETCH (on-demand, with local cache) ──

  const fetchPerson = useCallback(async (id: string): Promise<Person | null> => {
    const cached = [...state.myPersons, ...state.allPersons].find(p => p.id === id);
    if (cached) return cached;
    const { data } = await supabase.from('persons').select('*').eq('id', id).single();
    if (data) state.setAllPersons([...state.allPersons, data]);
    return data || null;
  }, [state]);

  const fetchUnionsOf = useCallback(async (personId: string): Promise<Union[]> => {
    const { data } = await supabase.from('unions').select('*')
      .or(`pere_id.eq.${personId},mere_id.eq.${personId}`);
    if (data) {
      const merged = [...state.allUnions, ...data.filter(u => !state.allUnions.find(x => x.id === u.id))];
      state.setAllUnions(merged);
    }
    return data || [];
  }, [state]);

  const fetchParentUnionOf = useCallback(async (personId: string): Promise<Union | null> => {
    const { data } = await supabase.from('unions').select('*')
      .contains('enfants_ids', [personId]).limit(1);
    if (data?.length) {
      const u = data[0];
      if (!state.allUnions.find(x => x.id === u.id))
        state.setAllUnions([...state.allUnions, u]);
      return u;
    }
    return null;
  }, [state]);

  const fetchByLocalite = useCallback(async (localite: string): Promise<Person[]> => {
    if (localite === '__nr__') {
      const { data } = await supabase.from('persons').select('*').is('localite', null).neq('masque', true).order('prenom');
      return data || [];
    }
    const { data } = await supabase.from('persons').select('*').eq('localite', localite).neq('masque', true).order('prenom');
    return data || [];
  }, []);

  const fetchByClan = useCallback(async (clan: string): Promise<Person[]> => {
    if (clan === '__sans__') {
      const { data } = await supabase.from('persons').select('*').is('clan', null).neq('masque', true).order('prenom');
      return data || [];
    }
    const parts = clan.split(' ');
    const clanName = parts.length > 1 ? parts.slice(1).join(' ') : clan;
    const { data } = await supabase.from('persons').select('*').eq('clan', clanName).neq('masque', true).order('prenom');
    return data || [];
  }, []);

  const searchPersons = useCallback(async (q: string): Promise<Person[]> => {
    const { data } = await supabase.from('persons').select('*')
      .or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,clan.ilike.%${q}%,localite.ilike.%${q}%,galle.ilike.%${q}%`)
      .neq('masque', true)
      .limit(300);
    return data || [];
  }, []);

  // ── GETTERS (local) ──

  const getPersonById = useCallback((id: string, scope: 'my' | 'all' = 'all'): Person | null => {
    if (scope === 'my') return state.myPersons.find(p => p.id === id) || null;
    return state.myPersons.find(p => p.id === id) || state.allPersons.find(p => p.id === id) || null;
  }, [state]);

  const getUnionsOf = useCallback((id: string, scope: 'my' | 'all' = 'all'): Union[] => {
    const allU = scope === 'my'
      ? state.myUnions
      : [...state.myUnions, ...state.allUnions.filter(u => !state.myUnions.find(m => m.id === u.id))];
    return allU.filter(u => u.pere_id === id || u.mere_id === id);
  }, [state]);

  const getParentOf = useCallback((id: string, scope: 'my' | 'all' = 'all'): Union | null => {
    const allU = scope === 'my'
      ? state.myUnions
      : [...state.myUnions, ...state.allUnions.filter(u => !state.myUnions.find(m => m.id === u.id))];
    return allU.find(u => (u.enfants_ids || []).includes(id)) || null;
  }, [state]);

  // ── WRITE ──

  const addPerson = useCallback(async (d: Partial<Person>): Promise<Person> => {
    if (!user) throw new Error('Non connecté');
    const row = { ...d, owner_id: user.id, created_by: user.id, created_by_name: displayName };
    const { data, error } = await supabase.from('persons').insert([row]).select().single();
    if (error) throw error;
    state.setMyPersons([...state.myPersons, data]);
    return data;
  }, [user, state, displayName]);

  const updatePerson = useCallback(async (id: string, d: Partial<Person>): Promise<Person> => {
    const { data, error } = await supabase
      .from('persons').update({ ...d, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    state.setMyPersons(state.myPersons.map(p => p.id === id ? data : p));
    state.setAllPersons(state.allPersons.map(p => p.id === id ? data : p));
    return data;
  }, [state]);

  // Propage clan/localite/region/galle/prefix_lignee de la mère à toute sa lignée matrilinéaire
  const propagateMaternalLineage = useCallback(async (mereId: string, fields: Pick<Person, 'clan' | 'localite' | 'region' | 'galle' | 'prefix_lignee'>): Promise<void> => {
    // Récupère toutes les unions où cette personne est mère, récursivement
    const toVisit = [mereId];
    const visited = new Set<string>();
    while (toVisit.length) {
      const currentId = toVisit.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      // Unions où cette personne est mère
      const { data: unions } = await supabase
        .from('unions').select('*').eq('mere_id', currentId);
      for (const u of unions || []) {
        for (const enfantId of u.enfants_ids || []) {
          if (visited.has(enfantId)) continue;
          await supabase.from('persons').update({
            clan: fields.clan,
            localite: fields.localite,
            region: fields.region,
            galle: fields.galle,
            prefix_lignee: fields.prefix_lignee,
            updated_at: new Date().toISOString(),
          }).eq('id', enfantId);
          toVisit.push(enfantId);
        }
      }
    }
  }, []);

  const toggleMasque = useCallback(async (person: Person): Promise<void> => {
    if (!user || person.deceased) return;
    const newMasque = !person.masque;

    // Collecte la personne + toute sa descendance via myUnions
    const toUpdate = new Set<string>([person.id]);
    const queue = [person.id];
    while (queue.length) {
      const currentId = queue.pop()!;
      for (const u of state.myUnions) {
        if (u.pere_id === currentId || u.mere_id === currentId) {
          for (const childId of u.enfants_ids || []) {
            if (!toUpdate.has(childId)) {
              toUpdate.add(childId);
              queue.push(childId);
            }
          }
        }
      }
    }

    const ids = Array.from(toUpdate);
    await supabase
      .from('persons')
      .update({ masque: newMasque, updated_at: new Date().toISOString() })
      .in('id', ids);

    state.setMyPersons(state.myPersons.map(p => toUpdate.has(p.id) ? { ...p, masque: newMasque } : p));
    state.setAllPersons(state.allPersons.map(p => toUpdate.has(p.id) ? { ...p, masque: newMasque } : p));

    const msg = newMasque
      ? `${ids.length > 1 ? ids.length + ' personnes masquées' : 'Personne masquée'} dans le registre`
      : `${ids.length > 1 ? ids.length + ' personnes' : 'Personne'} de nouveau visible dans le registre`;
    showToast(msg, 'success');
  }, [user, state, showToast]);

  const deletePerson = useCallback(async (id: string): Promise<void> => {
    await supabase.from('unions').update({ pere_id: null }).eq('pere_id', id);
    await supabase.from('unions').update({ mere_id: null }).eq('mere_id', id);
    const unions = state.myUnions.filter(u => (u.enfants_ids || []).includes(id));
    for (const u of unions) {
      await supabase.from('unions')
        .update({ enfants_ids: u.enfants_ids.filter((k: string) => k !== id) }).eq('id', u.id);
    }
    await supabase.from('persons').delete().eq('id', id);
    state.setMyPersons(state.myPersons.filter(p => p.id !== id));
    state.setAllPersons(state.allPersons.filter(p => p.id !== id));
  }, [state]);

  const addUnion = useCallback(async (d: Partial<Union>): Promise<Union> => {
    if (!user) throw new Error('Non connecté');
    const row = { ...d, owner_id: user.id, created_by: user.id, created_by_name: displayName };
    const { data, error } = await supabase.from('unions').insert([row]).select().single();
    if (error) throw error;
    state.setMyUnions([...state.myUnions, data]);
    state.setAllUnions([...state.allUnions, data]);
    return data;
  }, [user, state, displayName]);

  const updateUnion = useCallback(async (id: string, d: Partial<Union>): Promise<Union> => {
    const { data, error } = await supabase.from('unions').update(d).eq('id', id).select().single();
    if (error) throw error;
    state.setMyUnions(state.myUnions.map(u => u.id === id ? data : u));
    state.setAllUnions(state.allUnions.map(u => u.id === id ? data : u));
    return data;
  }, [state]);

  const deleteUnion = useCallback(async (id: string): Promise<void> => {
    await supabase.from('unions').delete().eq('id', id);
    state.setMyUnions(state.myUnions.filter(u => u.id !== id));
    state.setAllUnions(state.allUnions.filter(u => u.id !== id));
  }, [state]);

  // ── EXPORT / IMPORT ──

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ persons: state.myPersons, unions: state.myUnions }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Lenyol_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Export JSON téléchargé ✓', 'success');
  }, [state]);

  const exportGEDCOM = useCallback(() => {
    let ged = '0 HEAD\n1 GEDC\n2 VERS 5.5.1\n1 CHAR UTF-8\n';
    state.myPersons.forEach(p => {
      ged += `0 @I${p.id}@ INDI\n1 NAME ${p.prenom || ''} /${p.nom || ''}/\n1 SEX ${p.genre === 'F' ? 'F' : 'M'}\n`;
      if (p.naiss_date) ged += `1 BIRT\n2 DATE ${p.naiss_date}\n`;
      if (p.deceased && p.deces_date) ged += `1 DEAT\n2 DATE ${p.deces_date}\n`;
    });
    state.myUnions.forEach(u => {
      ged += `0 @F${u.id}@ FAM\n`;
      if (u.pere_id) ged += `1 HUSB @I${u.pere_id}@\n`;
      if (u.mere_id) ged += `1 WIFE @I${u.mere_id}@\n`;
      (u.enfants_ids || []).forEach(k => { ged += `1 CHIL @I${k}@\n`; });
    });
    ged += '0 TRLR\n';
    const blob = new Blob([ged], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Lenyol_${new Date().toISOString().slice(0, 10)}.ged`;
    a.click();
    showToast('Export GEDCOM téléchargé ✓', 'success');
  }, [state]);

  const importJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed.persons)) throw new Error('Format invalide');
        setLoading(true);
        for (const p of parsed.persons) {
          await addPerson({ ...p, id: undefined });
        }
        await loadMyData();
        showToast(`${parsed.persons.length} personnes importées ✓`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Erreur import', 'error');
      }
      setLoading(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [addPerson, loadMyData]);

  const importGEDCOM = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // GEDCOM import is complex — show a toast for now
    showToast('Import GEDCOM bientôt disponible.', 'info');
    e.target.value = '';
  }, []);

  return {
    state,
    loadMyData,
    fetchPerson,
    fetchUnionsOf,
    fetchParentUnionOf,
    fetchByLocalite,
    fetchByClan,
    searchPersons,
    getPersonById,
    getUnionsOf,
    getParentOf,
    addPerson,
    updatePerson,
    propagateMaternalLineage,
    toggleMasque,
    deletePerson,
    addUnion,
    updateUnion,
    deleteUnion,
    exportJSON,
    exportGEDCOM,
    importJSON,
    importGEDCOM,
  };
}
