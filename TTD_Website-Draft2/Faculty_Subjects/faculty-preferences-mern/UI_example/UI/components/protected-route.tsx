'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/');
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.push('/');
    }
  }, [user, router, requiredRole]);

  if (!mounted || !user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
