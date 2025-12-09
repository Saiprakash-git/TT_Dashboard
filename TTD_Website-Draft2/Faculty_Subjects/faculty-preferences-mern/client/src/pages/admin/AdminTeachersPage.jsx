import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const AdminTeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, preferencesRes] = await Promise.all([
        api.get('/users'),
        api.get('/preferences')
      ]);
      setTeachers(teachersRes.data.data);
      setPreferences(preferencesRes.data.data || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Create a map of teacher IDs to their preference status
  const preferenceMap = useMemo(() => {
    const map = new Map();
    preferences.forEach(pref => {
      map.set(pref.teacher?._id, pref);
    });
    return map;
  }, [preferences]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      setMessage('User deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading teachers...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container teachers-container">
        <div className="page-header">
          <h1>👥 Manage Teachers</h1>
          <p className="subtitle">View and manage faculty accounts and preference submission status</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <div className="card-header">
            <h2>Teachers List ({teachers.length})</h2>
          </div>
          <div className="card-body">
            {teachers.length === 0 ? (
              <div className="empty-state">
                <p>No teachers registered yet</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table teachers-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Phone</th>
                      <th>Preference Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => {
                      const hasPreference = preferenceMap.has(teacher._id);
                      return (
                        <tr key={teacher._id}>
                          <td className="name-cell">
                            <strong>{teacher.fullName}</strong>
                          </td>
                          <td className="email-cell">{teacher.email}</td>
                          <td>
                            <span
                              className={`badge ${
                                teacher.role === 'admin' ? 'badge-admin' : 'badge-teacher'
                              }`}
                            >
                              {teacher.role.charAt(0).toUpperCase() + teacher.role.slice(1)}
                            </span>
                          </td>
                          <td>{teacher.department || '-'}</td>
                          <td>{teacher.designation || '-'}</td>
                          <td>{teacher.phone || '-'}</td>
                          <td className="status-cell">
                            {hasPreference ? (
                              <span className="status-badge status-submitted">
                                ✓ Submitted
                              </span>
                            ) : (
                              <span className="status-badge status-pending">
                                ⏱ Pending
                              </span>
                            )}
                          </td>
                          <td className="action-cell">
                            <button
                              onClick={() => handleDelete(teacher._id)}
                              className="btn btn-sm btn-danger"
                              disabled={teacher.role === 'admin'}
                              title={teacher.role === 'admin' ? 'Cannot delete admin users' : 'Delete this user'}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .teachers-container {
          max-width: 1200px;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #2c3e50;
        }

        .page-header .subtitle {
          color: #7f8c8d;
          margin: 0;
        }

        .card {
          border: 1px solid #e0e6ed;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e0e6ed;
          background: #f8f9fa;
        }

        .card-header h2 {
          margin: 0;
          font-size: 16px;
          color: #2c3e50;
          font-weight: 600;
        }

        .card-body {
          padding: 0;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .teachers-table {
          width: 100%;
          border-collapse: collapse;
        }

        .teachers-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e0e6ed;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .teachers-table td {
          padding: 12px;
          border-bottom: 1px solid #e8ecf1;
          font-size: 14px;
        }

        .teachers-table tbody tr:hover {
          background: #f8f9fa;
        }

        .name-cell {
          color: #2c3e50;
          font-weight: 500;
        }

        .email-cell {
          color: #7f8c8d;
          font-size: 13px;
        }

        .status-cell {
          text-align: center;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-submitted {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-pending {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .action-cell {
          text-align: center;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-admin {
          background-color: #dc3545;
          color: white;
        }

        .badge-teacher {
          background-color: #007bff;
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #c82333;
        }

        .btn-danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #7f8c8d;
        }

        @media (max-width: 768px) {
          .teachers-table {
            font-size: 12px;
          }

          .teachers-table th,
          .teachers-table td {
            padding: 8px;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .page-header .subtitle {
            font-size: 13px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default AdminTeachersPage;
