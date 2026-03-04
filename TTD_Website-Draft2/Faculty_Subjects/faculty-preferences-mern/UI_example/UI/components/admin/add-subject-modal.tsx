'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddSubjectModal({ isOpen, onClose }: AddSubjectModalProps) {
  const { addSubject } = useData();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: '',
    credits: '3',
    semester: '1',
    maxCapacity: '50',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      addSubject({
        code: formData.code,
        name: formData.name,
        department: formData.department,
        credits: parseInt(formData.credits),
        semester: parseInt(formData.semester),
        maxCapacity: parseInt(formData.maxCapacity),
        description: formData.description,
      });

      setFormData({
        code: '',
        name: '',
        department: '',
        credits: '3',
        semester: '1',
        maxCapacity: '50',
        description: '',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border shadow-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 sticky top-0 bg-background">
          <div>
            <CardTitle>Add New Subject</CardTitle>
            <CardDescription>Register a new course</CardDescription>
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
              <label className="block text-sm font-medium text-foreground mb-2">Subject Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="CS101"
                required
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Subject Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Introduction to Programming"
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Credits</label>
                <Input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  min="1"
                  max="10"
                  className="border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Semester</label>
                <Input
                  type="number"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  min="1"
                  max="8"
                  className="border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Capacity</label>
                <Input
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                  min="10"
                  className="border-border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the course"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                {isSubmitting ? 'Adding...' : 'Add Subject'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
