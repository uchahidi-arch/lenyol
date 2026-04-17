'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

interface AuthContext {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    meta: { prenom: string; nom?: string; region?: string; username?: string; cgu_accepted?: boolean }
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<string | null>;
  updateProfile: (fields: { prenom: string; nom?: string | null; region?: string | null }) => Promise<string | null>;
}

const AuthCtx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        await supabase.auth.signOut();
        handleSession(null);
      } else {
        handleSession(session);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        handleSession(null);
      } else {
        handleSession(session);
      }
    });

    // Proactive token refresh every 45 minutes
    const interval = setInterval(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        await supabase.auth.signOut();
        handleSession(null);
      }
    }, 45 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSession = async (session: Session | null) => {
    const u = session?.user ?? null;
    setUser(u);
    if (u) {
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
      setProfile(data || null);
    } else {
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (
    email: string,
    password: string,
    meta: { prenom: string; nom?: string; region?: string; username?: string; cgu_accepted?: boolean }
  ): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    const userId = data?.user?.id || data?.session?.user?.id;
    if (userId) {
      const now = new Date().toISOString();
      await supabase.from('profiles').insert([{
        id: userId,
        prenom: meta.prenom,
        nom: meta.nom,
        region: meta.region,
        username: meta.username,
        cgu_accepted: meta.cgu_accepted ?? false,
        cgu_accepted_at: meta.cgu_accepted ? now : null,
      }]);
    }
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateUsername = async (username: string): Promise<string | null> => {
    if (!user) return 'Non connecté.';
    // Vérifier unicité
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle();
    if (existing) return 'Ce pseudo est déjà utilisé.';
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id);
    if (error) {
      console.error('[updateUsername] Supabase error:', error);
      return error.message;
    }
    // Mettre à jour created_by_name dans persons pour que le leaderboard Par Créateur soit cohérent
    const { error: personsError } = await supabase
      .from('persons')
      .update({ created_by_name: username })
      .eq('created_by', user.id);
    if (personsError) {
      console.error('[updateUsername] persons update error:', personsError);
    }
    // Re-fetch depuis Supabase pour confirmer la mise à jour réelle en base
    const { data: updated, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (fetchError) {
      console.error('[updateUsername] Re-fetch error:', fetchError);
    } else {
      setProfile(updated || null);
    }
    return null;
  };

  const updateProfile = async (fields: { prenom: string; nom?: string | null; region?: string | null }): Promise<string | null> => {
    if (!user) return 'Non connecté.';
    const { data: rows, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        prenom: fields.prenom,
        nom: fields.nom ?? null,
        region: (fields.region as Profile['region']) ?? null,
      }, { onConflict: 'id' })
      .select();
    if (error) {
      console.error('[updateProfile] Supabase error:', error);
      return error.message;
    }
    if (!rows || rows.length === 0) {
      console.error('[updateProfile] upsert — aucune ligne retournée');
      return 'Mise à jour bloquée (vérifier les politiques RLS dans Supabase).';
    }
    setProfile(rows[0] as Profile);
    return null;
  };

  return (
    <AuthCtx.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateUsername, updateProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
