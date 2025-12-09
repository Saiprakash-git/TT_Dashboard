import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalTeachers: 0,
    totalPreferences: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [subjectsRes, usersRes, preferencesRes] = await Promise.all([
        api.get('/subjects'),
        isAdmin ? api.get('/users') : Promise.resolve({ data: { count: 0 } }),
        isAdmin ? api.get('/preferences') : api.get('/preferences/my/preference'),
      ]);

      setStats({
        totalSubjects: subjectsRes.data.count || 0,
        totalTeachers: usersRes.data.count || 0,
        totalPreferences: isAdmin ? preferencesRes.data.count || 0 : preferencesRes.data.data ? 1 : 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <h1>Welcome, {user?.fullName}!</h1>
        <p className="text-muted">
          Role: <strong>{user?.role}</strong>
        </p>

        <div className="dashboard-grid mt-4">
          <div className="stat-card">
            <h3>Total Subjects</h3>
            <p className="stat-number">{stats.totalSubjects}</p>
          </div>

          {isAdmin && (
            <>
              <div className="stat-card">
                <h3>Total Teachers</h3>
                <p className="stat-number">{stats.totalTeachers}</p>
              </div>

              <div className="stat-card">
                <h3>Preferences Submitted</h3>
                <p className="stat-number">{stats.totalPreferences}</p>
              </div>
            </>
          )}

          {!isAdmin && (
            <div className="stat-card">
              <h3>My Preferences</h3>
              <p className="stat-number">
                {stats.totalPreferences > 0 ? 'Submitted' : 'Not Submitted'}
              </p>
            </div>
          )}
        </div>

        {!isAdmin && (
          <div className="card mt-4">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <a href="/subjects" className="btn btn-primary">
                View Subjects
              </a>
              <a href="/preferences" className="btn btn-success">
                Manage Preferences
              </a>
              <a href="/profile" className="btn btn-secondary">
                Update Profile
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-card h3 {
          font-size: 16px;
          margin-bottom: 10px;
          opacity: 0.9;
        }

        .stat-number {
          font-size: 36px;
          font-weight: bold;
          margin: 0;
        }

        .text-muted {
          color: #666;
          margin-top: 5px;
        }

        .quick-actions {
          display: flex;
          gap: 15px;
          margin-top: 15px;
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
};

export default Dashboard;
