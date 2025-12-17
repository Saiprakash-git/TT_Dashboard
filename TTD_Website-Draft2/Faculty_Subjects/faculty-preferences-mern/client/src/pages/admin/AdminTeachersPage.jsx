import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';
import { toast } from 'sonner';

const initialForm = {
  fullName: '',
  email: '',
  facultyId: '',
  department: '',
  designation: '',
  phone: '',
  password: '',
};

const AdminTeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, preferencesRes] = await Promise.all([
        api.get('/users'),
        api.get('/preferences'),
      ]);
      setTeachers(teachersRes.data.data || []);
      setPreferences(preferencesRes.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const preferenceMap = useMemo(() => {
    const map = new Map();
    preferences.forEach((pref) => {
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
      console.error('Failed to delete user:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!form.fullName || !form.email || !form.facultyId) {
      setError('Full name, email, and faculty ID are required.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/users/create-teacher', form);
      toast.success('Teacher created successfully');
      setForm(initialForm);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create teacher';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleEdit = async (teacherId) => {
    setToggling(teacherId);
    try {
      const res = await api.put(`/users/${teacherId}/toggle-preference-edit`);
      const updated = res.data?.data;
      setTeachers((prev) => prev.map((t) => (t._id === teacherId ? updated : t)));
      toast.success(`Preference editing ${updated.canEditPreferences ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to update permission:', err);
    } finally {
      setToggling('');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Loading teachers...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container teachers-container">
        <div className="page-header">
          <h1>👥 Manage Teachers</h1>
          <p className="subtitle">Create faculty accounts, control preference editing, and track submissions</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card form-card">
          <div className="card-header">
            <h2>Add Teacher</h2>
            <p className="muted">Faculty ID is required for login. Leave password blank to force first-time reset.</p>
          </div>
          <div className="card-body">
            <form className="teacher-form" onSubmit={handleCreate}>
              <div className="form-grid">
                <label>
                  <span>Full Name *</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Email *</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Faculty ID *</span>
                  <input
                    type="text"
                    value={form.facultyId}
                    onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Department</span>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </label>
                <label>
                  <span>Designation</span>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>
                <label>
                  <span>Temp Password</span>
                  <input
                    type="text"
                    value={form.password}
                    placeholder="Leave empty to require reset"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Teacher'}
              </button>
            </form>
          </div>
        </div>

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
                      <th>Faculty ID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Can Edit Prefs</th>
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
                      const canEdit = teacher.canEditPreferences;
                      const isAdmin = teacher.role === 'admin';
                      return (
                        <tr key={teacher._id}>
                          <td className="name-cell">
                            <strong>{teacher.fullName}</strong>
                          </td>
                          <td className="mono">{teacher.facultyId || '-'}</td>
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
                          <td className="status-cell">
                            <span className={`status-badge ${canEdit ? 'status-submitted' : 'status-pending'}`}>
                              {canEdit ? 'Allowed' : 'Disabled'}
                            </span>
                            {!isAdmin && (
                              <button
                                className="btn btn-xs btn-secondary"
                                onClick={() => handleToggleEdit(teacher._id)}
                                disabled={toggling === teacher._id}
                              >
                                {toggling === teacher._id ? 'Updating...' : canEdit ? 'Disable' : 'Allow'}
                              </button>
                            )}
                          </td>
                          <td>{teacher.department || '-'}</td>
                          <td>{teacher.designation || '-'}</td>
                          <td>{teacher.phone || '-'}</td>
                          <td className="status-cell">
                            {hasPreference ? (
                              <span className="status-badge status-submitted">✓ Submitted</span>
                            ) : (
                              <span className="status-badge status-pending">⏱ Pending</span>
                            )}
                          </td>
                          <td className="action-cell">
                            <button
                              onClick={() => handleDelete(teacher._id)}
                              className="btn btn-sm btn-danger"
                              disabled={isAdmin}
                              title={isAdmin ? 'Cannot delete admin users' : 'Delete this user'}
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
          background: #fff;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 20px;
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

        .card-header .muted {
          margin: 6px 0 0 0;
          color: #7f8c8d;
          font-size: 13px;
        }

        .card-body {
          padding: 16px 20px 20px 20px;
        }

        .form-card .card-body {
          padding-top: 0;
        }

        .teacher-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px 16px;
        }

        .form-grid label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: #2c3e50;
          font-weight: 600;
        }

        .form-grid input {
          padding: 10px 12px;
          border: 1px solid #d1d9e6;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-grid input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
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
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
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

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
          padding: 10px 16px;
        }

        .btn-secondary {
          background-color: #f1f3f5;
          color: #2c3e50;
          padding: 6px 10px;
          border: 1px solid #d1d9e6;
        }

        .btn-xs {
          font-size: 12px;
          padding: 6px 10px;
        }

        .btn-sm {
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

        .btn-danger {
          background-color: #dc3545;
          color: white;
          border: none;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #c82333;
        }

        .btn-danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mono {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 13px;
          color: #2c3e50;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #7f8c8d;
        }

        .alert {
          padding: 12px 14px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-weight: 600;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
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
    </DashboardLayout>
  );
};

export default AdminTeachersPage;
