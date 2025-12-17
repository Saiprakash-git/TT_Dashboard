import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

export default function PreferencesPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  
  // Program-based preferences (3 per program)
  const [beTechPrefs, setBeTechPrefs] = useState(['', '', '']);
  const [mTechPrefs, setMTechPrefs] = useState(['', '', '']);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [subjectsRes, preferencesRes, userRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/preferences/my/preference'),
        api.get('/auth/me')
      ]);
      
      const allSubjects = subjectsRes.data.data;
      setSubjects(allSubjects);
      setCanEdit(userRes.data.data.canEditPreferences || false);

      // Load existing preferences if available
      const pref = preferencesRes.data.data;
      if (pref?.preferences?.length) {
        const bePrefs = ['', '', ''];
        const mPrefs = ['', '', ''];
        
        pref.preferences.forEach(p => {
          const subjectId = typeof p.subject === 'string' ? p.subject : p.subject._id;
          if (p.program === 'B.E/B.Tech' && p.rank >= 1 && p.rank <= 3) {
            bePrefs[p.rank - 1] = subjectId;
          } else if (p.program === 'M.Tech' && p.rank >= 1 && p.rank <= 3) {
            mPrefs[p.rank - 1] = subjectId;
          }
        });
        
        setBeTechPrefs(bePrefs);
        setMTechPrefs(mPrefs);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleBeTechChange = (index, subjectId) => {
    const newPrefs = [...beTechPrefs];
    newPrefs[index] = subjectId;
    setBeTechPrefs(newPrefs);
  };

  const handleMTechChange = (index, subjectId) => {
    const newPrefs = [...mTechPrefs];
    newPrefs[index] = subjectId;
    setMTechPrefs(newPrefs);
  };

  const getAvailableBeTechSubjects = (currentIndex) => {
    const selectedIds = beTechPrefs.filter((id, i) => i !== currentIndex && id);
    return subjects.filter(s => 
      s.program === 'B.E/B.Tech' && !selectedIds.includes(s._id)
    );
  };

  const getAvailableMTechSubjects = (currentIndex) => {
    const selectedIds = mTechPrefs.filter((id, i) => i !== currentIndex && id);
    return subjects.filter(s => 
      s.program === 'M.Tech' && !selectedIds.includes(s._id)
    );
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit preferences. Please contact admin.');
      return;
    }

    // Build preferences array
    const preferences = [];
    
    beTechPrefs.forEach((subjectId, index) => {
      if (subjectId) {
        preferences.push({
          subject: subjectId,
          program: 'B.E/B.Tech',
          rank: index + 1
        });
      }
    });
    
    mTechPrefs.forEach((subjectId, index) => {
      if (subjectId) {
        preferences.push({
          subject: subjectId,
          program: 'M.Tech',
          rank: index + 1
        });
      }
    });

    // Validate minimum 3 preferences
    if (preferences.length < 3) {
      toast.error('Please select at least 3 preferences in total');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/preferences', { preferences });
      toast.success('Preferences saved successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Loading preferences...</div>
      </DashboardLayout>
    );
  }

  const beTechSubjects = subjects.filter(s => s.program === 'B.E/B.Tech');
  const mTechSubjects = subjects.filter(s => s.program === 'M.Tech');

  return (
    <DashboardLayout>
      <div className="container prefs-container">
        <div className="page-header">
          <div>
            <h1>📝 Submit Preferences</h1>
            <p className="subtitle">Select your subject preferences (minimum 3 total)</p>
          </div>
          <button
            onClick={handleSave}
            className={`btn btn-primary ${!canEdit ? 'btn-disabled' : ''}`}
            disabled={isSaving || !canEdit}
          >
            {isSaving ? '⏳ Saving...' : '💾 Save Preferences'}
          </button>
        </div>

        {!canEdit && (
          <div className="alert alert-warning">
            <strong>⚠️ Permission Required:</strong> You currently cannot edit preferences. Please contact the admin to enable editing.
          </div>
        )}

        {beTechSubjects.length > 0 && (
          <div className="program-section">
            <h2 className="program-title">📘 B.E/B.Tech Program</h2>
            <div className="preferences-list">
              <div className="pref-item">
                <label htmlFor="betech-1">1st Preference</label>
                <select
                  id="betech-1"
                  className="select-control"
                  value={beTechPrefs[0]}
                  onChange={(e) => handleBeTechChange(0, e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">-- Select Subject --</option>
                  {getAvailableBeTechSubjects(0).map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name} ({subject.credits} credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pref-item">
                <label htmlFor="betech-2">2nd Preference</label>
                <select
                  id="betech-2"
                  className="select-control"
                  value={beTechPrefs[1]}
                  onChange={(e) => handleBeTechChange(1, e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">-- Select Subject --</option>
                  {getAvailableBeTechSubjects(1).map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name} ({subject.credits} credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pref-item">
                <label htmlFor="betech-3">3rd Preference</label>
                <select
                  id="betech-3"
                  className="select-control"
                  value={beTechPrefs[2]}
                  onChange={(e) => handleBeTechChange(2, e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">-- Select Subject --</option>
                  {getAvailableBeTechSubjects(2).map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name} ({subject.credits} credits)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {mTechSubjects.length > 0 && (
          <div className="program-section">
            <h2 className="program-title">📗 M.Tech Program</h2>
            <div className="preferences-list">
              <div className="pref-item">
                <label htmlFor="mtech-1">1st Preference</label>
                <select
                  id="mtech-1"
                  className="select-control"
                  value={mTechPrefs[0]}
                  onChange={(e) => handleMTechChange(0, e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">-- Select Subject --</option>
                  {getAvailableMTechSubjects(0).map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name} ({subject.credits} credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pref-item">
                <label htmlFor="mtech-2">2nd Preference</label>
                <select
                  id="mtech-2"
                  className="select-control"
                  value={mTechPrefs[1]}
                  onChange={(e) => handleMTechChange(1, e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">-- Select Subject --</option>
                  {getAvailableMTechSubjects(1).map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name} ({subject.credits} credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pref-item">
                <label htmlFor="mtech-3">3rd Preference</label>
                <select
                  id="mtech-3"
                  className="select-control"
                  value={mTechPrefs[2]}
                  onChange={(e) => handleMTechChange(2, e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">-- Select Subject --</option>
                  {getAvailableMTechSubjects(2).map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name} ({subject.credits} credits)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .prefs-container {
            max-width: 900px;
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

          .btn {
            padding: 10px 24px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.2s;
          }

          .btn-primary {
            background: #007bff;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #0056b3;
          }

          .btn-disabled {
            background: #6c757d;
            cursor: not-allowed;
          }

          .btn:disabled {
            opacity: 0.6;
          }

          .alert {
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 24px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .alert-warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
          }

          .program-section {
            background: white;
            border: 1px solid #e0e6ed;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
          }

          .program-title {
            font-size: 22px;
            font-weight: 600;
            margin: 0 0 20px 0;
            color: #2c3e50;
            padding-bottom: 12px;
            border-bottom: 2px solid #e0e6ed;
          }

          .preferences-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .pref-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .pref-item label {
            font-weight: 600;
            color: #2c3e50;
            font-size: 15px;
          }

          .select-control {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #d1d9e6;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            transition: all 0.2s;
          }

          .select-control:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
          }

          .select-control:disabled {
            background: #f8f9fa;
            cursor: not-allowed;
            opacity: 0.7;
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
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
