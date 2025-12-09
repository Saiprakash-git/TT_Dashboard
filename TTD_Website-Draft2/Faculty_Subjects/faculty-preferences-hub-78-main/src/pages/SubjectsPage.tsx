import { DashboardLayout } from '@/components/DashboardLayout';
import { useSubjects } from '@/hooks/useSubjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, GraduationCap } from 'lucide-react';

export default function SubjectsPage() {
  const { subjects, isLoading } = useSubjects();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-semibold tracking-tight">Available Subjects</h1>
          <p className="text-muted-foreground">
            Browse all subjects available for preference selection
          </p>
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
              <p className="text-sm text-muted-foreground">
                Check back later for available subjects
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, index) => (
              <Card
                key={subject.id}
                className="animate-slide-up hover:shadow-md transition-shadow"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {subject.code}
                      </CardDescription>
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
                  {subject.semester && (
                    <Badge variant="secondary">{subject.semester}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
