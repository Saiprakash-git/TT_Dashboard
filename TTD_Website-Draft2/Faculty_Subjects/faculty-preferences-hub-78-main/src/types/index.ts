export type AppRole = 'admin' | 'teacher';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  department: string | null;
  designation: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: number;
  semester: string | null;
  created_at: string;
  updated_at: string;
}

export interface Preference {
  id: string;
  teacher_id: string;
  subject_ids: string[];
  submitted_at: string;
  updated_at: string;
}

export interface TeacherWithPreference extends Profile {
  preference?: Preference;
  role?: UserRole;
}
