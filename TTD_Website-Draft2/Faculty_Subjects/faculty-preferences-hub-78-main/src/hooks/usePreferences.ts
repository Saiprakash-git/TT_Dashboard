import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Preference } from '@/types';

export function usePreferences(teacherId?: string) {
  const queryClient = useQueryClient();

  const { data: preference, isLoading, error } = useQuery({
    queryKey: ['preferences', teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Preference | null;
    },
    enabled: !!teacherId,
  });

  const savePreference = useMutation({
    mutationFn: async ({ teacherId, subjectIds }: { teacherId: string; subjectIds: string[] }) => {
      // Check if preference exists
      const { data: existing } = await supabase
        .from('preferences')
        .select('id')
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('preferences')
          .update({ subject_ids: subjectIds, updated_at: new Date().toISOString() })
          .eq('teacher_id', teacherId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('preferences')
          .insert({ teacher_id: teacherId, subject_ids: subjectIds })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      queryClient.invalidateQueries({ queryKey: ['all-preferences'] });
      toast.success('Preferences saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save preferences: ${error.message}`);
    },
  });

  return {
    preference,
    isLoading,
    error,
    savePreference,
  };
}

export function useAllPreferences() {
  return useQuery({
    queryKey: ['all-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as Preference[];
    },
  });
}
