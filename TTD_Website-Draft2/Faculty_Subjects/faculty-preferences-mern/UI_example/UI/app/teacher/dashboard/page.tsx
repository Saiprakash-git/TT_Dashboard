'use client';

import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { selections, subjects, allocations } = useData();

  const teacherSelections = selections.filter(s => s.teacherId === user?.id);
  const teacherAllocations = allocations.filter(a => a.teacherId === user?.id);

  const stats = [
    {
      icon: BookOpen,
      label: 'Available Subjects',
      value: subjects.length,
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      label: 'Pending Selections',
      value: teacherSelections.filter(s => s.status === 'pending').length,
      color: 'text-orange-600'
    },
    {
      icon: CheckCircle,
      label: 'Submitted Selections',
      value: teacherSelections.filter(s => s.status === 'submitted').length,
      color: 'text-green-600'
    },
    {
      icon: AlertCircle,
      label: 'Allocated Subjects',
      value: teacherAllocations.length,
      color: 'text-purple-600'
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-white p-6">
        <h1 className="text-3xl font-bold text-primary">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground mt-1">Manage your subject selections and allocations</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border border-border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                      </div>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions and Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Actions */}
            <div className="lg:col-span-2">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Start or manage your allocations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="/teacher/subjects"
                    className="flex items-center justify-between p-4 rounded-md border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">View Available Subjects</p>
                      <p className="text-xs text-muted-foreground">Browse and select your preferred subjects</p>
                    </div>
                    <span className="text-primary text-lg">→</span>
                  </a>

                  <a
                    href="/teacher/selections"
                    className="flex items-center justify-between p-4 rounded-md border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">My Selections</p>
                      <p className="text-xs text-muted-foreground">View and submit your subject selections</p>
                    </div>
                    <span className="text-primary text-lg">→</span>
                  </a>

                  <a
                    href="/teacher/allocations"
                    className="flex items-center justify-between p-4 rounded-md border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">My Allocations</p>
                      <p className="text-xs text-muted-foreground">View your allocated subjects</p>
                    </div>
                    <span className="text-primary text-lg">→</span>
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="border border-border shadow-sm bg-secondary/30">
              <CardHeader>
                <CardTitle className="text-lg">Current Semester</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="text-2xl font-bold text-primary">Fall 2024</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Selection Deadline</p>
                  <p className="text-sm font-medium">Dec 31, 2024</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    <span className="text-sm font-medium text-green-700">Open</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
