'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function SelectionsPage() {
  const { user } = useAuth();
  const { selections, subjects, submitSelection, updateSelection } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teacherSelection = selections.find(s => s.teacherId === user?.id);

  const selectedSubjectsData = teacherSelection?.selectedSubjects
    .map(id => subjects.find(s => s.id === id))
    .filter(Boolean) || [];

  const handleSubmit = async () => {
    if (!teacherSelection) {
      // Create new selection
      submitSelection({
        teacherId: user?.id || '',
        semesterId: 'semester-1',
        selectedSubjects: [],
        preferences: [],
        status: 'submitted'
      });
    } else {
      // Update existing selection
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      updateSelection(teacherSelection.id, {
        status: 'submitted'
      });
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-white p-6">
        <h1 className="text-3xl font-bold text-primary">My Selections</h1>
        <p className="text-muted-foreground mt-1">Review and submit your subject selections</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {teacherSelection && (
            <>
              {/* Status Card */}
              <Card className="border border-border shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(teacherSelection.status)}
                      <div>
                        <p className="text-sm text-muted-foreground">Current Status</p>
                        <p className="text-xl font-bold text-primary">{getStatusLabel(teacherSelection.status)}</p>
                      </div>
                    </div>
                    {teacherSelection.status === 'pending' && (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Selections'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Subjects */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4">Selected Subjects ({selectedSubjectsData.length})</h2>
                {selectedSubjectsData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSubjectsData.map((subject) => (
                      <Card key={subject?.id} className="border border-border shadow-sm">
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-foreground">{subject?.name}</p>
                                  <p className="text-sm text-muted-foreground">{subject?.code}</p>
                                </div>
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                                  {subject?.credits} Credits
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{subject?.description}</p>
                              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                                <div>
                                  <p className="text-xs text-muted-foreground">Department</p>
                                  <p className="text-sm font-medium">{subject?.department}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Semester</p>
                                  <p className="text-sm font-medium">Sem {subject?.semester}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border border-border shadow-sm">
                    <CardContent className="pt-12 pb-12 text-center">
                      <p className="text-muted-foreground">No subjects selected yet.</p>
                      <Button variant="link" className="text-primary mt-2">
                        <a href="/teacher/subjects">Browse subjects</a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {!teacherSelection && (
            <Card className="border border-border shadow-sm">
              <CardContent className="pt-12 pb-12 text-center">
                <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Selection Started</h3>
                <p className="text-muted-foreground mb-4">Begin by selecting your preferred subjects</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <a href="/teacher/subjects">Browse Subjects</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
