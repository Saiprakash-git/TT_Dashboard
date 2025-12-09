import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import SubjectsPage from "./pages/SubjectsPage";
import PreferencesPage from "./pages/PreferencesPage";
import AdminTeachersPage from "./pages/admin/TeachersPage";
import AdminSubjectsPage from "./pages/admin/SubjectsPage";
import AdminPreferencesPage from "./pages/admin/PreferencesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
            <Route path="/preferences" element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><AdminTeachersPage /></ProtectedRoute>} />
            <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['admin']}><AdminSubjectsPage /></ProtectedRoute>} />
            <Route path="/admin/preferences" element={<ProtectedRoute allowedRoles={['admin']}><AdminPreferencesPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
