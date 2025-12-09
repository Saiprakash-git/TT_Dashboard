import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const PreferencesPage = () => {
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState([]);
  const [rankedSubjects, setRankedSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, preferenceRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/preferences/my/preference'),
      ]);

      setAllSubjects(subjectsRes.data.data);

      if (preferenceRes.data.data) {
        // Load previously ranked subjects in order
        const savedSubjects = preferenceRes.data.data.subjects;
        setRankedSubjects(savedSubjects);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addSubject = (subject) => {
    if (!rankedSubjects.find(s => s._id === subject._id)) {
      setRankedSubjects([...rankedSubjects, subject]);
    }
  };

  const removeSubject = (subjectId) => {
    setRankedSubjects(rankedSubjects.filter(s => s._id !== subjectId));
  };

  const moveUp = (index) => {
    if (index > 0) {
      const newRanked = [...rankedSubjects];
      [newRanked[index - 1], newRanked[index]] = [newRanked[index], newRanked[index - 1]];
      setRankedSubjects(newRanked);
    }
  };

  const moveDown = (index) => {
    if (index < rankedSubjects.length - 1) {
      const newRanked = [...rankedSubjects];
      [newRanked[index], newRanked[index + 1]] = [newRanked[index + 1], newRanked[index]];
      setRankedSubjects(newRanked);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedItem === null || draggedItem === index) return;

    const newRanked = [...rankedSubjects];
    const draggedSubject = newRanked[draggedItem];
    newRanked.splice(draggedItem, 1);
    newRanked.splice(index, 0, draggedSubject);
    
    setDraggedItem(index);
    setRankedSubjects(newRanked);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = async () => {
    if (rankedSubjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    setMessage('');
    setError('');
    setSaving(true);

    try {
      const subjectIds = rankedSubjects.map(s => s._id);
      await api.post('/preferences', { subjects: subjectIds });
      setMessage('Preferences saved successfully! Your ranking has been recorded.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  const availableSubjects = allSubjects.filter(
    subject => !rankedSubjects.find(s => s._id === subject._id)
  );

  return (
    <Layout>
      <div className="container">
        <h1>My Subject Preferences</h1>
        <p className="subtitle">Rank subjects in order of your preference (1 = Most Preferred)</p>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="preferences-container">
          {/* Available Subjects */}
          <div className="card">
            <h3>Available Subjects</h3>
            <p className="hint">Click to add to your preferences</p>
            <div className="available-subjects">
              {availableSubjects.length === 0 ? (
                <p className="text-muted">All subjects have been added to your preferences</p>
              ) : (
                availableSubjects.map((subject) => (
                  <div
                    key={subject._id}
                    className="subject-card available"
                    onClick={() => addSubject(subject)}
                  >
                    <div className="subject-header">
                      <strong>{subject.code}</strong>
                      <span className="add-icon">+</span>
                    </div>
                    <div className="subject-name">{subject.name}</div>
                    <div className="subject-meta">
                      {subject.credits} credits
                      {subject.semester && ` • ${subject.semester}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ranked Preferences */}
          <div className="card">
            <h3>Your Ranked Preferences</h3>
            <p className="hint">Drag to reorder or use arrows. Higher = More Preferred</p>
            
            {rankedSubjects.length === 0 ? (
              <div className="empty-state">
                <p>No subjects selected yet</p>
                <p className="text-muted">Add subjects from the left to start ranking</p>
              </div>
            ) : (
              <div className="ranked-list">
                {rankedSubjects.map((subject, index) => (
                  <div
                    key={subject._id}
                    className="ranked-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="rank-number">{index + 1}</div>
                    <div className="subject-content">
                      <div className="subject-title">
                        <strong>{subject.code}</strong> - {subject.name}
                      </div>
                      <div className="subject-meta">
                        {subject.credits} credits
                        {subject.semester && ` • ${subject.semester}`}
                      </div>
                    </div>
                    <div className="rank-controls">
                      <button
                        className="control-btn"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        className="control-btn"
                        onClick={() => moveDown(index)}
                        disabled={index === rankedSubjects.length - 1}
                        title="Move down"
                      >
                        ▼
                      </button>
                      <button
                        className="control-btn remove"
                        onClick={() => removeSubject(subject._id)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="save-section">
              <div className="preference-count">
                <strong>{rankedSubjects.length}</strong> subject(s) ranked
              </div>
              <button
                onClick={handleSave}
                className="btn btn-success"
                disabled={saving || rankedSubjects.length === 0}
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .subtitle {
          color: #666;
          margin-top: -10px;
          margin-bottom: 20px;
        }

        .preferences-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }

        .card h3 {
          margin-bottom: 5px;
          color: #2c3e50;
        }

        .hint {
          font-size: 13px;
          color: #666;
          margin-bottom: 15px;
        }

        .available-subjects {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          max-height: 600px;
          overflow-y: auto;
        }

        .subject-card {
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          background: #f9f9f9;
        }

        .subject-card.available:hover {
          border-color: #667eea;
          background: #f0f4ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .subject-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .add-icon {
          font-size: 24px;
          color: #667eea;
          font-weight: bold;
        }

        .subject-name {
          margin-bottom: 5px;
          color: #333;
        }

        .subject-meta {
          font-size: 12px;
          color: #666;
        }

        .ranked-list {
          max-height: 550px;
          overflow-y: auto;
        }

        .ranked-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          cursor: move;
          transition: all 0.3s;
          color: white;
        }

        .ranked-item:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .rank-number {
          background: rgba(255,255,255,0.3);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .subject-content {
          flex: 1;
        }

        .subject-title {
          margin-bottom: 4px;
          font-size: 15px;
        }

        .subject-title strong {
          font-size: 16px;
        }

        .ranked-item .subject-meta {
          font-size: 12px;
          opacity: 0.9;
        }

        .rank-controls {
          display: flex;
          gap: 5px;
          flex-shrink: 0;
        }

        .control-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }

        .control-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .control-btn.remove {
          background: rgba(220, 53, 69, 0.3);
          border-color: rgba(220, 53, 69, 0.5);
        }

        .control-btn.remove:hover {
          background: rgba(220, 53, 69, 0.6);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .empty-state p {
          margin: 10px 0;
        }

        .save-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preference-count {
          font-size: 16px;
          color: #666;
        }

        .text-muted {
          color: #999;
          font-size: 14px;
        }

        @media (max-width: 968px) {
          .preferences-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
};

export default PreferencesPage;
