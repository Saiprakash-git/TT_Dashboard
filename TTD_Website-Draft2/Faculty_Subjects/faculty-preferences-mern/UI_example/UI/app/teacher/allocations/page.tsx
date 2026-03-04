'use client';

import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export default function AllocationsPage() {
  const { user } = useAuth();
  const { allocations, subjects } = useData();

  const teacherAllocations = allocations.filter(a => a.teacherId === user?.id);

  const allocatedSubjects = teacherAllocations
    .map(allocation => {
      const subject = subjects.find(s => s.id === allocation.subjectId);
      return {
        ...allocation,
        subject
      };
    })
    .filter(a => a.subject);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allocated':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'allocated':
        return 'bg-green-50';
      case 'pending':
        return 'bg-orange-50';
      case 'rejected':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-white p-6">
        <h1 className="text-3xl font-bold text-primary">My Allocations</h1>
        <p className="text-muted-foreground mt-1">View your allocated subjects for the semester</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-border shadow-sm">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Allocations</p>
                  <p className="text-3xl font-bold text-primary mt-2">{teacherAllocations.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border shadow-sm">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Allocated</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {teacherAllocations.filter(a => a.status === 'allocated').length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border shadow-sm">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {teacherAllocations.filter(a => a.status === 'pending').length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allocations List */}
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">Allocation Details</h2>
            {allocatedSubjects.length > 0 ? (
              <div className="space-y-4">
                {allocatedSubjects.map((allocation) => (
                  <Card key={allocation.id} className={`border border-border shadow-sm ${getStatusBgColor(allocation.status)}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div>
                              <p className="font-semibold text-foreground text-lg">{allocation.subject?.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">{allocation.subject?.code}</p>
                              <p className="text-xs text-muted-foreground mt-2">{allocation.subject?.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center justify-end gap-2">
                            {getStatusIcon(allocation.status)}
                            <span className="text-sm font-medium capitalize">{allocation.status}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(allocation.allocationDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Subject Details Grid */}
                      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p className="text-sm font-medium mt-1">{allocation.subject?.department}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Semester</p>
                          <p className="text-sm font-medium mt-1">Sem {allocation.subject?.semester}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Credits</p>
                          <p className="text-sm font-medium mt-1">{allocation.subject?.credits}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Capacity</p>
                          <p className="text-sm font-medium mt-1">{allocation.subject?.maxCapacity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border shadow-sm">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-muted-foreground">No allocations yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Allocations will appear here once they are processed by administrators.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
