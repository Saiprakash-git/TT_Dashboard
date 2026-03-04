import { Teacher } from '@/lib/data-context';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

interface TeacherTableProps {
  teachers: Teacher[];
}

export default function TeacherTable({ teachers }: TeacherTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-secondary">
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Name</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Email</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Department</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Specialization</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Joined</th>
          <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Action</th>
        </tr>
      </thead>
      <tbody>
        {teachers.map((teacher) => (
          <tr key={teacher.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
            <td className="px-6 py-4 text-sm text-foreground font-medium">{teacher.name}</td>
            <td className="px-6 py-4 text-sm text-muted-foreground">{teacher.email}</td>
            <td className="px-6 py-4 text-sm text-muted-foreground">{teacher.department}</td>
            <td className="px-6 py-4 text-sm">
              <div className="flex flex-wrap gap-1">
                {teacher.specialization.slice(0, 2).map((spec) => (
                  <Badge key={spec} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                {teacher.specialization.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{teacher.specialization.length - 2}
                  </Badge>
                )}
              </div>
            </td>
            <td className="px-6 py-4 text-sm">
              <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                {teacher.status}
              </Badge>
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
              {new Date(teacher.joiningDate).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 text-sm">
              <button className="text-primary hover:text-primary/80 p-1.5 rounded hover:bg-primary/10 transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
