'use client';

import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => router.push('/teacher/dashboard')}>
            Switch to Teacher
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
