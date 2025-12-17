import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Form states
  const [facultyId, setFacultyId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!facultyId || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isFirstLogin) {
      if (!newPassword || !confirmPassword) {
        toast.error('Please set a new password');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
    }

    setIsLoading(true);
    const result = await login(facultyId, password, newPassword);
    setIsLoading(false);

    if (result.success) {
      // Check if this is first login
      if (result.isFirstLogin && !newPassword) {
        setIsFirstLogin(true);
        toast.info('Please set a new password for your account');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (signupName.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);
    const result = await register(signupEmail, signupPassword, signupName);
    setIsLoading(false);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      if (result.error?.includes('already')) {
        toast.error('An account with this email already exists. Please login instead.');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-surface">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">EduPrefs</h1>
            <p className="text-sm text-muted-foreground">Faculty Preference Portal</p>
          </div>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-serif">
              {isFirstLogin ? 'Set New Password' : 'Sign In'}
            </CardTitle>
            <CardDescription>
              {isFirstLogin
                ? 'Please create a new password for your account'
                : 'Sign in with your Faculty ID'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faculty-id">Faculty ID</Label>
                <Input
                  id="faculty-id"
                  type="text"
                  placeholder="Enter your Faculty ID"
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  disabled={isFirstLogin}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {isFirstLogin ? 'Current Password' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isFirstLogin}
                  required
                />
              </div>

              {isFirstLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {isFirstLogin ? 'Setting password...' : 'Signing in...'}
                  </>
                ) : isFirstLogin ? (
                  'Set Password & Sign In'
                ) : (
                  'Sign In'
                )}
              </Button>

              {isFirstLogin && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsFirstLogin(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Back to Sign In
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <BookOpen className="inline w-4 h-4 mr-1" />
          Secure faculty preference management system
        </p>
      </div>
    </div>
  );
}
