'use server';

import { createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();
  
  try {
    // 1. Supprimer les données liées (persons, unions, etc.)
    // Supprimer les persons créés par l'utilisateur
    const { error: personsError } = await supabase
      .from('persons')
      .delete()
      .eq('created_by', userId);
    
    if (personsError) {
      console.error('[deleteUserAccount] Error deleting persons:', personsError);
      return { success: false, error: personsError.message };
    }
    
    // Supprimer les unions créées par l'utilisateur
    const { error: unionsError } = await supabase
      .from('unions')
      .delete()
      .eq('created_by', userId);
    
    if (unionsError) {
      console.error('[deleteUserAccount] Error deleting unions:', unionsError);
      return { success: false, error: unionsError.message };
    }
    
    // Supprimer le profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error('[deleteUserAccount] Error deleting profile:', profileError);
      return { success: false, error: profileError.message };
    }
    
    // 2. Supprimer l'utilisateur auth via l'API Admin
    // Note: Cela nécessite un token service_role dans les variables d'environnement
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (serviceRoleKey) {
      const adminSupabase = createServerClient();
      // Le service role key doit être utilisé directement pour les opérations admin
      const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('[deleteUserAccount] Error deleting auth user:', authError);
        // On continue quand même car les données sont supprimées
      }
    } else {
      console.warn('[deleteUserAccount] No service role key found, skipping auth deletion');
    }
    
    revalidatePath('/', 'layout');
    return { success: true };
    
  } catch (error) {
    console.error('[deleteUserAccount] Unexpected error:', error);
    return { success: false, error: 'Une erreur inattendue est survenue.' };
  }
}