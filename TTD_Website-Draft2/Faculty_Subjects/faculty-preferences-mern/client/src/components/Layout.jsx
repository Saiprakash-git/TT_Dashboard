import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <Link to="/dashboard">Faculty Preferences</Link>
          </div>
          <div className="nav-links">
            <Link
              to="/dashboard"
              className={isActive('/dashboard') ? 'active' : ''}
            >
              Dashboard
            </Link>
            {!isAdmin && (
              <>
                <Link
                  to="/subjects"
                  className={isActive('/subjects') ? 'active' : ''}
                >
                  Subjects
                </Link>
                <Link
                  to="/preferences"
                  className={isActive('/preferences') ? 'active' : ''}
                >
                  My Preferences
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link
                  to="/admin/subjects"
                  className={isActive('/admin/subjects') ? 'active' : ''}
                >
                  Manage Subjects
                </Link>
                <Link
                  to="/admin/teachers"
                  className={isActive('/admin/teachers') ? 'active' : ''}
                >
                  Manage Teachers
                </Link>
                <Link
                  to="/admin/preferences"
                  className={isActive('/admin/preferences') ? 'active' : ''}
                >
                  View Preferences
                </Link>
              </>
            )}
            <Link
              to="/profile"
              className={isActive('/profile') ? 'active' : ''}
            >
              Profile
            </Link>
          </div>
          <div className="nav-user">
            <span>{user?.fullName}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
