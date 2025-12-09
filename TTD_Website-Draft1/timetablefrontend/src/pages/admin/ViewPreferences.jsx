// src/pages/admin/ViewPreferences.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";

export default function ViewPreferences() {
  const [semester, setSemester] = useState(1);
  const [topN, setTopN] = useState(2);
  const [data, setData] = useState([]);
  const [topResults, setTopResults] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'per-subject'
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedRank, setSelectedRank] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [error, setError] = useState(null);

  const fetchAux = useCallback(async (sem) => {
    try {
      setError(null);
      const tres = await axios.get('/admin/teachers');
      setTeachers(tres.data || []);
      if (typeof sem !== 'undefined' && sem !== null && sem !== '') {
        const sres = await axios.get('/admin/subjects', { params: { semester: sem } });
        setSubjects(sres.data || []);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error('failed to load teachers/subjects', err);
      setError(err?.response?.data?.message || 'Failed to load teachers or subjects');
      setTeachers([]);
      setSubjects([]);
    }
  }, []);

  const fetchSemesters = useCallback(async () => {
    try {
      const res = await axios.get('/admin/semesters');
      const list = res.data || [];
      setSemesters(list);
      if (list.length && (semester === null || semester === undefined || semester === '')) {
        setSemester(list[0]);
      }
      return list;
    } catch (err) {
      console.error('failed to load semesters', err);
      setError(err?.response?.data?.message || 'Failed to load semesters');
      setSemesters([]);
      return [];
    }
  }, [semester]);

  const fetchPrefs = useCallback(async (opts = {}) => {
    const sem = typeof opts.semester !== 'undefined' ? opts.semester : semester;
    if (sem === null || sem === undefined || sem === '') {
      setError('semester required');
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = { semester: sem };
      if (selectedTeacher) params.teacherId = selectedTeacher;
      if (selectedRank) params.rank = selectedRank;
      if (selectedSubject) params.subjectId = selectedSubject;
      const res = await axios.get(`/admin/preferences/filter`, { params });
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Could not fetch preferences');
      setData([]);
    } finally { setLoading(false); }
  }, [semester, selectedTeacher, selectedRank, selectedSubject]);

  const fetchTopPerSubject = useCallback(async (sem) => {
    const s = typeof sem !== 'undefined' ? sem : semester;
    if (s === null || s === undefined || s === '') {
      setTopResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/admin/preferences/${s}`, { params: { top: topN } });
      setTopResults(res.data || []);
    } catch (err) {
      console.error('fetchTopPerSubject', err);
      setError(err?.response?.data?.message || 'Could not fetch top preferences per subject');
      setTopResults([]);
    } finally { setLoading(false); }
  }, [semester, topN]);

  // initial load: fetch semesters, then aux and prefs
  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await fetchSemesters();
      const semToUse = (typeof semester !== 'undefined' && semester !== null && semester !== '') ? semester : (list[0] || '');
      if (!mounted) return;
      await fetchAux(semToUse);
      await fetchPrefs({ semester: semToUse });
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // whenever filters change (teacher, rank, subject, semester) fetch prefs
  useEffect(() => {
    if (viewMode === 'list') fetchPrefs();
    if (viewMode === 'per-subject') fetchTopPerSubject();
  }, [semester, selectedTeacher, selectedRank, selectedSubject]);

  // when semester changes, refresh teachers/subjects auxiliary lists
  useEffect(() => {
    if (semester === null || semester === undefined || semester === '') return;
    fetchAux(semester);
  }, [semester, fetchAux]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-800">Preferences</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1 ${viewMode==='list' ? 'bg-slate-200' : ''}`}>List</button>
            <button onClick={() => setViewMode('per-subject')} className={`px-3 py-1 ${viewMode==='per-subject' ? 'bg-slate-200' : ''}`}>Per-subject (Top N)</button>
          </div>
          <label className="text-sm text-slate-600">Teacher</label>
          <select value={selectedTeacher} onChange={e=>setSelectedTeacher(e.target.value)} className="p-1 border rounded w-48">
            <option value="">All teachers</option>
            {teachers.map(t => <option key={t._id} value={t._id}>{t.name || t.email}</option>)}
          </select>

          <label className="text-sm text-slate-600">Preference</label>
          <select value={selectedRank} onChange={e=>setSelectedRank(e.target.value)} className="p-1 border rounded w-28">
            <option value="">Any</option>
            {Array.from({length:10}).map((_,i)=> <option key={i+1} value={i+1}>{i+1}</option>)}
          </select>

          <label className="text-sm text-slate-600">Subject (optional)</label>
          <select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} className="p-1 border rounded w-48">
            <option value="">Any subject</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
          </select>

          <select value={semester} onChange={e=>setSemester(e.target.value === '' ? '' : Number(e.target.value))} className="p-1 border rounded w-28">
            <option value="">Select semester</option>
            {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={()=>fetchPrefs({ semester })}>Reload</button>
          <button
            className="bg-emerald-600 text-white px-3 py-1 rounded"
            onClick={async ()=>{
              if (semester === null || semester === undefined || semester === '') { setError('semester required to export'); return; }
              setExportLoading(true);
              try {
                const res = await axios.get(`/admin/preferences/${semester}/export`, { params: { top: topN }, responseType: 'blob' });
                const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `preferences_sem${semester}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                console.error(err);
                setError(err?.response?.data?.message || 'Could not export preferences CSV');
              } finally { setExportLoading(false); }
            }}
            disabled={exportLoading}
          >
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        {loading ? <div>Loading...</div> : (
          <>
            {viewMode === 'list' && (
              <>
                {data.length === 0 && !error && <div className="text-sm text-gray-500">No results for the selected filters</div>}
                {data.length > 0 && (
                  <div className="overflow-x-auto bg-white rounded shadow-sm">
                    <table className="min-w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-2 text-left">Teacher</th>
                          <th className="p-2 text-left">Subject</th>
                          <th className="p-2 text-left">Rank</th>
                          <th className="p-2 text-left">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((r, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{r.teacherName || r.teacherEmail || (r.teacherId ? (r.teacherId.name || r.teacherId) : '-')}</td>
                            <td className="p-2">{r.subjectName || String(r.subjectId || '')} <div className="text-xs text-gray-500">{r.subjectCode || ''}</div></td>
                            <td className="p-2">{r.rank ?? r.preferenceRank ?? '-'}</td>
                            <td className="p-2">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {viewMode === 'per-subject' && (
              <>
                {topResults.length === 0 && !error && <div className="text-sm text-gray-500">No per-subject results for this semester</div>}
                {topResults.length > 0 && (
                  <div className="overflow-x-auto bg-white rounded shadow-sm">
                    <table className="min-w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-2 text-left">Subject</th>
                          <th className="p-2 text-left">Top Teachers (rank)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topResults.map((s, idx) => (
                          <tr key={String(s.subjectId || idx)} className="border-t">
                            <td className="p-2">{s.subjectName || s.subjectCode || s.subjectId}</td>
                            <td className="p-2">
                              {Array.isArray(s.topTeachers) && s.topTeachers.length ? s.topTeachers.map((t, i) => (
                                <div key={i} className="text-sm">{t.teacherName || t.teacherEmail || t.teacherId} (#{t.rank})</div>
                              )) : <div className="text-sm text-gray-500">No preferences</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
