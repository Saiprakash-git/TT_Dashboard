import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import SubjectsPage from './pages/SubjectsPage';
import PreferencesPage from './pages/PreferencesPage';
import AdminSubjectsPage from './pages/admin/AdminSubjectsPage';
import AdminTeachersPage from './pages/admin/AdminTeachersPage';
import AdminPreferencesPage from './pages/admin/AdminPreferencesPage';
import AllocateSubjectsPage from './pages/admin/AllocateSubjectsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <SubjectsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <PreferencesPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSubjectsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTeachersPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/preferences"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPreferencesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/allocate"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AllocateSubjectsPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
