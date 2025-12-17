import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';

const AdminPreferencesPage = () => {
  const [allPreferences, setAllPreferences] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPreference, setSelectedPreference] = useState(null);
  
  // Filter states
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [topN, setTopN] = useState('all');
  const [customTopN, setCustomTopN] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prefResponse, subjectsResponse] = await Promise.all([
        api.get('/preferences'),
        api.get('/subjects')
      ]);
      setAllPreferences(prefResponse.data.data);
      setAllSubjects(subjectsResponse.data.data || []);
    } catch (err) {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  // Get unique teachers with preferences
  const teachersWithPreferences = useMemo(() => {
    return [...new Map(allPreferences.map(p => [p.teacher?._id, p.teacher])).values()];
  }, [allPreferences]);

  // Get subjects that appear in preferences
  const subjectsInPreferences = useMemo(() => {
    const subjectIds = new Set();
    allPreferences.forEach(pref => {
      pref.preferences?.forEach((p) => {
        const subjectId = typeof p.subject === 'string' ? p.subject : p.subject?._id;
        if (subjectId) subjectIds.add(subjectId);
      });
    });
    return allSubjects.filter(s => subjectIds.has(s._id));
  }, [allPreferences, allSubjects]);

  // Flatten preferences with ranking and apply filters
  const filteredPreferences = useMemo(() => {
    const results = [];

    // Flatten preferences - each preference item carries rank and program
    allPreferences.forEach(preference => {
      preference.preferences?.forEach((p, index) => {
        const subjectObj = p.subject;
        const subjectId = typeof subjectObj === 'string' ? subjectObj : subjectObj?._id;
        results.push({
          preferencId: preference._id,
          teacherId: preference.teacher?._id,
          teacherName: preference.teacher?.fullName || 'Unknown',
          teacherEmail: preference.teacher?.email,
          subjectId,
          subjectName: subjectObj?.name || 'Unknown',
          subjectCode: subjectObj?.code || '',
          rank: p.rank || index + 1,
          program: p.program,
          submittedAt: preference.submittedAt || preference.updatedAt || preference.createdAt,
        });
      });
    });

    // Apply teacher filter
    if (selectedTeacher !== 'all') {
      results.splice(0, results.length, ...results.filter(r => r.teacherId === selectedTeacher));
    }

    // Apply subject filter
    if (selectedSubject !== 'all') {
      results.splice(0, results.length, ...results.filter(r => r.subjectId === selectedSubject));
    }

    // Apply top N filter
    if (topN !== 'all') {
      const n = parseInt(topN);
      results.splice(0, results.length, ...results.filter(r => r.rank <= n));
    }

    // Apply custom top N filter
    if (customTopN) {
      const n = parseInt(customTopN);
      if (!isNaN(n) && n > 0) {
        results.splice(0, results.length, ...results.filter(r => r.rank <= n));
      }
    }

    // Sort by RANK first (most important preferences shown first), then by teacher name
    results.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;  // Sort by rank first (1, 2, 3, etc.)
      }
      return a.teacherName.localeCompare(b.teacherName);  // Then by teacher name
    });

    return results;
  }, [allPreferences, selectedTeacher, selectedSubject, topN, customTopN]);

  const clearFilters = () => {
    setSelectedTeacher('all');
    setSelectedSubject('all');
    setTopN('all');
    setCustomTopN('');
  };

  const hasActiveFilters = selectedTeacher !== 'all' || selectedSubject !== 'all' || topN !== 'all' || customTopN !== '';

  const viewDetails = (preference) => {
    // Find the original preference object for modal display
    const fullPref = allPreferences.find(p => p._id === preference.preferencId);
    setSelectedPreference(fullPref);
  };

  const closeModal = () => {
    setSelectedPreference(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Loading preferences data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container preferences-admin-container">
        <div className="page-header">
          <h1>📊 Preferences Analytics</h1>
          <p className="subtitle">Filter and analyze faculty subject preferences</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Filters Card */}
        <div className="card filters-card">
          <div className="card-header">
            <h2 className="filter-title">
              🔍 Filters
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn btn-sm btn-ghost">
                  ✕ Clear All
                </button>
              )}
            </h2>
          </div>

          <div className="card-body">
            <div className="filters-grid">
              {/* Teacher Filter */}
              <div className="filter-group">
                <label htmlFor="teacher-select" className="filter-label">Teacher</label>
                <select
                  id="teacher-select"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Teachers</option>
                  {teachersWithPreferences.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div className="filter-group">
                <label htmlFor="subject-select" className="filter-label">Subject</label>
                <select
                  id="subject-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Subjects</option>
                  {subjectsInPreferences.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Top N Filter */}
              <div className="filter-group">
                <label htmlFor="topn-select" className="filter-label">Top N Preferences</label>
                <select
                  id="topn-select"
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Ranks</option>
                  <option value="1">Top 1 Only</option>
                  <option value="2">Top 2</option>
                  <option value="3">Top 3</option>
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Custom Top N Filter */}
              <div className="filter-group">
                <label htmlFor="custom-topn-input" className="filter-label">Custom Top N</label>
                <input
                  id="custom-topn-input"
                  type="number"
                  min="1"
                  max="100"
                  value={customTopN}
                  onChange={(e) => setCustomTopN(e.target.value)}
                  placeholder="Enter custom number"
                  className="filter-input"
                />
                {customTopN && (
                  <span className="custom-value-hint">Top {customTopN} preferences</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="card results-card">
          <div className="card-header results-header">
            <h2>Results</h2>
            <span className="badge badge-secondary">{filteredPreferences.length} results</span>
          </div>
          <div className="card-body">
            {filteredPreferences.length === 0 ? (
              <p className="text-center empty-state">
                📭 No preferences match the current filters
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="table preferences-table">
                  <thead>
                    <tr>
                      <th>Teacher</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Rank</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreferences.map((row, idx) => (
                      <tr key={`${row.preferencId}-${row.subjectId}-${idx}`}>
                        <td className="teacher-cell">
                          <strong>{row.teacherName}</strong>
                        </td>
                        <td className="email-cell">{row.teacherEmail}</td>
                        <td className="subject-cell">
                          <span className="subject-badge">{row.subjectCode}</span>
                          {row.subjectName}
                        </td>
                        <td className="rank-cell">
                          <span className="rank-badge">#{row.rank}</span>
                        </td>
                        <td className="date-cell">
                          {new Date(row.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="action-cell">
                          <button
                            onClick={() => viewDetails(row)}
                            className="btn btn-sm btn-primary"
                          >
                            View Details
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

        {selectedPreference && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📋 Preference Details</h2>
                <button onClick={closeModal} className="modal-close-btn">✕</button>
              </div>

              <div className="detail-section">
                <h3>👤 Teacher Information</h3>
                <p>
                  <strong>Name:</strong> {selectedPreference.teacher?.fullName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedPreference.teacher?.email}
                </p>
                <p>
                  <strong>Department:</strong>{' '}
                  {selectedPreference.teacher?.department || '-'}
                </p>
                <p>
                  <strong>Designation:</strong>{' '}
                  {selectedPreference.teacher?.designation || '-'}
                </p>
              </div>

              <div className="detail-section">
                <h3>📚 Preferred Subjects ({selectedPreference.subjects?.length || 0})</h3>
                {selectedPreference.subjects && selectedPreference.subjects.length > 0 ? (
                  <div className="subjects-ranked-list">
                    {selectedPreference.subjects.map((subject, index) => (
                      <div key={subject._id} className="subject-ranked-item">
                        <span className="rank-number">#{index + 1}</span>
                        <div className="subject-info">
                          <strong>{subject.code}</strong> - {subject.name}
                          <span className="subject-meta">
                            {subject.credits} credits
                            {subject.semester && ` • Semester ${subject.semester}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-subjects">No subjects selected</p>
                )}
              </div>

              <button onClick={closeModal} className="btn btn-secondary modal-btn">
                Close
              </button>
            </div>
          </div>
        )}

        <style>{`
          .preferences-admin-container {
            max-width: 1200px;
          }

          .page-header {
            margin-bottom: 32px;
          }

          .page-header h1 {
            font-size: 36px;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: #0f172a;
            letter-spacing: -0.5px;
          }

          .page-header .subtitle {
            color: #64748b;
            margin: 0;
            font-size: 15px;
            font-weight: 400;
          }

          .filters-card {
            margin-bottom: 28px;
            border: 1px solid #e2e8f0;
            background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            overflow: hidden;
          }

          .filter-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 0;
            font-size: 17px;
            color: #1e293b;
            font-weight: 600;
          }

          .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
          }

          .filter-group {
            display: flex;
            flex-direction: column;
          }

          .filter-label {
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .filter-select {
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            transition: all 0.2s;
            color: #334155;
            font-weight: 500;
          }

          .filter-select:hover {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          }

          .filter-select:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
          }

          .filter-input {
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            transition: all 0.2s;
            color: #334155;
            font-weight: 500;
          }

          .filter-input:hover {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          }

          .filter-input:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
          }

          .custom-value-hint {
            display: block;
            font-size: 12px;
            color: #4f46e5;
            margin-top: 6px;
            font-weight: 500;
          }

          .results-card {
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            border-radius: 8px;
            background: white;
            overflow: hidden;
          }

          .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(to right, #f8fafc, #f1f5f9);
            border-bottom: 1px solid #e2e8f0;
            padding: 16px 24px;
          }

          .results-header h2 {
            margin: 0;
            font-size: 18px;
            color: #0f172a;
            font-weight: 700;
          }

          .badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 500;
          }

          .badge-secondary {
            background: #e8f0fe;
            color: #1967d2;
          }

          .table-wrapper {
            overflow-x: auto;
          }

          .preferences-table {
            width: 100%;
            border-collapse: collapse;
          }

          .preferences-table th {
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

          .preferences-table td {
            padding: 12px;
            border-bottom: 1px solid #e8ecf1;
          }

          .preferences-table tbody tr {
            transition: all 0.2s ease;
          }

          .preferences-table tbody tr:hover {
            background: linear-gradient(90deg, #f0f7ff 0%, #f8fbff 100%);
            box-shadow: inset 0 1px 0 #dbeafe;
          }

          .preferences-table tbody tr:nth-child(odd) {
            background: #f8fafc;
          }

          .preferences-table tbody tr:nth-child(odd):hover {
            background: #eff6ff;
          }

          .teacher-cell {
            font-weight: 600;
            color: #0f172a;
          }

          .email-cell {
            color: #64748b;
            font-size: 13px;
          }

          .subject-cell {
            font-size: 13px;
          }

          .subject-badge {
            display: inline-block;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 600;
            margin-right: 8px;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
          }

          .rank-cell {
            text-align: center;
          }

          .rank-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-weight: 700;
            font-size: 13px;
            text-align: center;
            background: #e3f2fd;
            color: #1976d2;
            border: 2px solid #90caf9;
            box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);
          }

          .rank-badge {
            background: ${props => {
              // Dynamic based on rank - we can't use props in CSS, so let's use a different approach
              return '#e3f2fd';
            }};
          }

          /* Rank 1 (Top preference) - Green */
          .preferences-table tr:has(.rank-badge:contains('1')) .rank-badge {
            background: #c8e6c9;
            color: #2e7d32;
            border-color: #81c784;
          }

          /* Override with nth-child approach */
          .preferences-table tbody tr:first-child .rank-badge {
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            border-color: #4caf50;
            font-weight: 700;
          }

          .date-cell {
            color: #7f8c8d;
            font-size: 13px;
          }

          .action-cell {
            text-align: right;
          }

          .empty-state {
            padding: 60px 20px;
            text-align: center;
            color: #64748b;
            font-size: 15px;
          }

          .empty-state::before {
            content: '📊';
            display: block;
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
          }

          .empty-state p {
            margin: 0;
            font-size: 16px;
            color: #64748b;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 20px;
            animation: fadeIn 0.2s ease-in-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 700px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease-out;
          }

          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(to right, #f8fafc, #f1f5f9);
          }

          .modal-header h2 {
            margin: 0;
            font-size: 22px;
            color: #0f172a;
            font-weight: 700;
          }

          .modal-close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #94a3b8;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .modal-close-btn:hover {
            color: #0f172a;
            background: #e2e8f0;
          }

          .detail-section {
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
          }

          .detail-section:last-child {
            border-bottom: none;
          }

          .detail-section h3 {
            margin: 0 0 16px 0;
            font-size: 14px;
            color: #0f172a;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .detail-section p {
            margin: 10px 0;
            color: #475569;
            font-size: 14px;
            line-height: 1.5;
          }

          .detail-section p strong {
            color: #0f172a;
            font-weight: 700;
          }

          .subjects-ranked-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .subject-ranked-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 14px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #4f46e5;
            transition: all 0.2s ease;
          }

          .subject-ranked-item:hover {
            background: #f1f5f9;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
          }

          .rank-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
            color: white;
            border-radius: 50%;
            font-weight: 700;
            font-size: 14px;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
          }

          .subject-info {
            flex: 1;
          }

          .subject-info strong {
            color: #0f172a;
            font-size: 14px;
            font-weight: 700;
          }

          .subject-meta {
            display: block;
            font-size: 12px;
            color: #94a3b8;
            margin-top: 4px;
          }

          .no-subjects {
            color: #94a3b8;
            font-style: italic;
          }

          .modal-btn {
            margin-left: 24px;
            margin-bottom: 24px;
            margin-top: 20px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
          }

          .modal-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
          }

          @media (max-width: 768px) {
            .filters-grid {
              grid-template-columns: 1fr;
            }

            .preferences-table {
              font-size: 12px;
            }

            .preferences-table th,
            .preferences-table td {
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

export default AdminPreferencesPage;
