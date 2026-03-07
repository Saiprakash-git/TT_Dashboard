import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  { href: '/admin/preferences/forms', label: 'Preference Forms', icon: BarChart3 },
  { href: '/admin/preferences', label: 'View Submissions', icon: BarChart3 },
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
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = isAdmin ? adminLinks : teacherLinks;

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className="p-6 border-b border-primary-foreground/10 bg-primary/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white mb-0.5">EduPrefs</h1>
            <p className="text-[10px] font-medium text-primary-foreground/70 uppercase tracking-widest">
              {isAdmin ? 'Administration' : 'Faculty Portal'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.href) && (link.href !== '/dashboard' || location.pathname === '/dashboard');
          
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold group relative overflow-hidden",
                isActive
                  ? "bg-white text-primary shadow-md transform scale-[1.02]"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-white"
              )}
            >
              <link.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-primary-foreground/70 group-hover:text-white")} />
              <span className="relative z-10">{link.label}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-md" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-primary-foreground/10 backdrop-blur-md bg-primary/10">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full bg-transparent border-primary-foreground/20 text-white hover:bg-rose-500 hover:text-white hover:border-transparent flex justify-center gap-2 h-11 transition-all rounded-xl"
        >
          <LogOut className="w-4 h-4" />
          Secure Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden text-foreground antialiased selection:bg-primary/20">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-primary gradient-primary text-white border-r border-slate-200/20 shadow-2xl relative z-40">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Header */}
        <header className="h-16 min-h-[4rem] flex items-center justify-between px-6 bg-white border-b border-slate-200/60 shadow-sm z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 -ml-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight hidden sm:block">
              {navLinks.find(link => location.pathname.startsWith(link.href) && (link.href !== '/dashboard' || location.pathname === '/dashboard'))?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1.5 bg-slate-100/50 rounded-full border border-slate-200/50 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Portal Online
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 px-2 rounded-full hover:bg-slate-100 flex items-center gap-2 group transition-all">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                      {getInitials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start mr-1">
                    <span className="text-sm font-semibold text-slate-800 leading-none mb-1">
                      {user?.fullName || 'User'}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 leading-none tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 shadow-xl border-slate-200/60 rounded-xl overflow-hidden p-1">
                <div className="px-3 py-2.5 bg-slate-50/80 mb-1">
                  <p className="text-sm font-bold text-slate-800">{user?.fullName}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg cursor-pointer py-2.5 font-medium">
                  <User className="w-4 h-4 mr-2.5 text-slate-500" />
                  My Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer py-2.5 font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50">
                  <LogOut className="w-4 h-4 mr-2.5" />
                  Sign Out Securely
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Children Box */}
        <div className="flex-1 overflow-auto bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in w-full pb-20">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="absolute left-0 top-0 bottom-0 w-3/4 max-w-sm bg-primary gradient-primary text-white shadow-2xl animate-slide-in-right flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent isMobile />
          </div>
        </div>
      )}
    </div>
  );
}
