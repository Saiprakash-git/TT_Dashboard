import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';

const AdminSubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    semester: '',
    program: 'B.E/B.Tech',
    professionalElective: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.data);
    } catch (err) {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, formData);
        setMessage('Subject updated successfully!');
      } else {
        await api.post('/subjects', formData);
        setMessage('Subject created successfully!');
      }

      fetchSubjects();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      credits: subject.credits,
      semester: subject.semester || '',
      program: subject.program || 'B.E/B.Tech',
      professionalElective: Boolean(subject.professionalElective),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.delete(`/subjects/${id}`);
      setMessage('Subject deleted successfully!');
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: 3,
      semester: '',
      program: 'B.E/B.Tech',
      professionalElective: false,
    });
    setError('');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Loading subjects...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container subjects-container">
        <div className="page-header">
          <div>
            <h1>📚 Manage Subjects</h1>
            <p className="subtitle">Create, edit, and organize course offerings</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg">
            + Add New Subject
          </button>
        </div>

        {message && (
          <div className="alert alert-success">
            <span>✓</span> {message}
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <span>✕</span> {error}
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>Subjects List ({subjects.length})</h2>
          </div>
          <div className="card-body">
            {subjects.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">📭</p>
                <p className="empty-text">No subjects created yet</p>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                  Create First Subject
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table subjects-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Program</th>
                      <th>Credits</th>
                      <th>Semester</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject._id}>
                        <td className="code-cell">
                          <strong>{subject.code}</strong>
                        </td>
                        <td className="name-cell">{subject.name}</td>
                        <td className="program-cell">
                          <span className={`program-badge ${subject.program === 'B.E/B.Tech' ? 'badge-blue' : 'badge-purple'}`}>
                            {subject.program}
                          </span>
                        </td>
                        <td className="credits-cell">{subject.credits}</td>
                        <td className="semester-cell">{subject.semester || '-'}</td>
                        <td className="program-cell">
                          {subject.professionalElective ? (
                            <span className="program-badge badge-green">Professional Elective</span>
                          ) : (
                            <span className="program-badge badge-gray">Core</span>
                          )}
                        </td>
                        <td className="description-cell">
                          {subject.description || '-'}
                        </td>
                        <td className="action-cell">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="btn btn-sm btn-secondary"
                            title="Edit subject"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(subject._id)}
                            className="btn btn-sm btn-danger"
                            title="Delete subject"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingSubject ? '✏️ Edit Subject' : '📚 Add New Subject'}</h2>
                <button onClick={handleCloseModal} className="modal-close-btn">✕</button>
              </div>

              {error && (
                <div className="modal-error">
                  <span>✕</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                  <label htmlFor="code">Subject Code *</label>
                  <input
                    id="code"
                    type="text"
                    className="form-control"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="CS201"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Subject Name *</label>
                  <input
                    id="name"
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Data Structures"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="credits">Credits *</label>
                    <input
                      id="credits"
                      type="number"
                      className="form-control"
                      value={formData.credits}
                      onChange={(e) =>
                        setFormData({ ...formData, credits: parseInt(e.target.value) })
                      }
                      min="1"
                      max="10"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="semester">Semester</label>
                    <input
                      id="semester"
                      type="text"
                      className="form-control"
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      placeholder="Fall 2024"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="program">Program *</label>
                  <select
                    id="program"
                    className="form-control"
                    value={formData.program}
                    onChange={(e) =>
                      setFormData({ ...formData, program: e.target.value })
                    }
                    required
                  >
                    <option value="B.E/B.Tech">B.E/B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="professionalElective">Professional Elective</label>
                  <div className="toggle-row">
                    <input
                      id="professionalElective"
                      type="checkbox"
                      checked={formData.professionalElective}
                      onChange={(e) => setFormData({ ...formData, professionalElective: e.target.checked })}
                    />
                    <span className="toggle-help">Enable to mark this subject as a Professional Elective</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    className="form-control"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting || !formData.name || !formData.code}
                  >
                    {isSubmitting ? '⏳ Processing...' : (editingSubject ? '💾 Update' : '✚ Create')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          .subjects-container {
            max-width: 1200px;
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            gap: 20px;
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

          .btn-lg {
            padding: 10px 24px;
            font-size: 15px;
          }

          .card {
            border: 1px solid #e0e6ed;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-radius: 6px;
            overflow: hidden;
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

          .subjects-table {
            width: 100%;
            border-collapse: collapse;
          }

          .subjects-table th {
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

          .subjects-table td {
            padding: 12px;
            border-bottom: 1px solid #e8ecf1;
            font-size: 14px;
          }

          .subjects-table tbody tr:hover {
            background: #f8f9fa;
          }

          .code-cell {
            font-family: 'Monaco', 'Courier New', monospace;
            font-weight: 600;
            color: #2c3e50;
          }

          .name-cell {
            font-weight: 500;
            color: #2c3e50;
          }

          .credits-cell {
            text-align: center;
            background: #f0f4ff;
            border-radius: 3px;
            padding: 6px 12px !important;
            display: inline-block;
            width: 40px;
            text-align: center;
          }

          .semester-cell {
            color: #7f8c8d;
            font-size: 13px;
          }

          .description-cell {
            color: #666;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 13px;
          }

          .action-cell {
            display: flex;
            gap: 8px;
          }

          .btn-secondary {
            background-color: #6c757d;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
          }

          .btn-secondary:hover {
            background-color: #5a6268;
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

          .btn-danger:hover {
            background-color: #c82333;
          }

          .empty-state {
            padding: 60px 20px;
            text-align: center;
            color: #7f8c8d;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .empty-text {
            margin-bottom: 20px;
            font-size: 16px;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: white;
            border-radius: 8px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #e0e6ed;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 20px;
            color: #2c3e50;
          }

          .modal-close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #7f8c8d;
          }

          .modal-close-btn:hover {
            color: #2c3e50;
          }

          .modal-error {
            margin: 0 24px 20px 24px;
            padding: 12px;
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .form {
            padding: 0 24px 24px 24px;
          }

          .form-group {
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
          }

          .form-group label {
            font-weight: 500;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 14px;
          }

          .form-control {
            padding: 10px 12px;
            border: 1px solid #d0d0d0;
            border-radius: 4px;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.2s;
          }

          .form-control:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e0e6ed;
          }

          .btn-success {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          }

          .btn-success:hover:not(:disabled) {
            background-color: #218838;
          }

          .btn-success:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .alert {
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
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

          .program-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .badge-blue {
            background: #e3f2fd;
            color: #1976d2;
          }

          .badge-purple {
            background: #f3e5f5;
            color: #7b1fa2;
          }

          .badge-green {
            background: #e8f5e9;
            color: #388e3c;
          }

          .badge-gray {
            background: #f1f3f5;
            color: #495057;
          }

          .toggle-row { display:flex; align-items:center; gap:10px; }
          .toggle-help { color:#7f8c8d; font-size:12px; }

          @media (max-width: 768px) {
            .page-header {
              flex-direction: column;
            }

            .form-row {
              grid-template-columns: 1fr;
            }

            .subjects-table {
              font-size: 12px;
            }

            .subjects-table th,
            .subjects-table td {
              padding: 8px;
            }

            .page-header h1 {
              font-size: 24px;
            }

            .modal-content {
              max-height: 95vh;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default AdminSubjectsPage;
