import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useSubjects } from '../hooks/useSubjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

export default function SubjectsPage() {
  const { subjects, isLoading } = useSubjects();
  const [allocations, setAllocations] = useState([]);
  const [allocLoading, setAllocLoading] = useState(true);

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const res = await api.get('/allocations/my-subjects');
        setAllocations(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch allocations', err);
      } finally {
        setAllocLoading(false);
      }
    };

    fetchAllocations();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight" style={{fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em'}}>Subjects</h1>
          <p className="text-muted-foreground">View your allocated subjects and browse all available offerings.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Allocated Subjects</CardTitle>
                <CardDescription>Subjects assigned to you after allocation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {allocLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : allocations.length === 0 ? (
              <div className="py-6 text-muted-foreground text-sm">No allocations yet.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {allocations.map((alloc, idx) => (
                  <Card key={alloc._id || idx} className="border-accent/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{alloc.subject?.name || 'Subject'}</CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {alloc.subject?.code || 'N/A'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 text-accent">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-semibold">Allocated</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {alloc.subject?.program && (
                          <Badge variant="secondary">{alloc.subject.program}</Badge>
                        )}
                        {alloc.subject?.semester && (
                          <Badge variant="outline">{alloc.subject.semester}</Badge>
                        )}
                        {alloc.academicYear && (
                          <Badge variant="outline">AY {alloc.academicYear}</Badge>
                        )}
                        {alloc.subject?.credits ? (
                          <Badge variant="outline">{alloc.subject.credits} cr</Badge>
                        ) : null}
                      </div>
                      {alloc.subject?.description && (
                        <p className="text-sm text-muted-foreground">{alloc.subject.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Available Subjects</h2>
          <p className="text-sm text-muted-foreground">Browse all subjects available for preference selection</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No subjects available</h3>
              <p className="text-sm text-muted-foreground">Check back later for available subjects</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, index) => (
              <Card
                key={subject._id}
                className="animate-slide-up hover:shadow-md transition-shadow"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">{subject.code}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm font-medium">{subject.credits} cr</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {subject.description && (
                    <p className="text-sm text-muted-foreground mb-3">{subject.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {subject.program && <Badge variant="secondary">{subject.program}</Badge>}
                    {subject.semester && <Badge variant="outline">{subject.semester}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
