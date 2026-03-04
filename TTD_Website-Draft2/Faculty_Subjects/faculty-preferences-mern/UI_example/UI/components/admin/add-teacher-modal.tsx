'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTeacherModal({ isOpen, onClose }: AddTeacherModalProps) {
  const { addTeacher } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    specialization: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      addTeacher({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        specialization: formData.specialization.split(',').map(s => s.trim()).filter(Boolean),
        status: 'active',
        joiningDate: new Date().toISOString().split('T')[0],
      });

      setFormData({ name: '', email: '', department: '', specialization: '' });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle>Add New Teacher</CardTitle>
            <CardDescription>Register a new faculty member</CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Prof. John Doe"
                required
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@university.edu"
                required
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Department</label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Computer Science"
                required
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Specializations (comma-separated)
              </label>
              <Input
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="AI, Machine Learning, Data Science"
                className="border-border"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? 'Adding...' : 'Add Teacher'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
