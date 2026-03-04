'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserRole } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password, role);
      router.push(role === 'admin' ? '/admin' : '/teacher');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const demoLogin = (demoEmail: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setPassword('password');
    setRole(demoRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary mx-auto mb-4">
            <span className="text-xl font-bold text-primary-foreground">AP</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Academic Platform</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Teacher and subject allocation management system
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Select your role and enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">User Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      role === 'admin'
                        ? 'border-primary bg-secondary text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary'
                    }`}
                  >
                    <div className="font-medium text-sm">Administrator</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      role === 'teacher'
                        ? 'border-primary bg-secondary text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary'
                    }`}
                  >
                    <div className="font-medium text-sm">Teacher</div>
                  </button>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-accent text-primary-foreground font-medium"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Login Buttons */}
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Demo Credentials
              </p>
              <button
                onClick={() => demoLogin('admin@university.edu', 'admin')}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Demo Admin
              </button>
              <button
                onClick={() => demoLogin('teacher@university.edu', 'teacher')}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Demo Teacher
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          For support contact: admin@university.edu
        </p>
      </div>
    </div>
  );
}
