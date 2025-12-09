import { DashboardLayout } from '@/components/DashboardLayout';
import { useTeachers } from '@/hooks/useTeachers';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, CheckCircle2, Clock } from 'lucide-react';

export default function AdminTeachersPage() {
  const { teachers, isLoading } = useTeachers();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-serif font-semibold">Manage Teachers</h1>
          <p className="text-muted-foreground">View and manage faculty accounts</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : teachers.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No teachers registered yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map(teacher => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.full_name}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.department || '-'}</TableCell>
                      <TableCell>
                        {teacher.preference ? (
                          <Badge variant="default" className="bg-success text-success-foreground">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
