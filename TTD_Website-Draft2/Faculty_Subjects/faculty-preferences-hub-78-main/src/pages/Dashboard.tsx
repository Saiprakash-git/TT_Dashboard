import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useAllPreferences } from '@/hooks/usePreferences';
import { BookOpen, Users, ListOrdered, BarChart3, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function Dashboard() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const { subjects } = useSubjects();
  const { teachers } = useTeachers();
  const { data: allPreferences = [] } = useAllPreferences();

  const isAdmin = role === 'admin';

  // Stats for admin
  const teacherCount = teachers.length;
  const subjectCount = subjects.length;
  const preferencesSubmitted = allPreferences.length;
  const pendingPreferences = teacherCount - preferencesSubmitted;

  // Get current user's preference
  const userPreference = allPreferences.find((p) => p.teacher_id === profile?.id);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-semibold tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Here's an overview of the faculty preference system"
              : 'Manage your subject preferences and profile'}
          </p>
        </div>

        {isAdmin ? (
          // Admin Dashboard
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="animate-slide-up stagger-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Teachers
                  </CardTitle>
                  <Users className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teacherCount}</div>
                  <p className="text-xs text-muted-foreground">Registered faculty members</p>
                </CardContent>
              </Card>

              <Card className="animate-slide-up stagger-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Subjects
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subjectCount}</div>
                  <p className="text-xs text-muted-foreground">Available for selection</p>
                </CardContent>
              </Card>

              <Card className="animate-slide-up stagger-3">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Submitted
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{preferencesSubmitted}</div>
                  <p className="text-xs text-muted-foreground">Preference lists received</p>
                </CardContent>
              </Card>

              <Card className="animate-slide-up stagger-4">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingPreferences}</div>
                  <p className="text-xs text-muted-foreground">Awaiting submission</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/teachers')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-accent" />
                    Manage Teachers
                  </CardTitle>
                  <CardDescription>View and manage faculty accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto text-accent hover:text-accent/80">
                    View all teachers <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/subjects')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Manage Subjects
                  </CardTitle>
                  <CardDescription>Add, edit, or remove subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto text-accent hover:text-accent/80">
                    View all subjects <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/preferences')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    View Preferences
                  </CardTitle>
                  <CardDescription>Analyze and export preference data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto text-accent hover:text-accent/80">
                    View analytics <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          // Teacher Dashboard
          <>
            {/* Status Card */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-accent" />
                  Your Preference Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userPreference ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Preferences submitted</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You've ranked {userPreference.subject_ids.length} subject(s). Last updated:{' '}
                      {new Date(userPreference.updated_at).toLocaleDateString()}
                    </p>
                    <Button onClick={() => navigate('/preferences')}>
                      Edit Preferences <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-warning">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">No preferences submitted yet</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Browse available subjects and submit your ranked preference list.
                    </p>
                    <Button variant="accent" onClick={() => navigate('/preferences')}>
                      Submit Preferences <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/subjects')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Browse Subjects
                  </CardTitle>
                  <CardDescription>View all available subjects for this semester</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {subjectCount} subject(s) available
                  </p>
                  <Button variant="ghost" className="p-0 h-auto text-accent hover:text-accent/80">
                    View subjects <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/profile')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-accent" />
                    Your Profile
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {profile?.department || 'Department not set'}
                  </p>
                  <Button variant="ghost" className="p-0 h-auto text-accent hover:text-accent/80">
                    Edit profile <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
