'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LogOut, LayoutDashboard, BookOpen, CheckSquare, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeacherSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/teacher/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Browse Subjects',
      href: '/teacher/subjects',
      icon: BookOpen,
    },
    {
      label: 'My Selections',
      href: '/teacher/selections',
      icon: CheckSquare,
    },
    {
      label: 'My Allocations',
      href: '/teacher/allocations',
      icon: Award,
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="w-64 bg-primary text-primary-foreground border-r border-primary/20 flex flex-col">
      {/* Logo & User Info */}
      <div className="p-6 border-b border-primary/20">
        <h1 className="text-2xl font-bold">AcademiX</h1>
        <p className="text-xs text-primary-foreground/60 mt-1">Teacher Portal</p>
        <div className="mt-4 pt-4 border-t border-primary/20">
          <p className="text-xs text-primary-foreground/60">Logged in as</p>
          <p className="text-sm font-medium mt-1">{user?.name}</p>
          <p className="text-xs text-primary-foreground/60 mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-primary-foreground text-primary'
                  : 'text-primary-foreground hover:bg-primary/80'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary/20">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
