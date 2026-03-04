import { Allocation, Teacher, Subject } from '@/lib/data-context';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface AllocationsTableProps {
  allocations: Allocation[];
  teachers: Teacher[];
  subjects: Subject[];
}

export default function AllocationsTable({ allocations, teachers, subjects }: AllocationsTableProps) {
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';
  const getSubjectCode = (id: string) => subjects.find(s => s.id === id)?.code || 'N/A';
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allocated':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (allocations.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">No allocations found yet.</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-secondary">
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Teacher</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Subject Code</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Subject Name</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Allocation Date</th>
        </tr>
      </thead>
      <tbody>
        {allocations.map((allocation) => (
          <tr key={allocation.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
            <td className="px-6 py-4 text-sm text-foreground font-medium">
              {getTeacherName(allocation.teacherId)}
            </td>
            <td className="px-6 py-4 text-sm text-primary font-semibold">
              {getSubjectCode(allocation.subjectId)}
            </td>
            <td className="px-6 py-4 text-sm text-foreground">
              {getSubjectName(allocation.subjectId)}
            </td>
            <td className="px-6 py-4 text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(allocation.status)}
                <Badge variant={allocation.status === 'allocated' ? 'default' : 'secondary'}>
                  {allocation.status}
                </Badge>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
              {new Date(allocation.allocationDate).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
