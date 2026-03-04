import { Subject } from '@/lib/data-context';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

interface SubjectTableProps {
  subjects: Subject[];
}

export default function SubjectTable({ subjects }: SubjectTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-secondary">
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Code</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Name</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Department</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Semester</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Credits</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Capacity</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
        </tr>
      </thead>
      <tbody>
        {subjects.map((subject) => (
          <tr key={subject.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
            <td className="px-6 py-4 text-sm font-medium text-primary">{subject.code}</td>
            <td className="px-6 py-4 text-sm text-foreground font-medium">{subject.name}</td>
            <td className="px-6 py-4 text-sm text-muted-foreground">{subject.department}</td>
            <td className="px-6 py-4 text-sm">
              <Badge variant="secondary">Sem {subject.semester}</Badge>
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">{subject.credits}</td>
            <td className="px-6 py-4 text-sm text-muted-foreground">{subject.maxCapacity}</td>
            <td className="px-6 py-4 text-sm">
              <div className="flex gap-2">
                <button className="text-primary hover:text-primary/80 p-1.5 rounded hover:bg-primary/10 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-destructive hover:text-destructive/80 p-1.5 rounded hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
