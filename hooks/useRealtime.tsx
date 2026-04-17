'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppState } from '@/hooks/useAppState';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtime(userId?: string) {
  const { state } = useAppState();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) {
      teardown();
      return;
    }
    setup(userId);
    return () => teardown();
  }, [userId]);

  const setup = (uid: string) => {
    teardown();
    channelRef.current = supabase
      .channel(`user-${uid}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'persons',
        filter: `owner_id=eq.${uid}`,
      }, ({ eventType, new: newRow, old: oldRow }) => {
        if (eventType === 'INSERT') {
          const exists = state.myPersons.find(p => p.id === (newRow as any).id);
          if (!exists) state.setMyPersons([...state.myPersons, newRow as any]);
        } else if (eventType === 'UPDATE') {
          state.setMyPersons(state.myPersons.map(p => p.id === (newRow as any).id ? newRow as any : p));
        } else if (eventType === 'DELETE') {
          state.setMyPersons(state.myPersons.filter(p => p.id !== (oldRow as any).id));
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'unions',
        filter: `owner_id=eq.${uid}`,
      }, ({ eventType, new: newRow, old: oldRow }) => {
        if (eventType === 'INSERT') {
          const exists = state.myUnions.find(u => u.id === (newRow as any).id);
          if (!exists) state.setMyUnions([...state.myUnions, newRow as any]);
        } else if (eventType === 'UPDATE') {
          state.setMyUnions(state.myUnions.map(u => u.id === (newRow as any).id ? newRow as any : u));
        } else if (eventType === 'DELETE') {
          state.setMyUnions(state.myUnions.filter(u => u.id !== (oldRow as any).id));
        }
      })
      .subscribe();
  };

  const teardown = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };
}
