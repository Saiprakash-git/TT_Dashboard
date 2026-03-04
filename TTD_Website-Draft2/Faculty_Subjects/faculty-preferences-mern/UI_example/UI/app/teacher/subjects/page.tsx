'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubjectSelectionCard from '@/components/teacher/subject-selection-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function SubjectsPage() {
  const { user } = useAuth();
  const { subjects, selections } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('all');

  const teacherSelection = selections.find(s => s.teacherId === user?.id);

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = department === 'all' || subject.department === department;
    return matchesSearch && matchesDept;
  });

  const departments = ['all', ...new Set(subjects.map(s => s.department))];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-white p-6">
        <h1 className="text-3xl font-bold text-primary">Subject Selection</h1>
        <p className="text-muted-foreground mt-1">Browse and select subjects for the upcoming semester</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Filters */}
          <Card className="border border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by subject name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setDepartment(dept)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border-2 ${
                        department === dept
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {dept === 'all' ? 'All Departments' : dept}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <SubjectSelectionCard
                  key={subject.id}
                  subject={subject}
                  isSelected={teacherSelection?.selectedSubjects.includes(subject.id) || false}
                  teacherId={user?.id || ''}
                  selectionId={teacherSelection?.id}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No subjects found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
