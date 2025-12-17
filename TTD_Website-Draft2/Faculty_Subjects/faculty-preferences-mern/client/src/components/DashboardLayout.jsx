import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { NavLink } from './NavLink';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  ListOrdered,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/teachers', label: 'Teachers', icon: Users },
  { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/admin/preferences', label: 'Preferences', icon: BarChart3 },
  { href: '/admin/allocate', label: 'Allocate Subjects', icon: ListOrdered },
];

const teacherLinks = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/preferences', label: 'My Preferences', icon: ListOrdered },
  { href: '/profile', label: 'Profile', icon: User },
];

export function DashboardLayout({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = isAdmin ? adminLinks : teacherLinks;

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-lg font-semibold hidden sm:inline">EduPrefs</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="text-foreground bg-muted"
              >
                <link.icon className="w-4 h-4 inline mr-2" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {getInitials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline ml-2 text-sm">
                    {user?.fullName || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'md:hidden border-t border-border/50 bg-background transition-all duration-200 overflow-hidden',
            mobileMenuOpen ? 'max-h-64' : 'max-h-0'
          )}
        >
          <nav className="container py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="text-foreground bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="w-4 h-4 inline mr-2" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">{children}</main>
    </div>
  );
}
