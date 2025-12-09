import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Profile, TeacherWithPreference } from '@/types';

export function useTeachers() {
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      // Get all profiles with teacher role
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;

      // Get all preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('preferences')
        .select('*');
      
      if (prefsError) throw prefsError;

      // Filter to only teachers and merge data
      const teacherRoles = roles.filter(r => r.role === 'teacher');
      const teacherIds = new Set(teacherRoles.map(r => r.user_id));

      const teachersWithData: TeacherWithPreference[] = (profiles as Profile[])
        .filter(p => teacherIds.has(p.id))
        .map(profile => ({
          ...profile,
          preference: preferences.find(pref => pref.teacher_id === profile.id),
          role: roles.find(r => r.user_id === profile.id),
        }));

      return teachersWithData;
    },
  });

  const updateTeacher = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update teacher: ${error.message}`);
    },
  });

  return {
    teachers,
    isLoading,
    error,
    updateTeacher,
  };
}
