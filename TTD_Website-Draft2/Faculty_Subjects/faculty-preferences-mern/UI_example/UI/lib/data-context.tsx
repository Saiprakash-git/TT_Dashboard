'use client';

import React, { createContext, useContext, useState } from 'react';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  specialization: string[];
  status: 'active' | 'inactive';
  joiningDate: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  semester: number;
  maxCapacity: number;
  description: string;
}

export interface TeacherSubjectSelection {
  id: string;
  teacherId: string;
  semesterId: string;
  selectedSubjects: string[]; // Subject IDs
  preferences: string[]; // Subject IDs in preference order
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
}

export interface Allocation {
  id: string;
  teacherId: string;
  subjectId: string;
  semesterId: string;
  status: 'allocated' | 'pending' | 'rejected';
  allocationDate: string;
}

interface DataContextType {
  teachers: Teacher[];
  subjects: Subject[];
  selections: TeacherSubjectSelection[];
  allocations: Allocation[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  submitSelection: (selection: Omit<TeacherSubjectSelection, 'id' | 'submittedAt'>) => void;
  updateSelection: (id: string, selection: Partial<TeacherSubjectSelection>) => void;
  addAllocation: (allocation: Omit<Allocation, 'id'>) => void;
  updateAllocation: (id: string, allocation: Partial<Allocation>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock initial data
const MOCK_TEACHERS: Teacher[] = [
  {
    id: '1',
    name: 'Prof. Sarah Chen',
    email: 'sarah.chen@university.edu',
    department: 'Computer Science',
    specialization: ['AI', 'Machine Learning', 'Data Science'],
    status: 'active',
    joiningDate: '2018-08-15',
  },
  {
    id: '2',
    name: 'Dr. James Wilson',
    email: 'james.wilson@university.edu',
    department: 'Computer Science',
    specialization: ['Database Systems', 'Web Development'],
    status: 'active',
    joiningDate: '2016-07-20',
  },
  {
    id: '3',
    name: 'Prof. Maria Garcia',
    email: 'maria.garcia@university.edu',
    department: 'Mathematics',
    specialization: ['Discrete Math', 'Linear Algebra', 'Algorithms'],
    status: 'active',
    joiningDate: '2019-01-10',
  },
];

const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'sub1',
    code: 'CS101',
    name: 'Introduction to Programming',
    department: 'Computer Science',
    credits: 3,
    semester: 1,
    maxCapacity: 60,
    description: 'Fundamentals of programming using Python',
  },
  {
    id: 'sub2',
    code: 'CS201',
    name: 'Data Structures',
    department: 'Computer Science',
    credits: 4,
    semester: 2,
    maxCapacity: 50,
    description: 'Study of arrays, linked lists, trees, and graphs',
  },
  {
    id: 'sub3',
    code: 'CS301',
    name: 'Database Systems',
    department: 'Computer Science',
    credits: 3,
    semester: 3,
    maxCapacity: 40,
    description: 'Relational databases and SQL',
  },
  {
    id: 'sub4',
    code: 'MATH101',
    name: 'Discrete Mathematics',
    department: 'Mathematics',
    credits: 3,
    semester: 1,
    maxCapacity: 60,
    description: 'Set theory, logic, and combinatorics',
  },
  {
    id: 'sub5',
    code: 'MATH201',
    name: 'Linear Algebra',
    department: 'Mathematics',
    credits: 4,
    semester: 2,
    maxCapacity: 50,
    description: 'Vectors, matrices, and eigenvalues',
  },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [selections, setSelections] = useState<TeacherSubjectSelection[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const addTeacher = (teacher: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = {
      ...teacher,
      id: `teacher_${Date.now()}`,
    };
    setTeachers([...teachers, newTeacher]);
  };

  const updateTeacher = (id: string, teacher: Partial<Teacher>) => {
    setTeachers(teachers.map(t => (t.id === id ? { ...t, ...teacher } : t)));
  };

  const deleteTeacher = (id: string) => {
    setTeachers(teachers.filter(t => t.id !== id));
  };

  const addSubject = (subject: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subject,
      id: `sub_${Date.now()}`,
    };
    setSubjects([...subjects, newSubject]);
  };

  const updateSubject = (id: string, subject: Partial<Subject>) => {
    setSubjects(subjects.map(s => (s.id === id ? { ...s, ...subject } : s)));
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const submitSelection = (selection: Omit<TeacherSubjectSelection, 'id' | 'submittedAt'>) => {
    const newSelection: TeacherSubjectSelection = {
      ...selection,
      id: `sel_${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    setSelections([...selections, newSelection]);
  };

  const updateSelection = (id: string, selection: Partial<TeacherSubjectSelection>) => {
    setSelections(selections.map(s => (s.id === id ? { ...s, ...selection } : s)));
  };

  const addAllocation = (allocation: Omit<Allocation, 'id'>) => {
    const newAllocation: Allocation = {
      ...allocation,
      id: `alloc_${Date.now()}`,
    };
    setAllocations([...allocations, newAllocation]);
  };

  const updateAllocation = (id: string, allocation: Partial<Allocation>) => {
    setAllocations(allocations.map(a => (a.id === id ? { ...a, ...allocation } : a)));
  };

  return (
    <DataContext.Provider
      value={{
        teachers,
        subjects,
        selections,
        allocations,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addSubject,
        updateSubject,
        deleteSubject,
        submitSelection,
        updateSelection,
        addAllocation,
        updateAllocation,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
