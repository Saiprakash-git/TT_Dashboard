'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">AcademiX</h1>
          <p className="text-lg text-muted-foreground">Teacher & Subject Allocation Platform</p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Portal */}
          <Card className="border-2 border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription>Manage teachers and subjects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Access the administration panel to manage teachers, subjects, and allocations for the semester.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Teacher Management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Subject Management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Allocation Review
                </li>
              </ul>
              <Button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full mt-4"
              >
                Access Admin
              </Button>
            </CardContent>
          </Card>

          {/* Teacher Portal */}
          <Card className="border-2 border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Teacher Portal</CardTitle>
              <CardDescription>Select and manage your subjects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Browse available subjects, submit your selections, and view your final allocations for the semester.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Subject Browser
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Submit Selections
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  View Allocations
                </li>
              </ul>
              <Button
                onClick={() => router.push('/teacher/dashboard')}
                className="w-full mt-4"
              >
                Access Teacher
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Automate teacher and subject selection for each semester
          </p>
        </div>
      </div>
    </div>
  );
}
