import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import api from '../utils/api';

export default function PreferencesPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [beTechPrefs, setBeTechPrefs] = useState(['', '', '']);
  const [mTechPrefs, setMTechPrefs] = useState(['', '', '']);
  const [pePrefs, setPePrefs] = useState(['', '', '']);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      const [subjectsRes, preferencesRes, userRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/preferences/my/preference'),
        api.get('/auth/me'),
      ]);

      const allSubjects = subjectsRes.data.data || [];
      setSubjects(allSubjects);
      setCanEdit(Boolean(userRes.data?.data?.canEditPreferences));

      const pref = preferencesRes.data?.data;
      if (pref?.preferences?.length) {
        setHasExisting(true);
        const be = ['', '', ''];
        const m = ['', '', ''];
        const pe = ['', '', ''];

        pref.preferences.forEach((p) => {
          const subjectId = typeof p.subject === 'string' ? p.subject : p.subject?._id;
          if (p.program === 'B.E/B.Tech' && p.rank >= 1 && p.rank <= 3) {
            be[p.rank - 1] = subjectId;
          }
          if (p.program === 'M.Tech' && p.rank >= 1 && p.rank <= 3) {
            m[p.rank - 1] = subjectId;
          }
          if (p.program === 'Professional Elective' && p.rank >= 1 && p.rank <= 3) {
            pe[p.rank - 1] = subjectId;
          }
        });

        setBeTechPrefs(be);
        setMTechPrefs(m);
        setPePrefs(pe);
      }
      if (!pref?.preferences?.length) {
        setHasExisting(false);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAvailable = (program, prefs, currentIndex) => {
    const selected = prefs.filter((id, i) => i !== currentIndex && id);
    return subjects.filter((s) => {
      // For Professional Elective section: show only PE subjects regardless of program
      if (program === 'Professional Elective') {
        return s.professionalElective === true && !selected.includes(s._id);
      }
      // For regular program sections: show only non-PE subjects matching the program
      return s.program === program && s.professionalElective !== true && !selected.includes(s._id);
    });
  };

  const handleSave = async () => {
    if (hasExisting && !canEdit) {
      toast.error('You do not have permission to edit preferences. Please contact admin.');
      return;
    }

    const preferences = [];
    beTechPrefs.forEach((subjectId, index) => {
      if (subjectId) {
        preferences.push({ subject: subjectId, program: 'B.E/B.Tech', rank: index + 1 });
      }
    });
    mTechPrefs.forEach((subjectId, index) => {
      if (subjectId) {
        preferences.push({ subject: subjectId, program: 'M.Tech', rank: index + 1 });
      }
    });
    pePrefs.forEach((subjectId, index) => {
      if (subjectId) {
        preferences.push({ subject: subjectId, program: 'Professional Elective', rank: index + 1 });
      }
    });

    if (preferences.length < 3) {
      toast.error('Please select at least 3 preferences in total.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/preferences', { preferences });
      toast.success('Preferences saved successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const programSection = (title, programKey, prefs, setter) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Select up to three ranked preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[0, 1, 2].map((idx) => (
          <div key={`${programKey}-${idx}`} className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              {idx === 0 ? '1st Preference' : idx === 1 ? '2nd Preference' : '3rd Preference'}
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={prefs[idx]}
              onChange={(e) => {
                const next = [...prefs];
                next[idx] = e.target.value;
                setter(next);
              }}
              disabled={disableEditing}
            >
              <option value="">-- Select Subject --</option>
              {filterAvailable(programKey, prefs, idx).map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name} ({subject.credits} cr)
                </option>
              ))}
            </select>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading preferences...
        </div>
      </DashboardLayout>
    );
  }

  const beTechSubjects = subjects.some((s) => s.program === 'B.E/B.Tech');
  const mTechSubjects = subjects.some((s) => s.program === 'M.Tech');
  const peSubjects = subjects.some((s) => s.professionalElective === true);
  const disableEditing = hasExisting && !canEdit;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em'}}>Submit Preferences</h1>
            <p className="text-muted-foreground">Pick up to three per program; minimum three total.</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving || disableEditing}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>

        {disableEditing && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You cannot edit preferences right now. Please contact the admin to enable editing.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {beTechSubjects && programSection('B.E/B.Tech Program', 'B.E/B.Tech', beTechPrefs, setBeTechPrefs)}
          {mTechSubjects && programSection('M.Tech Program', 'M.Tech', mTechPrefs, setMTechPrefs)}
          {peSubjects && programSection('Professional Electives', 'Professional Elective', pePrefs, setPePrefs)}
        </div>
      </div>
    </DashboardLayout>
  );
}
