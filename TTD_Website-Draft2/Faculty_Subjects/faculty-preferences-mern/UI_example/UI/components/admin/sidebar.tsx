'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LogOut, LayoutDashboard, Users, BookOpen, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Teachers',
      href: '/admin/teachers',
      icon: Users,
    },
    {
      label: 'Subjects',
      href: '/admin/subjects',
      icon: BookOpen,
    },
    {
      label: 'Allocations',
      href: '/admin/allocations',
      icon: Clipboard,
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="w-64 bg-primary text-primary-foreground border-r border-primary/20 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary/20">
        <h1 className="text-2xl font-bold">AcademiX</h1>
        <p className="text-xs text-primary-foreground/60 mt-1">Administration</p>
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
