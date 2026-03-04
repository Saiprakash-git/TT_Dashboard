'use client';

import { useData } from '@/lib/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ClipboardList, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/admin/stats-card';
import RecentActivityCard from '@/components/admin/recent-activity';

export default function AdminDashboard() {
  const { teachers, subjects, selections, allocations } = useData();

  const stats = [
    {
      icon: Users,
      label: 'Total Teachers',
      value: teachers.length,
      description: 'Active faculty members'
    },
    {
      icon: BookOpen,
      label: 'Total Subjects',
      value: subjects.length,
      description: 'Courses available'
    },
    {
      icon: ClipboardList,
      label: 'Pending Selections',
      value: selections.filter(s => s.status === 'pending').length,
      description: 'Awaiting teacher input'
    },
    {
      icon: TrendingUp,
      label: 'Completed Allocations',
      value: allocations.filter(a => a.status === 'allocated').length,
      description: 'Successfully assigned'
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-white p-6">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to the administration panel</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivityCard />
            </div>

            {/* Quick Info */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href="/admin/teachers" className="block p-3 rounded-md border border-border hover:bg-secondary transition-colors text-center font-medium text-primary hover:text-primary/90">
                  Manage Teachers
                </a>
                <a href="/admin/subjects" className="block p-3 rounded-md border border-border hover:bg-secondary transition-colors text-center font-medium text-primary hover:text-primary/90">
                  Manage Subjects
                </a>
                <a href="/admin/allocations" className="block p-3 rounded-md border border-border hover:bg-secondary transition-colors text-center font-medium text-primary hover:text-primary/90">
                  View Allocations
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
