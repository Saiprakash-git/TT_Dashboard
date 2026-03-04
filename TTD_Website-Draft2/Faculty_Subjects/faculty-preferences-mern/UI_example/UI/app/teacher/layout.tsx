'use client';

import { useRouter } from 'next/navigation';
import TeacherSidebar from '@/components/teacher/sidebar';
import { Button } from '@/components/ui/button';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-background">
      <TeacherSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Teacher Portal</h1>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Switch to Admin
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
