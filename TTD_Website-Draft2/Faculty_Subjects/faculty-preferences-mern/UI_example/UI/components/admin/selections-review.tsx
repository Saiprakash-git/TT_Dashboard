import { TeacherSubjectSelection, Teacher, Subject } from '@/lib/data-context';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SelectionsReviewProps {
  selections: TeacherSubjectSelection[];
  teachers: Teacher[];
  subjects: Subject[];
}

export default function SelectionsReview({ selections, teachers, subjects }: SelectionsReviewProps) {
  const getTeacherName = (id: string) => {
    return teachers.find(t => t.id === id)?.name || 'Unknown';
  };

  const getSubjectNames = (ids: string[]) => {
    return ids.map(id => subjects.find(s => s.id === id)?.name || 'Unknown').join(', ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'submitted':
        return <CheckCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-50 border-orange-200';
      case 'submitted':
        return 'bg-green-50 border-green-200';
      case 'approved':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  if (selections.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">No selections found yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {selections.map((selection) => (
        <div key={selection.id} className={`p-6 border-l-4 ${
          selection.status === 'pending' ? 'border-l-orange-600' :
          selection.status === 'submitted' ? 'border-l-green-600' :
          'border-l-blue-600'
        } ${getStatusColor(selection.status)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="font-semibold text-foreground">{getTeacherName(selection.teacherId)}</p>
              <p className="text-sm text-muted-foreground mt-1">Semester {selection.semesterId}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(selection.status)}
              <Badge variant="outline" className="capitalize">
                {selection.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Selected Subjects ({selection.selectedSubjects.length})</p>
              <p className="text-sm text-foreground mt-1">{getSubjectNames(selection.selectedSubjects)}</p>
            </div>
            {selection.submittedAt && (
              <p className="text-xs text-muted-foreground">
                Submitted: {new Date(selection.submittedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
