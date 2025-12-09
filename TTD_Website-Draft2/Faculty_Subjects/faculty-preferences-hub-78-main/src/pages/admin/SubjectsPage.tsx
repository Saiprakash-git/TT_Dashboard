import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useSubjects } from '@/hooks/useSubjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BookOpen, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function AdminSubjectsPage() {
  const { subjects, isLoading, createSubject, deleteSubject } = useSubjects();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [credits, setCredits] = useState(3);
  const [semester, setSemester] = useState('');

  const handleCreate = async () => {
    await createSubject.mutateAsync({ name, code, description: description || null, credits, semester: semester || null });
    setOpen(false);
    setName(''); setCode(''); setDescription(''); setCredits(3); setSemester('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold">Manage Subjects</h1>
            <p className="text-muted-foreground">Add, edit, or remove subjects</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="accent"><Plus className="w-4 h-4" /> Add Subject</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Subject</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Data Structures" />
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input value={code} onChange={e => setCode(e.target.value)} placeholder="CS201" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Credits</Label>
                    <Input type="number" value={credits} onChange={e => setCredits(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Input value={semester} onChange={e => setSemester(e.target.value)} placeholder="Fall 2024" />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" variant="accent" disabled={createSubject.isPending || !name || !code}>
                  {createSubject.isPending ? <Loader2 className="animate-spin" /> : 'Create Subject'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : subjects.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No subjects created yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map(subject => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell className="font-mono text-sm">{subject.code}</TableCell>
                      <TableCell>{subject.credits}</TableCell>
                      <TableCell>{subject.semester || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteSubject.mutate(subject.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
