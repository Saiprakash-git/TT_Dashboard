import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from '../../api/axiosInstance';

export default function AssignSubjects(){
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [preferencesMap, setPreferencesMap] = useState({}); // subjectId -> [{teacherId, teacherName, rank}]
  const [allocations, setAllocations] = useState({}); // subjectId -> allocation
  const [prefLoading, setPrefLoading] = useState({});
  const [rowLoading, setRowLoading] = useState({});

  const fetchBatches = async ()=>{
    try{ const res = await axios.get('/admin/batches'); setBatches(res.data || []); return res.data || []; }catch(err){console.error(err); return []; } }

  useEffect(()=>{ fetchBatches(); }, []);

  const loadBatchSubjects = async (batch) => {
    if(!batch) return;
    setSelectedBatch(batch);
    // subjects are stored on batch.subjects
    const subjectsList = batch.subjects || [];
    setSubjects(subjectsList);
    // fetch allocations for this batch
    try{
      const resAlloc = await axios.get('/admin/allocations', { params: { semester: batch.currentSemester } });
      // filter by batch
      const batchAllocs = (resAlloc.data || []).filter(a => a.batch && String(a.batch._id || a.batch) === String(batch._id));
      const allocMap = {};
      batchAllocs.forEach(a => {
        const subjId = a.subject?._id || a.subject;
        if (subjId) allocMap[String(subjId)] = a;
      });
      setAllocations(allocMap);
    }catch(err){ console.error(err); }

    // Clear preferences map; we will lazy-load as selects are focused
    setPreferencesMap({});
  }

  const handleAssign = async (subjectId, teacherId) => {
    if(!selectedBatch) return alert('Select a batch');
    setRowLoading(prev => ({ ...prev, [subjectId]: true }));
    try{
      const res = await axios.post('/admin/assignments', { batchId: selectedBatch._id, subjectId, teacherId, semester: selectedBatch.currentSemester });
      alert('Assigned');
      // refresh batches and then reload subjects from the fresh batch object so we get any updates
      const freshBatches = await fetchBatches();
      const updatedBatch = (freshBatches || []).find(b => String(b._id) === String(selectedBatch._id));
      if (updatedBatch) {
        await loadBatchSubjects(updatedBatch);
      } else {
        // fallback: reload allocations for current batch id
        await loadBatchSubjects(selectedBatch);
      }
    }catch(err){ console.error(err); alert(err?.response?.data?.message || 'Failed to assign'); }
    finally { setRowLoading(prev => ({ ...prev, [subjectId]: false })); }
  }

  return (
    <div className="flex">
      <Sidebar role="admin" />
      <div className="flex-1">
        <Navbar role="admin" />
        <div className="p-6 max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Assign Subjects to Teachers</h2>
          <div className="mb-4">
            <label className="mr-2">Batch</label>
            <select onChange={e => loadBatchSubjects(batches.find(b=>b._id === e.target.value))} className="p-2 border rounded">
              <option value="">Select batch</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.branch || ''} {b.section || ''})</option>)}
            </select>
          </div>

          {selectedBatch && (
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold mb-3">Subjects for {selectedBatch.name} (semester {selectedBatch.currentSemester})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2 text-left">Subject</th>
                      <th className="p-2 text-left">Assigned Teacher</th>
                      <th className="p-2 text-left">Assign (by preference)</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map(s => (
                      <tr key={s._id} className="border-t">
                            <td className="p-2">{s.name} <div className="text-xs text-gray-500">{s.code}</div></td>
                            <td className="p-2">{allocations[s._id] ? (allocations[s._id].teacherName || allocations[s._id].teacher) : <span className="text-sm text-gray-500">Unassigned</span>}</td>
                            {allocations[s._id] ? (
                              <>
                                <td className="p-2">{allocations[s._id].teacherName || allocations[s._id].teacher}</td>
                                <td className="p-2"><span className="text-sm text-gray-500">Assigned (permanent)</span></td>
                              </>
                            ) : (
                              <>
                                <td className="p-2">
                                  <select
                                    id={`sel-${s._id}`}
                                    className="p-2 border rounded w-64"
                                    onFocus={async (e) => {
                                      // lazy-load preferences when user focuses the select
                                      if (preferencesMap[s._id] !== undefined) return;
                                      setPrefLoading(prev => ({ ...prev, [s._id]: true }));
                                      try {
                                        const res = await axios.get(`/admin/subject/${s._id}/preferences`, { params: { semester: selectedBatch.currentSemester } });
                                        setPreferencesMap(prev => ({ ...prev, [s._id]: res.data || [] }));
                                      } catch (err) {
                                        console.error('pref', err);
                                        setPreferencesMap(prev => ({ ...prev, [s._id]: [] }));
                                      } finally {
                                        setPrefLoading(prev => ({ ...prev, [s._id]: false }));
                                      }
                                    }}
                                  >
                                    <option value="">-- select teacher --</option>
                                    {prefLoading[s._id] ? (
                                      <option value="">Loading...</option>
                                    ) : (
                                      (preferencesMap[s._id] || []).map(t => (
                                        <option key={t.teacherId} value={t.teacherId}>{t.teacherName} (Rank {t.rank})</option>
                                      ))
                                    )}
                                  </select>
                                </td>
                                <td className="p-2">
                                  <button
                                    onClick={() => {
                                      const sel = document.getElementById(`sel-${s._id}`);
                                      if(!sel) return;
                                      const teacherId = sel.value;
                                      if(!teacherId) return alert('Select teacher');
                                      handleAssign(s._id, teacherId);
                                    }}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded"
                                    disabled={!!rowLoading[s._id]}
                                  >
                                    {rowLoading[s._id] ? 'Assigning...' : 'Assign'}
                                  </button>
                                </td>
                              </>
                            )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
