'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TeacherTable from '@/components/admin/teacher-table';
import AddTeacherModal from '@/components/admin/add-teacher-modal';
import { Plus, Search } from 'lucide-react';

export default function TeachersPage() {
  const { teachers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Teachers Management</h1>
            <p className="text-muted-foreground mt-1">Manage faculty members and their information</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border"
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredTeachers.length} results
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <TeacherTable teachers={filteredTeachers} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Teacher Modal */}
      <AddTeacherModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
