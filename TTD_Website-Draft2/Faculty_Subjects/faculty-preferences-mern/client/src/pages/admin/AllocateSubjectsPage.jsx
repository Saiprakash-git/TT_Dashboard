import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';
import { toast } from 'sonner';

const AllocateSubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [lockedAllocations, setLockedAllocations] = useState({}); // already allocated, immutable
  const [pendingAllocations, setPendingAllocations] = useState({}); // only for new subjects
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const currentAcademicYear = () => {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  };

  const fetchData = async () => {
    try {
      const year = currentAcademicYear();
      const [subjectsRes, allocationsRes] = await Promise.all([
        api.get('/allocations/subjects-preferences'),
        api.get('/allocations', { params: { academicYear: year } }),
      ]);

      setSubjects(subjectsRes.data.data || []);

      const locked = {};
      (allocationsRes.data?.data || []).forEach((alloc) => {
        if (alloc.subject?._id && alloc.teacher?._id) {
          locked[alloc.subject._id] = {
            teacherId: alloc.teacher._id,
            teacherName: alloc.teacher.fullName,
          };
        }
      });
      setLockedAllocations(locked);
    } catch (err) {
      console.error('Error loading allocation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSelect = (subjectId, teacherId) => {
    // Do not allow edits on locked allocations
    if (lockedAllocations[subjectId]) return;
    setPendingAllocations((prev) => ({
      ...prev,
      [subjectId]: teacherId,
    }));
  };

  const handleSubmit = async () => {
    const subjectsNeedingAllocation = subjects.filter((s) => !lockedAllocations[s._id]);
    const remaining = subjectsNeedingAllocation.filter((s) => !pendingAllocations[s._id]);
    if (remaining.length > 0) {
      toast.error(`Please allocate all new subjects. ${remaining.length} remaining.`);
      return;
    }

    const allocationData = subjectsNeedingAllocation.map((s) => ({
      subjectId: s._id,
      teacherId: pendingAllocations[s._id],
    }));

    setIsSubmitting(true);
    try {
      await api.post('/allocations/allocate', {
        allocations: allocationData,
        academicYear: currentAcademicYear(),
      });
      toast.success('Subjects allocated successfully!');
      await fetchData();
      setPendingAllocations({});
    } catch (err) {
      console.error('Allocation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Loading...</div>
      </DashboardLayout>
    );
  }

  // Group subjects by program
  const beTechSubjects = subjects.filter(s => s.program === 'B.E/B.Tech');
  const mTechSubjects = subjects.filter(s => s.program === 'M.Tech');

  const lockedCount = Object.keys(lockedAllocations).length;
  const needsAllocation = subjects.filter((s) => !lockedAllocations[s._id]);
  const pendingCount = needsAllocation.filter((s) => pendingAllocations[s._id]).length;
  const requiredTotal = lockedCount + needsAllocation.length;
  const allocatedCount = lockedCount + pendingCount;
  const allAllocated = allocatedCount === requiredTotal;
  const nothingToAllocate = needsAllocation.length === 0;

  return (
    <DashboardLayout>
      <div className="container allocate-container">
        <div className="page-header">
          <div>
            <h1>🎯 Allocate Subjects to Teachers</h1>
            <p className="subtitle">Assign teachers to subjects based on their preferences</p>
          </div>
          <div className="progress-indicator">
            <span className="progress-text">
              {allocatedCount} / {requiredTotal} Allocated
            </span>
            <button
              onClick={handleSubmit}
              className={`btn ${allAllocated && !nothingToAllocate ? 'btn-success' : 'btn-disabled'}`}
              disabled={!allAllocated || isSubmitting || nothingToAllocate}
            >
              {nothingToAllocate
                ? 'All subjects already allocated'
                : isSubmitting
                ? '⏳ Submitting...'
                : allAllocated
                ? '✓ Submit Allocations'
                : '⏳ Allocate All First'}
            </button>
          </div>
        </div>

        {beTechSubjects.length > 0 && (
          <div className="program-section">
            <h2 className="program-title">📘 B.E/B.Tech Subjects ({beTechSubjects.length})</h2>
            <div className="subjects-grid">
              {beTechSubjects.map((subject) => (
                <SubjectCard
                  key={subject._id}
                  subject={subject}
                  selectedTeacher={pendingAllocations[subject._id] || lockedAllocations[subject._id]?.teacherId}
                  lockedTeacher={lockedAllocations[subject._id]?.teacherId}
                  lockedTeacherName={lockedAllocations[subject._id]?.teacherName}
                  onTeacherSelect={(teacherId) => handleTeacherSelect(subject._id, teacherId)}
                />
              ))}
            </div>
          </div>
        )}

        {mTechSubjects.length > 0 && (
          <div className="program-section">
            <h2 className="program-title">📗 M.Tech Subjects ({mTechSubjects.length})</h2>
            <div className="subjects-grid">
              {mTechSubjects.map((subject) => (
                <SubjectCard
                  key={subject._id}
                  subject={subject}
                  selectedTeacher={pendingAllocations[subject._id] || lockedAllocations[subject._id]?.teacherId}
                  lockedTeacher={lockedAllocations[subject._id]?.teacherId}
                  lockedTeacherName={lockedAllocations[subject._id]?.teacherName}
                  onTeacherSelect={(teacherId) => handleTeacherSelect(subject._id, teacherId)}
                />
              ))}
            </div>
          </div>
        )}

        <style>{`
          .allocate-container {
            max-width: 1400px;
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

          .subtitle {
            color: #7f8c8d;
            margin: 0;
          }

          .progress-indicator {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
          }

          .progress-text {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
          }

          .program-section {
            margin-bottom: 40px;
          }

          .program-title {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2c3e50;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e6ed;
          }

          .subjects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
          }

          .btn {
            padding: 10px 24px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.2s;
          }

          .btn-success {
            background: #28a745;
            color: white;
          }

          .btn-success:hover:not(:disabled) {
            background: #218838;
          }

          .btn-disabled {
            background: #6c757d;
            color: white;
            cursor: not-allowed;
          }

          .btn:disabled {
            opacity: 0.6;
          }

          .loading {
            text-align: center;
            padding: 60px 20px;
            color: #7f8c8d;
            font-size: 18px;
          }

          @media (max-width: 768px) {
            .page-header {
              flex-direction: column;
              align-items: stretch;
            }

            .progress-indicator {
              align-items: stretch;
            }

            .subjects-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

const SubjectCard = ({ subject, selectedTeacher, lockedTeacher, lockedTeacherName, onTeacherSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLocked = Boolean(lockedTeacher);

  return (
    <div className={`subject-card ${selectedTeacher ? 'allocated' : ''}`}>
      <div className="subject-header">
        <div>
          <h3 className="subject-name">{subject.name}</h3>
          <p className="subject-code">{subject.code} • {subject.credits} Credits</p>
        </div>
        <button
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand preferences'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {selectedTeacher && (
        <div className="selected-teacher">
          <span className="selected-label">✓ Allocated to:</span>
          <strong>
            {lockedTeacherName || subject.teacherPreferences.find(p => p.teacher._id === selectedTeacher)?.teacher.fullName || 'Unknown'}
          </strong>
          {isLocked && <span className="locked-pill">Locked</span>}
        </div>
      )}

      {isExpanded && (
        <div className="preferences-list">
          <h4 className="preferences-title">Teacher Preferences (by rank):</h4>
          {subject.teacherPreferences && subject.teacherPreferences.length > 0 ? (
            subject.teacherPreferences.map((pref, index) => (
              <div key={index} className="preference-item">
                <div className="pref-info">
                  <span className={`rank-badge rank-${pref.rank}`}>#{pref.rank}</span>
                  <div className="teacher-info">
                    <strong>{pref.teacher.fullName}</strong>
                    <small>
                      {pref.teacher.facultyId} • {pref.teacher.department}
                    </small>
                  </div>
                </div>
                <button
                  className={`btn-select ${selectedTeacher === pref.teacher._id ? 'selected' : ''}`}
                  onClick={() => onTeacherSelect(pref.teacher._id)}
                  disabled={isLocked}
                >
                  {isLocked ? 'Locked' : selectedTeacher === pref.teacher._id ? '✓ Selected' : 'Select'}
                </button>
              </div>
            ))
          ) : (
            <p className="no-preferences">No preferences submitted for this subject</p>
          )}
        </div>
      )}

      <style jsx>{`
        .subject-card {
          border: 2px solid #e0e6ed;
          border-radius: 8px;
          padding: 20px;
          background: white;
          transition: all 0.2s;
        }

        .subject-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .subject-card.allocated {
          border-color: #28a745;
          background: #f1f9f3;
        }

        .subject-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .subject-name {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }

        .subject-code {
          margin: 0;
          font-size: 13px;
          color: #7f8c8d;
        }

        .expand-btn {
          background: #f8f9fa;
          border: 1px solid #e0e6ed;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .expand-btn:hover {
          background: #e9ecef;
        }

        .selected-teacher {
          padding: 12px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 6px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .selected-label {
          color: #155724;
          font-size: 13px;
          margin-right: 8px;
        }

        .selected-teacher strong {
          color: #0c3d1c;
        }

        .locked-pill {
          background: #6c757d;
          color: #fff;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .preferences-list {
          border-top: 1px solid #e0e6ed;
          padding-top: 16px;
          margin-top: 12px;
        }

        .preferences-title {
          font-size: 13px;
          text-transform: uppercase;
          color: #7f8c8d;
          margin: 0 0 12px 0;
          font-weight: 600;
        }

        .preference-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .pref-info {
          display: flex;
          gap: 12px;
          align-items: center;
          flex: 1;
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
          color: white;
        }

        .rank-1 {
          background: #ffd700;
          color: #000;
        }

        .rank-2 {
          background: #c0c0c0;
          color: #000;
        }

        .rank-3 {
          background: #cd7f32;
        }

        .teacher-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .teacher-info strong {
          font-size: 14px;
          color: #2c3e50;
        }

        .teacher-info small {
          font-size: 12px;
          color: #7f8c8d;
        }

        .btn-select {
          padding: 6px 16px;
          border-radius: 4px;
          border: 1px solid #007bff;
          background: white;
          color: #007bff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-select:hover {
          background: #007bff;
          color: white;
        }

        .btn-select.selected {
          background: #28a745;
          border-color: #28a745;
          color: white;
        }

        .btn-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #e9ecef;
          color: #6c757d;
          border-color: #e9ecef;
        }

        .no-preferences {
          color: #7f8c8d;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default AllocateSubjectsPage;
